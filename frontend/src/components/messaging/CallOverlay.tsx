import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, MonitorSmartphone, Minimize2, Maximize2 } from 'lucide-react';

const CallOverlay = ({
    activeCall,
    onEndCall,
    wsManager,
    currentUser,
    incomingSignal, // Latest signaling message passed from parent
}) => {
    const [localStream, setLocalStream] = useState(null);
    // Map of userId -> MediaStream
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callStatus, setCallStatus] = useState('initializing'); // initializing, calling, connected, ended
    const [isMinimized, setIsMinimized] = useState(false);

    const localVideoRef = useRef(null);
    // Map of userId -> RTCPeerConnection
    const peerConnections = useRef(new Map());

    // WebRTC Configuration
    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };

    // Initialize Call for all participants
    useEffect(() => {
        const startCall = async () => {
            try {
                console.log('[CALL] Starting call with participants:', activeCall.participants);
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: activeCall.type === 'video'
                });

                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Create a PeerConnection for EACH participant
                activeCall.participants.forEach(participant => {
                    createPeerConnection(participant, stream);
                });

                setCallStatus('calling');

            } catch (error) {
                console.error('[CALL] Error accessing media devices:', error);
                alert('Could not access camera/microphone. Please check permissions.');
                handleEndCall();
            }
        };

        startCall();

        return () => {
            // Cleanup all connections
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            peerConnections.current.forEach(pc => pc.close());
            peerConnections.current.clear();
        };
    }, []); // Run once on mount

    // Create RTCPeerConnection helper
    const createPeerConnection = async (participant, stream) => {
        if (peerConnections.current.has(participant.id)) return;

        console.log(`[CALL] Creating PeerConnection for ${participant.first_name} (${participant.id})`);
        const pc = new RTCPeerConnection(rtcConfig);
        peerConnections.current.set(participant.id, pc);

        // Add local tracks
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Handle remote tracks
        pc.ontrack = (event) => {
            console.log(`[CALL] Received remote track from ${participant.id}`);
            setRemoteStreams(prev => new Map(prev.set(participant.id, event.streams[0])));
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                wsManager.sendCandidate(event.candidate, participant.id);
            }
        };

        // Connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`[CALL] Connection state for ${participant.id}:`, pc.connectionState);
            if (pc.connectionState === 'connected') {
                setCallStatus('connected');
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                // Remove this peer only
                console.log(`[CALL] Peer ${participant.id} disconnected`);
                peerConnections.current.get(participant.id)?.close();
                peerConnections.current.delete(participant.id);
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(participant.id);
                    return newMap;
                });

                // If no peers left, end call
                if (peerConnections.current.size === 0) {
                    handleEndCall();
                }
            }
        };

        // If initiator, create offer immediately
        if (activeCall.isInitiator) {
            try {
                console.log(`[CALL] Creating offer for ${participant.id}`);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                wsManager.sendOffer(offer, participant.id);
            } catch (err) {
                console.error(`[CALL] Error creating offer for ${participant.id}:`, err);
            }
        }
    };

    // Handle Incoming Signals
    useEffect(() => {
        if (!incomingSignal) return;

        const handleSignal = async () => {
            try {
                const { type, offer, answer, candidate, sender_id } = incomingSignal;
                const senderId = sender_id; // Ensure consistent naming

                // Find or create PC for this sender
                let pc = peerConnections.current.get(senderId);

                // If we are receiver receiving an OFFER, we might not have a PC yet if we just started
                if (!pc && type === 'call_offer' && !activeCall.isInitiator) {
                    // Identify the participant object
                    const participant = activeCall.participants.find(p => p.id === senderId) || { id: senderId, first_name: 'Unknown' };
                    // We need local stream to create PC
                    if (localStream) {
                        await createPeerConnection(participant, localStream);
                        pc = peerConnections.current.get(senderId);
                    } else {
                        // Wait for local stream? This race condition is tricky.
                        // Ideally startCall establishes stream first.
                        console.warn('[CALL] Received offer but local stream not ready');
                        return;
                    }
                }

                if (!pc) {
                    console.warn(`[CALL] Received signal from unknown peer ${senderId}`);
                    return;
                }

                if (type === 'call_offer' && !activeCall.isInitiator) {
                    console.log(`[CALL] Handling offer from ${senderId}`);
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));
                    const answerSd = await pc.createAnswer();
                    await pc.setLocalDescription(answerSd);
                    wsManager.sendAnswer(answerSd, senderId);
                    setCallStatus('connected');
                } else if (type === 'call_answer' && activeCall.isInitiator) {
                    console.log(`[CALL] Handling answer from ${senderId}`);
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    setCallStatus('connected');
                } else if (type === 'new_ice_candidate') {
                    console.log(`[CALL] Handling candidate from ${senderId}`);
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } else if (type === 'call_end') {
                    console.log(`[CALL] Peer ${senderId} ended call`);
                    pc.close();
                    peerConnections.current.delete(senderId);
                    setRemoteStreams(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(senderId);
                        return newMap;
                    });
                    if (peerConnections.current.size === 0) handleEndCall();
                }
            } catch (error) {
                console.error('[CALL] Error handling signal:', error);
            }
        };

        handleSignal();

    }, [incomingSignal, activeCall.isInitiator, wsManager, localStream]); // Added localStream dependency

    const handleEndCall = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        // Notify all peers
        activeCall.participants.forEach(p => {
            wsManager.sendEndCall(p.id);
        });

        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
        onEndCall();
    }, [localStream, onEndCall, wsManager, activeCall.participants]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    // Render Logic for Grid
    const renderRemoteVideos = () => {
        const streams = Array.from(remoteStreams.entries());

        if (streams.length === 0) {
            // Waiting for connection
            return (
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <div className="flex space-x-4 mb-8">
                        {activeCall.participants.map(p => (
                            <div key={p.id} className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-2 animate-pulse">
                                    <span className="text-2xl text-white font-bold">
                                        {p.first_name?.[0]}{p.last_name?.[0]}
                                    </span>
                                </div>
                                <span className="text-white text-sm">{p.first_name}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-white text-xl animate-pulse">
                        {callStatus === 'calling' ? 'Calling participants...' : 'Connecting...'}
                    </p>
                </div>
            );
        }

        // Grid Layout logic
        const gridCols = streams.length === 1 ? 'grid-cols-1' : streams.length <= 4 ? 'grid-cols-2' : 'grid-cols-3';

        return (
            <div className={`w-full h-full grid ${gridCols} gap-4 p-4`}>
                {streams.map(([userId, stream]) => {
                    // Find user info
                    const participant = activeCall.participants.find(p => p.id === userId) || { first_name: 'Unknown' };
                    return (
                        <div key={userId} className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                            <video
                                ref={el => { if (el) el.srcObject = stream; }}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
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
            <div className="fixed bottom-4 right-4 w-48 h-32 bg-gray-900 rounded-xl shadow-2xl z-50 overflow-hidden cursor-pointer border border-gray-700 flex items-center justify-center"
                onClick={() => setIsMinimized(false)}>
                <span className="text-white font-bold">
                    {remoteStreams.size > 0 ? `${remoteStreams.size} Active` : 'Call Active'}
                </span>
                <div className="absolute bottom-2 right-2 bg-green-500 w-3 h-3 rounded-full animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900 z-[100] flex flex-col">
            {/* Main Remote Video Grid */}
            <div className="relative flex-1 bg-black">
                {renderRemoteVideos()}

                {/* Local Video Picture-in-Picture */}
                <div className="absolute top-4 right-4 w-32 h-48 bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 transition-all hover:scale-105 z-10">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                        style={{ transform: 'scaleX(-1)' }}
                    />
                    {isVideoOff && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <VideoOff className="text-white w-8 h-8" />
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setIsMinimized(true)}
                    className="absolute top-4 left-4 p-2 bg-black/40 rounded-full hover:bg-black/60 text-white z-10"
                >
                    <Minimize2 className="w-6 h-6" />
                </button>
            </div>

            {/* Controls Bar */}
            <div className="h-24 bg-gray-900 flex items-center justify-center space-x-8 pb-4">
                <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <button
                    onClick={handleEndCall}
                    className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all transform hover:scale-110 shadow-lg shadow-red-600/30"
                >
                    <Phone className="w-8 h-8 transform rotate-[135deg]" />
                </button>

                <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                >
                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
};

export default CallOverlay;
