import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  isPreparing: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPreparing: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState((s) => ({ ...s, isPreparing: true }));

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        clearTimer();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        setState((s) => ({
          ...s,
          isRecording: false,
          isPreparing: false,
          duration: s.duration,
          audioBlob: blob,
          audioUrl: url,
        }));
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setState((s) => ({ ...s, duration: Math.floor((Date.now() - startTime) / 1000) }));
      }, 200);

      setState((s) => ({ ...s, isRecording: true, isPreparing: false, duration: 0, audioBlob: null, audioUrl: null }));
    } catch {
      setState((s) => ({ ...s, isPreparing: false }));
    }
  }, [clearTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    stopStream();
  }, [stopStream]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    stopStream();
    clearTimer();
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    setState({
      isRecording: false,
      isPreparing: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
    });
  }, [stopStream, clearTimer, state.audioUrl]);

  const discardAudio = useCallback(() => {
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    setState((s) => ({ ...s, audioBlob: null, audioUrl: null, duration: 0 }));
  }, [state.audioUrl]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
      if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    };
  }, [clearTimer, stopStream, state.audioUrl]);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    discardAudio,
  };
}
