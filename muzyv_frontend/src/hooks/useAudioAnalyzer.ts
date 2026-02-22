import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioState {
  isPlaying: boolean;
  isReady: boolean;
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  analyser: AnalyserNode | null;
  audioElement: HTMLAudioElement | null;
  fadeGainNode: GainNode | null;
  outputGainNode: GainNode | null;
  audioBuffer: AudioBuffer | null;
}

let globalAudioContext: AudioContext | null = null;

export const useAudioAnalyzer = (audioFile: File | null) => {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    isReady: false,
    audioContext: null,
    sourceNode: null,
    analyser: null,
    audioElement: null,
    fadeGainNode: null,
    outputGainNode: null,
    audioBuffer: null
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  
  const [audioFadeIn, setAudioFadeIn] = useState(false);
  const [audioFadeOut, setAudioFadeOut] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(2);
  const [isRendering, setIsRendering] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeGainRef = useRef<GainNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const anaRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  
  const startTimeRef = useRef(0);
  const endTimeRef = useRef(0);
  const audioFadeInRef = useRef(false);
  const audioFadeOutRef = useRef(false);
  const fadeDurationRef = useRef(2);
  const isMutedRef = useRef(false);
  const isRenderingRef = useRef(false);

  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);
  useEffect(() => { endTimeRef.current = endTime; }, [endTime]);
  useEffect(() => { audioFadeInRef.current = audioFadeIn; }, [audioFadeIn]);
  useEffect(() => { audioFadeOutRef.current = audioFadeOut; }, [audioFadeOut]);
  useEffect(() => { fadeDurationRef.current = fadeDuration; }, [fadeDuration]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isRenderingRef.current = isRendering; }, [isRendering]);

  useEffect(() => {
    let interval: number;
    if (audioFile) {
      setState(prev => ({ ...prev, isReady: false }));
      
      // Cleanup previous track nodes completely to prevent memory/CPU leaks
      if (sourceRef.current) sourceRef.current.disconnect();
      if (fadeGainRef.current) fadeGainRef.current.disconnect();
      if (outputGainRef.current) outputGainRef.current.disconnect();
      if (anaRef.current) anaRef.current.disconnect();
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
      }
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
      }

      if (!globalAudioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        globalAudioContext = new AudioContextClass();
      }
      const ctx = globalAudioContext!;

      const url = URL.createObjectURL(audioFile);
      currentUrlRef.current = url;
      
      const audio = new Audio(url);
      audio.loop = false; 
      audio.setAttribute('playsinline', 'true');
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
        setEndTime(audio.duration);
        setStartTime(0);
        endTimeRef.current = audio.duration;
        startTimeRef.current = 0;
        setState(prev => ({ ...prev, isReady: true }));
      };

      interval = window.setInterval(() => {
        const a = audioRef.current;
        const fg = fadeGainRef.current;
        const og = outputGainRef.current;
        if (!a || !fg || !og || ctx.state === 'suspended') return;

        const ct = a.currentTime;
        setCurrentTime(ct);

        if (!isRenderingRef.current) {
          if (ct >= endTimeRef.current - 0.05) {
            a.currentTime = startTimeRef.current;
            if (!a.paused) a.play().catch(() => {});
          } else if (ct < startTimeRef.current && !a.paused) {
             a.currentTime = startTimeRef.current;
          }
        }

        let targetFadeGain = 1.0;
        if (audioFadeInRef.current) {
          const progress = (ct - startTimeRef.current) / (fadeDurationRef.current || 0.1);
          targetFadeGain = Math.min(targetFadeGain, Math.max(0, progress));
        }
        if (audioFadeOutRef.current) {
          const remaining = (endTimeRef.current - ct) / (fadeDurationRef.current || 0.1);
          targetFadeGain = Math.min(targetFadeGain, Math.max(0, remaining));
        }
        if (ct < startTimeRef.current - 0.1 || ct > endTimeRef.current + 0.1) targetFadeGain = 0;
        
        fg.gain.setTargetAtTime(targetFadeGain, ctx.currentTime, 0.02);
        const targetOutputGain = (isRenderingRef.current || isMutedRef.current) ? 0 : 1;
        og.gain.setTargetAtTime(targetOutputGain, ctx.currentTime, 0.02);
      }, 30);

      const ana = ctx.createAnalyser();
      ana.fftSize = 2048; 
      anaRef.current = ana;

      const fadeGain = ctx.createGain();
      fadeGain.gain.value = 0;
      fadeGainRef.current = fadeGain;

      const outputGain = ctx.createGain();
      outputGain.gain.value = isMuted ? 0 : 1;
      outputGainRef.current = outputGain;

      const source = ctx.createMediaElementSource(audio);
      sourceRef.current = source;
      
      source.connect(ana);
      ana.connect(fadeGain);
      fadeGain.connect(outputGain);
      outputGain.connect(ctx.destination);

      const handlePlay = () => setState(prev => ({ ...prev, isPlaying: true }));
      const handlePause = () => setState(prev => ({ ...prev, isPlaying: false }));
      const handleEnded = () => {
        if (isRenderingRef.current) return;
        audio.currentTime = startTimeRef.current;
        audio.play().catch(() => {});
      };

      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);

      const decodeAudio = async () => {
        try {
          const arrayBuffer = await audioFile.arrayBuffer();
          const decodedData = await ctx.decodeAudioData(arrayBuffer);
          setState(prev => ({ ...prev, audioBuffer: decodedData }));
        } catch (err) {
          console.error("Error decoding audio data", err);
        }
      };
      decodeAudio();

      setState(prev => ({
        ...prev,
        audioContext: ctx,
        sourceNode: source,
        analyser: ana,
        audioElement: audio,
        fadeGainNode: fadeGain,
        outputGainNode: outputGain
      }));

      return () => {
        clearInterval(interval);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
        audio.src = "";
        
        // Final explicit disconnect on unmount
        if (sourceRef.current) sourceRef.current.disconnect();
        if (fadeGainRef.current) fadeGainRef.current.disconnect();
        if (outputGainRef.current) outputGainRef.current.disconnect();
        if (anaRef.current) anaRef.current.disconnect();
      };
    }
  }, [audioFile]);

  const togglePlay = useCallback(() => {
    if (audioRef.current && globalAudioContext) {
      if (audioRef.current.paused) {
        globalAudioContext.resume();
        if (audioRef.current.currentTime < startTimeRef.current || audioRef.current.currentTime >= endTimeRef.current) {
          audioRef.current.currentTime = startTimeRef.current;
        }
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = startTimeRef.current;
      setCurrentTime(startTimeRef.current);
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      const clampedTime = Math.min(Math.max(time, 0), audioRef.current.duration || 0);
      audioRef.current.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return { 
    ...state,
    currentTime,
    duration,
    isMuted,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    audioFadeIn,
    setAudioFadeIn,
    audioFadeOut,
    setAudioFadeOut,
    fadeDuration,
    setFadeDuration,
    togglePlay,
    toggleMute,
    stop,
    seek,
    resetAudioForRecording: () => { if(audioRef.current) audioRef.current.currentTime = startTimeRef.current; },
    setIsRendering: (val: boolean) => {
      setIsRendering(val);
      isRenderingRef.current = val;
    }
  };
};