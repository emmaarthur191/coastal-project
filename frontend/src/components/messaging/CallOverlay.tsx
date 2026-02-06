import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, Minimize2, Maximize2 } from 'lucide-react';
import { logger } from '../../utils/logger';
import './CallOverlay.css';

interface Participant {
    id: string;
    first_name: string;
    last_name?: string;
}

interface ActiveCall {
    id: string;
    type: 'video' | 'audio';
    participants: Participant[];
    isInitiator: boolean;
}

interface CallOverlayProps {
    activeCall: ActiveCall;
    onEndCall: () => void;
    wsManager: any;
    currentUser: any;
    incomingSignal: any;
}

const CallOverlay: React.FC<CallOverlayProps> = ({
    activeCall,
    onEndCall,
    wsManager,
    currentUser,
    incomingSignal,
}) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callStatus, setCallStatus] = useState<'initializing' | 'calling' | 'connected' | 'ended'>('initializing');
    const [isMinimized, setIsMinimized] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const signalQueue = useRef<any[]>([]);
    const isEndingRef = useRef(false);

    // WebRTC Configuration
    const rtcConfig: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };

    const handleEndCall = useCallback(() => {
        if (isEndingRef.current) return;
        isEndingRef.current = true;

        logger.log('[CALL] Ending call and cleaning up resources');

        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                logger.log(`[CALL] Stop local track: ${track.kind}`);
            });
        }

        // Notify all peers
        activeCall.participants.forEach(p => {
            try {
                wsManager.sendEndCall(p.id);
            } catch (err) {
                logger.warn(`[CALL] Failed to send end call signal to ${p.id}`);
            }
        });

        // Close all peer connections
        peerConnections.current.forEach((pc, userId) => {
            pc.onicecandidate = null;
            pc.ontrack = null;
            pc.onconnectionstatechange = null;
            pc.close();
            logger.log(`[CALL] Closed PeerConnection for ${userId}`);
        });
        peerConnections.current.clear();

        onEndCall();
        setCallStatus('ended');
    }, [localStream, onEndCall, wsManager, activeCall.participants]);

    // Create RTCPeerConnection helper
    const createPeerConnection = useCallback(async (participant: Participant, stream: MediaStream) => {
        if (peerConnections.current.has(participant.id)) return;

        logger.log(`[CALL] Creating PeerConnection for ${participant.first_name} (${participant.id})`);
        const pc = new RTCPeerConnection(rtcConfig);
        peerConnections.current.set(participant.id, pc);

        // Add local tracks
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Handle remote tracks
        pc.ontrack = (event) => {
            logger.log(`[CALL] Received remote track from ${participant.id} (tracks: ${event.streams[0]?.getTracks().length})`);
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.set(participant.id, event.streams[0]);
                return newMap;
            });
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && !isEndingRef.current) {
                wsManager.sendCandidate(event.candidate, participant.id);
            }
        };

        // Connection state changes
        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            logger.log(`[CALL] Connection state for ${participant.id}: ${state}`);

            if (state === 'connected') {
                setCallStatus('connected');
            } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                logger.log(`[CALL] Peer ${participant.id} connection state is ${state}`);

                // If it's closed/failed, clean up
                if (state === 'failed' || state === 'closed') {
                    peerConnections.current.delete(participant.id);
                    setRemoteStreams(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(participant.id);
                        return newMap;
                    });

                    if (peerConnections.current.size === 0 && !isEndingRef.current) {
                        handleEndCall();
                    }
                }
            }
        };

        // If initiator, create offer immediately
        if (activeCall.isInitiator) {
            try {
                logger.log(`[CALL] Creating offer for ${participant.id}`);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                wsManager.sendOffer(offer, participant.id);
            } catch (err) {
                logger.error(`[CALL] Error creating offer for ${participant.id}:`, err);
            }
        }

        return pc;
    }, [activeCall.isInitiator, wsManager, handleEndCall]);

    // Handle Incoming Signals
    const processSignal = useCallback(async (signal: any) => {
        try {
            const { type, offer, answer, candidate, sender_id } = signal;
            const senderId = sender_id;

            let pc = peerConnections.current.get(senderId);

            if (!pc && type === 'call_offer' && !activeCall.isInitiator) {
                const participant = activeCall.participants.find(p => p.id === senderId) || { id: senderId, first_name: 'Unknown' };
                if (localStream) {
                    pc = await createPeerConnection(participant, localStream);
                } else {
                    logger.warn('[CALL] localStream not ready, queuing signal');
                    signalQueue.current.push(signal);
                    return;
                }
            }

            if (!pc) {
                if (type === 'new_ice_candidate') {
                    logger.warn(`[CALL] Received ICE candidate before PeerConnection for ${senderId}, queuing`);
                    signalQueue.current.push(signal);
                } else {
                    logger.warn(`[CALL] Received signal ${type} from unknown/uninitialized peer ${senderId}`);
                }
                return;
            }

            switch (type) {
                case 'call_offer':
                    if (!activeCall.isInitiator) {
                        logger.log(`[CALL] Handling offer from ${senderId}`);
                        await pc.setRemoteDescription(new RTCSessionDescription(offer));
                        const answerSd = await pc.createAnswer();
                        await pc.setLocalDescription(answerSd);
                        wsManager.sendAnswer(answerSd, senderId);
                    }
                    break;
                case 'call_answer':
                    if (activeCall.isInitiator) {
                        logger.log(`[CALL] Handling answer from ${senderId}`);
                        await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    }
                    break;
                case 'new_ice_candidate':
                    logger.log(`[CALL] Handling candidate from ${senderId}`);
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        logger.error('[CALL] Error adding ice candidate:', e);
                    }
                    break;
                case 'call_end':
                    logger.log(`[CALL] Peer ${senderId} ended call`);
                    pc.close();
                    peerConnections.current.delete(senderId);
                    setRemoteStreams(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(senderId);
                        return newMap;
                    });
                    if (peerConnections.current.size === 0) handleEndCall();
                    break;
            }
        } catch (error) {
            logger.error('[CALL] Error processing signal:', error);
        }
    }, [localStream, activeCall.isInitiator, createPeerConnection, handleEndCall, wsManager]);

    // Initialize Call
    useEffect(() => {
        let isCancelled = false;

        const startCall = async () => {
            try {
                logger.log('[CALL] Initializing local media');
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: activeCall.type === 'video'
                });

                if (isCancelled) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                activeCall.participants.forEach(participant => {
                    createPeerConnection(participant, stream);
                });

                setCallStatus('calling');
            } catch (error) {
                logger.error('[CALL] Media access error:', error);
                alert('Could not access camera/microphone. Please check permissions.');
                handleEndCall();
            }
        };

        startCall();

        return () => {
            isCancelled = true;
            handleEndCall();
        };
    }, []); // Only on mount

    // Process queued signals when localStream becomes available
    useEffect(() => {
        if (localStream && signalQueue.current.length > 0) {
            logger.log(`[CALL] Processing ${signalQueue.current.length} queued signals`);
            const queue = [...signalQueue.current];
            signalQueue.current = [];
            queue.forEach(processSignal);
        }
    }, [localStream, processSignal]);

    // Handle Incoming Signals from parent
    useEffect(() => {
        if (incomingSignal) {
            processSignal(incomingSignal);
        }
    }, [incomingSignal, processSignal]);

    const toggleMute = () => {
        if (localStream) {
            const newState = !isMuted;
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !newState;
            });
            setIsMuted(newState);
            logger.log(`[CALL] ${newState ? 'Muted' : 'Unmuted'} microphone`);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const newState = !isVideoOff;
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !newState;
            });
            setIsVideoOff(newState);
            logger.log(`[CALL] Video ${newState ? 'off' : 'on'}`);
        }
    };

    const renderRemoteVideos = () => {
        const streams = Array.from(remoteStreams.entries()) as [string, MediaStream][];

        if (streams.length === 0) {
            return (
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <div className="flex space-x-4 mb-8">
                        {activeCall.participants.map(p => (
                            <div key={p.id} className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-2 animate-pulse border-2 border-primary/30">
                                    <span className="text-2xl text-white font-bold">
                                        {p.first_name?.[0]}{p.last_name?.[0]}
                                    </span>
                                </div>
                                <span className="text-white text-sm font-medium">{p.first_name}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-white text-xl animate-pulse font-light tracking-wide">
                        {callStatus === 'calling' ? 'Calling...' : 'Connecting...'}
                    </p>
                </div>
            );
        }

        const gridCols = streams.length === 1 ? 'grid-cols-1' : streams.length <= 4 ? 'grid-cols-2' : 'grid-cols-3';

        return (
            <div className={`w-full h-full grid ${gridCols} gap-4 p-4`}>
                {streams.map(([userId, stream]) => {
                    const participant = activeCall.participants.find(p => p.id === userId) || { first_name: 'Unknown', last_name: '' } as Participant;
                    return (
                        <div key={userId} className="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
                            <video
                                ref={el => { if (el) el.srcObject = stream; }}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                {participant.first_name} {participant.last_name}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (isMinimized) {
        return (
            <div
                className="fixed bottom-6 right-6 w-56 h-36 bg-gray-900 rounded-2xl shadow-2xl z-[200] overflow-hidden cursor-pointer border border-white/20 flex flex-col items-center justify-center group hover:scale-105 transition-transform"
                onClick={() => setIsMinimized(false)}
            >
                {remoteStreams.size > 0 ? (
                    <div className="absolute inset-0">
                        {/* Show first remote stream if available */}
                        <video
                            ref={el => { if (el && Array.from(remoteStreams.values())[0]) el.srcObject = Array.from(remoteStreams.values())[0]; }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover opacity-60"
                        />
                    </div>
                ) : null}
                <div className="z-10 flex flex-col items-center">
                    <span className="text-white font-bold drop-shadow-lg">
                        {remoteStreams.size > 0 ? `${remoteStreams.size} Active` : 'Calling...'}
                    </span>
                    <div className="flex items-center space-x-2 mt-1">
                        <div className="bg-green-500 w-2 h-2 rounded-full animate-ping"></div>
                        <span className="text-green-400 text-xs font-mono uppercase tracking-tighter">Live</span>
                    </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="text-white w-4 h-4" />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-950 z-[100] flex flex-col font-sans">
            {/* Main Remote Video Grid */}
            <div className="relative flex-1 bg-black overflow-hidden">
                {renderRemoteVideos()}

                {/* Local Video Picture-in-Picture */}
                <div className="absolute top-6 right-6 w-36 h-52 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-all hover:scale-110 z-20 group">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover mirror-video ${isVideoOff ? 'hidden' : ''}`}
                    />
                    {isVideoOff && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                                <VideoOff className="text-gray-400 w-8 h-8" />
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-black/40 text-[10px] text-white px-2 py-0.5 rounded-full backdrop-blur-sm">You</span>
                    </div>
                </div>

                <button
                    onClick={() => setIsMinimized(true)}
                    className="absolute top-6 left-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white z-20 transition-colors border border-white/10"
                    aria-label="Minimize call"
                    title="Minimize call"
                >
                    <Minimize2 className="w-5 h-5" />
                </button>
            </div>

            {/* Controls Bar */}
            <div className="h-28 bg-gray-900/50 backdrop-blur-xl flex items-center justify-center space-x-8 pb-6 border-t border-white/5">
                <button
                    onClick={toggleMute}
                    className={`p-5 rounded-3xl transition-all ${isMuted ? 'bg-white text-gray-900 shadow-xl' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
                    aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                    title={isMuted ? "Unmute microphone" : "Mute microphone"}
                >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <button
                    onClick={handleEndCall}
                    className="p-6 rounded-[2rem] bg-red-500 text-white hover:bg-red-600 transition-all transform hover:scale-110 shadow-2xl shadow-red-500/40 border border-red-400/20"
                    aria-label="End call"
                    title="End call"
                >
                    <Phone className="w-8 h-8 transform rotate-[135deg]" />
                </button>

                <button
                    onClick={toggleVideo}
                    className={`p-5 rounded-3xl transition-all ${isVideoOff ? 'bg-white text-gray-900 shadow-xl' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
                    aria-label={isVideoOff ? "Turn camera on" : "Turn camera off"}
                    title={isVideoOff ? "Turn camera on" : "Turn camera off"}
                >
                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
};

export default CallOverlay;
