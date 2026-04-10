import { useState, useEffect, useCallback, useRef } from 'react';

interface AntiCheatOptions {
  enabled?: boolean;
  maxViolations?: number;
  onViolation?: (violations: number, reason: string) => void;
  onMaxViolationsReached?: () => void;
}

export function useAntiCheat({ enabled = true, maxViolations = 3, onViolation, onMaxViolationsReached }: AntiCheatOptions) {
  const [violations, setViolations] = useState(0);
  const violationRef = useRef(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  
  // Track whether user actually entered fullscreen – only then flag exits
  const wasFullscreenRef = useRef(false);
  // Ignore the initial fullscreenchange event that fires when entering fullscreen
  const ignoreNextFsChangeRef = useRef(false);

  const incrementViolation = useCallback((reason: string) => {
    violationRef.current += 1;
    setViolations(violationRef.current);
    onViolation?.(violationRef.current, reason);
    if (violationRef.current >= maxViolations) {
      onMaxViolationsReached?.();
    } else {
      setIsWarningModalOpen(true);
    }
  }, [maxViolations, onViolation, onMaxViolationsReached]);

  const requestFullscreen = async () => {
    try {
      const docEl = document.documentElement as any;
      // Signal we're about to enter fullscreen so handler can ignore entry event
      ignoreNextFsChangeRef.current = true;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
    } catch (err) {
      ignoreNextFsChangeRef.current = false;
      console.error('Error attempting to enable fullscreen:', err);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      // Tab switching is always a violation regardless of fullscreen status
      if (document.visibilityState === 'hidden') {
        incrementViolation('Switched Tabs or Minimized Window');
      }
    };

    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement ||
        !!(document as any).webkitFullscreenElement ||
        !!(document as any).mozFullScreenElement ||
        !!(document as any).msFullscreenElement;

      setIsFullscreen(isFs);

      if (isFs) {
        // User entered fullscreen
        wasFullscreenRef.current = true;
        ignoreNextFsChangeRef.current = false;
        return;
      }

      // User exited fullscreen — only flag if they were confirmed to be in it
      if (!isFs && wasFullscreenRef.current && !ignoreNextFsChangeRef.current) {
        wasFullscreenRef.current = false;
        incrementViolation('Exited Fullscreen Mode');
      }
      ignoreNextFsChangeRef.current = false;
    };

    const preventContext = (e: MouseEvent) => {
      e.preventDefault();
    };

    const preventKeydowns = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'u' || e.key === 'U')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I')) ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        incrementViolation('Used Restricted Keyboard Shortcuts');
      }
    };

    const preventBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your quiz progress may be lost.';
      return e.returnValue;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', preventContext);
    document.addEventListener('keydown', preventKeydowns);
    window.addEventListener('beforeunload', preventBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
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
    closeWarningModal,
  };
}
