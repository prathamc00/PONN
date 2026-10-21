import { useState, useEffect, useCallback, useRef } from 'react';

export function useAntiCheat({ enabled = true, maxViolations = 3, onViolation, onMaxViolationsReached } = {}) {
  const [violations, setViolations] = useState(0);
  const violationRef = useRef(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningReason, setWarningReason] = useState('');
  const wasFullscreenRef = useRef(false);
  const ignoreNextFsChangeRef = useRef(false);

  const incrementViolation = useCallback((reason) => {
    violationRef.current += 1;
    setViolations(violationRef.current);
    setWarningReason(reason || 'Focus violation detected');
    onViolation?.(violationRef.current, reason);
    if (violationRef.current >= maxViolations) {
      onMaxViolationsReached?.();
    } else {
      setIsWarningModalOpen(true);
    }
  }, [maxViolations, onViolation, onMaxViolationsReached]);

  const requestFullscreen = async () => {
    try {
      const docEl = document.documentElement;
      ignoreNextFsChangeRef.current = true;
      if (docEl.requestFullscreen) await docEl.requestFullscreen();
      else if (docEl.webkitRequestFullscreen) await docEl.webkitRequestFullscreen();
      else if (docEl.mozRequestFullScreen) await docEl.mozRequestFullScreen();
      else if (docEl.msRequestFullscreen) await docEl.msRequestFullscreen();
    } catch (err) {
      ignoreNextFsChangeRef.current = false;
      console.warn('Fullscreen request bypassed:', err.message);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        incrementViolation('Switched Tabs or Minimized Window');
      }
    };

    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement || !!document.webkitFullscreenElement || !!document.mozFullScreenElement || !!document.msFullscreenElement;
      setIsFullscreen(isFs);
      if (isFs) {
        wasFullscreenRef.current = true;
        ignoreNextFsChangeRef.current = false;
        return;
      }
      if (!isFs && wasFullscreenRef.current && !ignoreNextFsChangeRef.current) {
        wasFullscreenRef.current = false;
        incrementViolation('Exited Fullscreen Mode');
      }
      ignoreNextFsChangeRef.current = false;
    };

    const preventContext = (e) => e.preventDefault();
    const preventKeydowns = (e) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'u' || e.key === 'U')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I')) ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        incrementViolation('Restricted Shortcut Detected');
      }
    };

    const preventBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your exam progress will be lost.';
      return e.returnValue;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', preventContext);
    document.addEventListener('keydown', preventKeydowns);
    window.addEventListener('beforeunload', preventBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', preventContext);
      document.removeEventListener('keydown', preventKeydowns);
      window.removeEventListener('beforeunload', preventBeforeUnload);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [incrementViolation, enabled]);

  const closeWarningModal = () => setIsWarningModalOpen(false);

  return {
    violations,
    maxViolations,
    isFullscreen,
    requestFullscreen,
    isWarningModalOpen,
    setIsWarningModalOpen,
    warningReason,
    closeWarningModal,
  };
}
