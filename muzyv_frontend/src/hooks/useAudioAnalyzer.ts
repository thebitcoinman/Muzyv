import { useEffect, useRef, useState } from 'react';

interface AudioState {
  isPlaying: boolean;
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  analyser: AnalyserNode | null;
  audioElement: HTMLAudioElement | null;
}

export const useAudioAnalyzer = (audioFile: File | null) => {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    audioContext: null,
    sourceNode: null,
    analyser: null,
    audioElement: null
  });

  // Refs for cleanup
  const contextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioFile) {
      // Cleanup previous
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      if (contextRef.current) {
        contextRef.current.close();
      }

      const audio = new Audio(URL.createObjectURL(audioFile));
      audio.loop = true;
      audioRef.current = audio;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      contextRef.current = ctx;

      const ana = ctx.createAnalyser();
      ana.fftSize = 2048; 

      const source = ctx.createMediaElementSource(audio);
      source.connect(ana);
      ana.connect(ctx.destination);

      // Handle play/pause state
      audio.onplay = () => setState(prev => ({ ...prev, isPlaying: true }));
      audio.onpause = () => setState(prev => ({ ...prev, isPlaying: false }));
      audio.onended = () => setState(prev => ({ ...prev, isPlaying: false }));

      // Update state once
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({
        isPlaying: false,
        audioContext: ctx,
        sourceNode: source,
        analyser: ana,
        audioElement: audio
      });
    }

    return () => {
      if (contextRef.current) {
        contextRef.current.close();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, [audioFile]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        contextRef.current?.resume();
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const resetAudioForRecording = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.loop = false;
      audioRef.current.pause();
    }
  };

  const restoreAudioAfterRecording = () => {
    if (audioRef.current) {
      audioRef.current.loop = true;
    }
  };

  return { 
    ...state,
    togglePlay,
    stop,
    resetAudioForRecording,
    restoreAudioAfterRecording
  };
};
