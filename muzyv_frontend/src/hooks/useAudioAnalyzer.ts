import { useEffect, useRef, useState } from 'react';

interface AudioState {
  isPlaying: boolean;
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  analyser: AnalyserNode | null;
  audioElement: HTMLAudioElement | null;
  gainNode: GainNode | null;
}

export const useAudioAnalyzer = (audioFile: File | null) => {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    audioContext: null,
    sourceNode: null,
    analyser: null,
    audioElement: null,
    gainNode: null
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Refs for cleanup and direct manipulation
  const contextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Sync isMuted with gainNode
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = isMuted ? 0 : 1;
    }
  }, [isMuted]);

  useEffect(() => {
    let interval: number;
    if (audioFile) {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      if (contextRef.current) {
        contextRef.current.close();
      }

      const audio = new Audio(URL.createObjectURL(audioFile));
      audio.loop = true;
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };

      interval = window.setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }, 100);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      contextRef.current = ctx;

      const ana = ctx.createAnalyser();
      ana.fftSize = 2048; 

      const gain = ctx.createGain();
      gain.gain.value = isMuted ? 0 : 1;
      gainRef.current = gain;

      const source = ctx.createMediaElementSource(audio);
      source.connect(ana);
      ana.connect(gain);
      gain.connect(ctx.destination);

      const handlePlay = () => setState(prev => ({ ...prev, isPlaying: true }));
      const handlePause = () => setState(prev => ({ ...prev, isPlaying: false }));
      const handleEnded = () => setState(prev => ({ ...prev, isPlaying: false }));

      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);

      setState({
        isPlaying: false,
        audioContext: ctx,
        sourceNode: source,
        analyser: ana,
        audioElement: audio,
        gainNode: gain
      });

      return () => {
        if (interval) clearInterval(interval);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
        URL.revokeObjectURL(audio.src);
        if (contextRef.current) contextRef.current.close();
      };
    }
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
      setCurrentTime(0);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const muteOutput = () => {
    if (gainRef.current) {
      gainRef.current.gain.value = 0;
    }
  };

  const unmuteOutput = () => {
    if (gainRef.current && !isMuted) {
      gainRef.current.gain.value = 1;
    }
  };

  const resetAudioForRecording = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.loop = false;
      // We don't pause here because handleStartRecording will manage play/pause
    }
    muteOutput();
  };

  const restoreAudioAfterRecording = () => {
    if (audioRef.current) {
      audioRef.current.loop = true;
    }
    unmuteOutput();
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  return { 
    ...state,
    currentTime,
    duration,
    isMuted,
    togglePlay,
    toggleMute,
    stop,
    seek,
    resetAudioForRecording,
    restoreAudioAfterRecording,
    muteOutput,
    unmuteOutput
  };
};