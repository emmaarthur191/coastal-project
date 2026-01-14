import React, { useState, useEffect } from 'react';

const NetworkStatusIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Hide "back online" banner after a few seconds
            setTimeout(() => setShowBanner(false), 3000);
        };
        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showBanner && isOnline) return null;

    return (
        <div className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 transform ${showBanner ? 'translate-y-0' : '-translate-y-full'
            }`}>
            <div className={`${isOnline
                    ? 'bg-green-600'
                    : 'bg-red-600'
                } text-white px-4 py-2 text-center text-sm font-bold shadow-lg flex items-center justify-center gap-2`}>
                {!isOnline && (
                    <svg className="animate-pulse w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0-12.728L5.636 18.364m12.728-12.728L5.636 5.636" />
                    </svg>
                )}
                <span>
                    {isOnline
                        ? 'Connection Restored'
                        : 'You are currently offline. Some features may be unavailable.'}
                </span>
            </div>
        </div>
    );
};

export default NetworkStatusIndicator;
