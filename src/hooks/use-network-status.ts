import { useEffect, useRef, useState } from 'react';

interface NetworkInformationLike extends EventTarget {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformationLike;
  mozConnection?: NetworkInformationLike;
  webkitConnection?: NetworkInformationLike;
}

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string | null;
  effectiveType: string | null;
  downlinkMbps: number | null;
  rttMs: number | null;
}

interface UseNetworkStatusOptions {
  offlineGraceMs?: number;
}

function getConnection(nav: NavigatorWithConnection): NetworkInformationLike | null {
  return nav.connection || nav.mozConnection || nav.webkitConnection || null;
}

function readStatus(): NetworkStatus {
  if (typeof navigator === 'undefined') {
    return {
      isOnline: true,
      connectionType: null,
      effectiveType: null,
      downlinkMbps: null,
      rttMs: null,
    };
  }

  const nav = navigator as NavigatorWithConnection;
  const connection = getConnection(nav);

  return {
    isOnline: navigator.onLine,
    connectionType: typeof connection?.type === 'string' ? connection.type : null,
    effectiveType: typeof connection?.effectiveType === 'string' ? connection.effectiveType : null,
    downlinkMbps: typeof connection?.downlink === 'number' ? connection.downlink : null,
    rttMs: typeof connection?.rtt === 'number' ? connection.rtt : null,
  };
}

function isSameStatus(a: NetworkStatus, b: NetworkStatus): boolean {
  return (
    a.isOnline === b.isOnline &&
    a.connectionType === b.connectionType &&
    a.effectiveType === b.effectiveType &&
    a.downlinkMbps === b.downlinkMbps &&
    a.rttMs === b.rttMs
  );
}

export function useNetworkStatus(options: UseNetworkStatusOptions = {}): NetworkStatus {
  const offlineGraceMs = Math.max(0, options.offlineGraceMs ?? 2500);
  const [status, setStatus] = useState<NetworkStatus>(() => readStatus());
  const offlineTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const nav = navigator as NavigatorWithConnection;
    const connection = getConnection(nav);

    const setFreshStatus = () => {
      const next = readStatus();
      setStatus((prev) => (isSameStatus(prev, next) ? prev : next));
    };

    const clearOfflineTimer = () => {
      if (offlineTimerRef.current === null) return;
      window.clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = null;
    };

    const handleOnline = () => {
      clearOfflineTimer();
      setFreshStatus();
    };

    const handleOffline = () => {
      clearOfflineTimer();

      if (offlineGraceMs === 0) {
        setFreshStatus();
        return;
      }

      offlineTimerRef.current = window.setTimeout(() => {
        offlineTimerRef.current = null;
        setFreshStatus();
      }, offlineGraceMs);
    };

    const handleConnectionChange = () => {
      if (navigator.onLine) {
        handleOnline();
      } else {
        handleOffline();
      }
    };

    setFreshStatus();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    connection?.addEventListener('change', handleConnectionChange);

    return () => {
      clearOfflineTimer();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      connection?.removeEventListener('change', handleConnectionChange);
    };
  }, [offlineGraceMs]);

  return status;
}
