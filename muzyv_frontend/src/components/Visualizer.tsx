import { useEffect, useRef, forwardRef, useImperativeHandle, memo } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  bgUrl: string | null;
  bgType: 'image' | 'video' | 'none';
  bgZoom?: number;
  bgOffsetX?: number;
  bgOffsetY?: number;
  bgRotation?: number;
  bgSpeed?: number;
  bgBeatResponse?: number;
  bgLoopMode?: string;
  bgLoopDuration?: number;
  vizType: string;
  barColor: string;
  barColorEnd?: string;
  useGradient?: boolean;
  vizGradientMotion?: boolean;
  textColor: string;
  textColorEnd?: string;
  useTextGradient?: boolean;
  textGradientMotion?: boolean;
  title: string;
  artist: string;
  resolution: string; 
  textPosition: string;
  textOffsetX?: number;
  textOffsetY?: number;
  fontFamily: string;
  fontSizeScale?: number;
  textMargin?: number;
  sensitivity: number; 
  smartSensitivity: boolean;
  vizScale: number;
  vizRotation: number;
  vizOffsetX?: number;
  vizOffsetY?: number;
  mirrorX?: boolean;
  mirrorY?: boolean;
  vizThickness?: number;
  vizOpacity?: number;
  lowCut?: number;
  highCut?: number;
  smartCut?: boolean;
  glitchIntensity: number;
  shakeIntensity: number;
  rgbShiftIntensity: number;
  pixelate: boolean;
  vignette: boolean;
  kaleidoscope?: boolean;
  scanlines?: boolean;
  noise?: boolean;
  invert?: boolean;
  textGlow?: boolean;
  textOutline?: boolean;
  textReact?: string;
  textSensitivity?: number;
  yoyoMode: boolean;
  autoRotate?: boolean;
  isPlaying: boolean;
  rendering?: boolean;
  safeRender?: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
  fadeInType?: string;
  fadeInDuration?: number;
  fadeOutType?: string;
  fadeOutDuration?: number;
  audioElement: HTMLAudioElement | null;
  startTime?: number;
  endTime?: number;
}

export const Visualizer = memo(forwardRef<HTMLCanvasElement, VisualizerProps>((props, ref) => {
  const propsRef = useRef(props);
  propsRef.current = props;

  const {
    analyser, bgUrl, bgType, resolution, onProcessingChange, audioElement
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const yoyoFramesRef = useRef<ImageBitmap[]>([]);
  
  const yoyoIndexRef = useRef(0);
  const yoyoDirRef = useRef(1);
  const frozenTimeRef = useRef<number>(0);
  const bgTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const smoothDataRef = useRef<Float32Array | null>(null);
  const volumeHistoryRef = useRef<number[]>([]);
  const lastExportFrameTimeRef = useRef<number>(0);
  const videoDurationRef = useRef<number>(0);
  const captureFpsRef = useRef<number>(30);
  
  const pixelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderFrameRef = useRef<(() => void) | null>(null);

  const [w, h] = resolution.split('x').map(Number);

  // Web Worker Heartbeat to prevent tab throttling during export
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (props.rendering) {
      const blob = new Blob([`
        let interval;
        onmessage = (e) => {
          if (e.data === 'start') {
            interval = setInterval(() => postMessage('tick'), 30);
          } else if (e.data === 'stop') {
            clearInterval(interval);
          }
        };
      `], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      workerRef.current = worker;
      
      worker.onmessage = () => {
        if (propsRef.current.rendering) {
          // If we are rendering, we use the worker tick to drive the frames
          // because requestAnimationFrame will be throttled in the background
          if (renderFrameRef.current) {
            renderFrameRef.current();
          }
        }
      };
      
      worker.postMessage('start');
      return () => {
        worker.postMessage('stop');
        worker.terminate();
        URL.revokeObjectURL(url);
      };
    }
  }, [props.rendering]);

  // Persistent State for specific visualizers
  const matrixDropsRef = useRef<{x: number, y: number, speed: number, chars: string[]}[]>([]);
  const starBurstRef = useRef<{x: number, y: number, vx: number, vy: number, life: number, size: number}[]>([]);
  const fireRef = useRef<{x: number, y: number, life: number, size: number}[]>([]);
  const swarmRef = useRef<{x: number, y: number, vx: number, vy: number}[]>([]);
  const neuralNetRef = useRef<{x: number, y: number, vx: number, vy: number}[]>([]);
  const meshRef = useRef<{x: number, y: number, vx: number, vy: number}[]>([]);
  const firefliesRef = useRef<{x: number, y: number, vx: number, vy: number, size: number}[]>([]);
  const snowRef = useRef<{x: number, y: number, speed: number, size: number}[]>([]);
  const confettiRef = useRef<{x: number, y: number, vx: number, vy: number, color: string, rot: number, rSpeed: number}[]>([]);
  const vinesRef = useRef<{x: number, y: number, angle: number, length: number, color: string}[]>([]);
  const attractorRef = useRef<{x: number, y: number, vx: number, vy: number, color?: string}[]>([]);
  const flowFieldRef = useRef<{x: number, y: number, vx: number, vy: number, life: number}[]>([]);
  const isometricGridRef = useRef<{x: number, y: number, z: number}[]>([]);
  const radarBlipsRef = useRef<{angle: number, distance: number, life: number, size: number}[]>([]);
  const radarShockwavesRef = useRef<{x: number, y: number, life: number, size: number}[]>([]);
  const radarAngleRef = useRef<number>(0);
  
  // New Creative Visualizers State
  const cityBuildingsRef = useRef<{x: number, z: number, h: number, w: number, color: string}[]>([]);
  const tunnelShapesRef = useRef<{z: number, rot: number, type: number, color: string}[]>([]);
  const shatterParticlesRef = useRef<{x: number, y: number, vx: number, vy: number, life: number, color: string, size: number}[]>([]);
  const clockGearsRef = useRef<{angle: number, speed: number, size: number, x: number, y: number}[]>([]);
  const liquidBlobRef = useRef<{points: {x: number, y: number}[]}>( {points: []} );
  const neuralStormRef = useRef<{nodes: {x: number, y: number, vx: number, vy: number}[], bolts: {from: number, to: number, life: number}[]}>({nodes: [], bolts: []});
  const vhsGlitchRef = useRef<{y: number, speed: number, opacity: number}[]>([]);
  
  // Infinite Visualizers State
  const circuitBoardRef = useRef<{traces: {x: number, y: number, vx: number, vy: number, life: number, color: string}[]}>({traces: []});
  const matrixTunnelRef = useRef<{chars: {x: number, y: number, z: number, char: string}[]}>({chars: []});
  const voxelTerrainRef = useRef<{grid: number[][]}>({grid: []});
  const polyPulseRef = useRef<{faces: {angles: number[], dist: number, v: number}[]}>({faces: []});
  const energyOrbRef = useRef<{sparks: {ang: number, len: number, life: number}[]}>({sparks: []});
  
  const vaporwaveGridRef = useRef<{offset: number}>({offset: 0});
  const neuralPulseRef = useRef<{nodes: {x: number, y: number, vx: number, vy: number}[], sparks: {from: number, to: number, progress: number, speed: number}[]}>({nodes: [], sparks: []});
  const quantumFoamRef = useRef<{x: number, y: number, life: number, size: number}[]>([]);
  const dataStreamRef = useRef<{x: number, y: number, speed: number, height: number, color: string}[]>([]);
  const reactiveSmokeRef = useRef<{points: {x: number, y: number, vx: number, vy: number, life: number}[], opacity: number}[]>([]);
  const stellarCoreRef = useRef<{planets: {angle: number, distance: number, speed: number, size: number, color: string}[]}>({planets: []});
  const audioOrigamiRef = useRef<{points: {x: number, y: number}[], targetPoints: {x: number, y: number}[]}>( {points: [], targetPoints: []} );

  const clearYoyoFrames = () => {
    if (yoyoFramesRef.current.length > 0) {
      yoyoFramesRef.current.forEach(b => { 
        try { 
          if (b && typeof b.close === 'function') b.close(); 
        } catch(e) {} 
      });
      yoyoFramesRef.current = [];
    }
    yoyoIndexRef.current = 0;
    yoyoDirRef.current = 1;
  };

  const hexToRgb = (hex: string) => {
    try {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#ffffff');
      return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 255, g: 255, b: 255 };
    } catch { return { r: 255, g: 255, b: 255 }; }
  };

  const lerpColor = (c1: string, c2: string, t: number) => {
    const r1 = hexToRgb(c1); const r2 = hexToRgb(c2);
    const r = Math.round(r1.r + (r2.r - r1.r) * t); const g = Math.round(r1.g + (r2.g - r1.g) * t); const b = Math.round(r1.b + (r2.b - r1.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  };

  useEffect(() => {
    const clearBuffers = () => {
      matrixDropsRef.current = [];
      starBurstRef.current = [];
      fireRef.current = [];
      swarmRef.current = [];
      neuralNetRef.current = [];
      meshRef.current = [];
      firefliesRef.current = [];
      snowRef.current = [];
      confettiRef.current = [];
      vinesRef.current = [];
      attractorRef.current = [];
      flowFieldRef.current = [];
      isometricGridRef.current = [];
      radarBlipsRef.current = [];
      radarShockwavesRef.current = [];
      radarAngleRef.current = 0;
      
      // Clear new creative buffers
      cityBuildingsRef.current = [];
      tunnelShapesRef.current = [];
      shatterParticlesRef.current = [];
      clockGearsRef.current = [];
      liquidBlobRef.current = {points: []};
      neuralStormRef.current = {nodes: [], bolts: []};
      vhsGlitchRef.current = [];
      
      // Clear Infinite buffers
      circuitBoardRef.current = {traces: []};
      matrixTunnelRef.current = {chars: []};
      voxelTerrainRef.current = {grid: []};
      polyPulseRef.current = {faces: []};
      energyOrbRef.current = {sparks: []};
      
      vaporwaveGridRef.current = {offset: 0};
      neuralPulseRef.current = {nodes: [], sparks: []};
      quantumFoamRef.current = [];
      dataStreamRef.current = [];
      reactiveSmokeRef.current = [];
      stellarCoreRef.current = {planets: []};
      audioOrigamiRef.current = {points: [], targetPoints: []};
    };
    clearBuffers();
    return () => clearBuffers();
  }, [props.vizType, props.audioElement]);

  useEffect(() => {
    let isCancelled = false;
    const { yoyoMode } = propsRef.current;

    // Explicitly destroy old video/image objects to free VRAM
    if (bgVideoRef.current) {
      bgVideoRef.current.pause();
      bgVideoRef.current.src = "";
      bgVideoRef.current.load();
      bgVideoRef.current = null;
    }
    bgImageRef.current = null;
    clearYoyoFrames();
    onProcessingChange?.(false);

    if (!bgUrl) return;

    if (bgType === 'image') {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = bgUrl;
      bgImageRef.current = img;
    } else if (bgType === 'video') {
      const vid = document.createElement('video');
      vid.crossOrigin = "anonymous";
      vid.src = bgUrl;
      vid.muted = true;
      vid.loop = !yoyoMode;
      vid.playsInline = true;
      bgVideoRef.current = vid;

      if (yoyoMode) {
        const processFrames = async () => {
          onProcessingChange?.(true);
          const frames: ImageBitmap[] = [];
          vid.currentTime = 0;
          const safetyTimeout = setTimeout(() => { if (!isCancelled) onProcessingChange?.(false); }, 30000);

          try {
            await new Promise<void>((resolve, reject) => {
              const onLoaded = () => { resolve(); vid.onloadeddata = null; };
              if (vid.readyState >= 2) resolve();
              else { vid.onloadeddata = onLoaded; vid.onerror = reject; }
            });

            if (isCancelled) return;
            videoDurationRef.current = vid.duration || 1;
            const scale = Math.min(1, 960/w, 540/h);
            const cw = Math.floor(w * scale);
            const ch = Math.floor(h * scale);

            await vid.play();
            const capture = async () => {
              if (isCancelled || vid.ended || vid.currentTime >= vid.duration - 0.05 || frames.length >= 240) {
                clearTimeout(safetyTimeout);
                if (!isCancelled) {
                  if (frames.length > 0) captureFpsRef.current = frames.length / (vid.currentTime || 1);
                  yoyoFramesRef.current = frames;
                  onProcessingChange?.(false);
                }
                vid.pause();
                return;
              }

              try {
                const bitmap = await createImageBitmap(vid, { resizeWidth: cw, resizeHeight: ch });
                if (!isCancelled) frames.push(bitmap); else bitmap.close();
              } catch(e) {}

              if ('requestVideoFrameCallback' in vid) (vid as any).requestVideoFrameCallback(capture);
              else setTimeout(capture, 16);
            };
            if ('requestVideoFrameCallback' in vid) (vid as any).requestVideoFrameCallback(capture);
            else setTimeout(capture, 32);

          } catch(e) { 
            clearTimeout(safetyTimeout); 
            onProcessingChange?.(false); 
          }
        };
        processFrames();
      }
    }

    return () => { isCancelled = true; };
  }, [bgUrl, bgType, props.yoyoMode, w, h, audioElement]);

  useEffect(() => {
    bgTimeRef.current = 0;
    frozenTimeRef.current = 0;
  }, [bgUrl, audioElement]);

  useImperativeHandle(ref, () => canvasRef.current!, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) return;
    canvas.width = Math.floor(w || 1920); canvas.height = Math.floor(h || 1080);

    let dataArray: Uint8Array;
    if (analyser) dataArray = new Uint8Array(analyser.frequencyBinCount);

    const render = () => {
      if (!canvas || !ctx) return;
      const p = propsRef.current; const now = performance.now();
      
      if (p.rendering) {
        const frameInterval = 1000 / (p.safeRender ? 24 : 30);
        if (now - lastExportFrameTimeRef.current < frameInterval - 5) { 
          return; 
        }
        lastExportFrameTimeRef.current = now;
      }

      const width = canvas.width; const height = canvas.height;
      const minDim = Math.min(width, height);
      const responsiveScale = minDim / 1000;
      const rawDelta = now - lastFrameTimeRef.current;
      const delta = p.rendering ? (1000 / (p.safeRender ? 24 : 30)) : rawDelta;
      lastFrameTimeRef.current = now;
      
      if (p.isPlaying || p.rendering) frozenTimeRef.current += (isNaN(delta) ? 0 : delta);
      const animTime = frozenTimeRef.current;

      let curSens = isNaN(p.sensitivity) ? 1.0 : p.sensitivity; 
      let avgVol = 0; let bass = 0;
      
      if (analyser && dataArray) {
        if (p.vizType.includes('wave') || p.vizType.includes('ribbon') || p.vizType.includes('strings') || p.vizType.includes('lightning') || p.vizType.includes('seismic')) analyser.getByteTimeDomainData(dataArray as any); 
        else analyser.getByteFrequencyData(dataArray as any);
        
        let start = Math.floor(((p.lowCut ?? 0) / 100) * dataArray.length);
        let end = Math.floor(((p.highCut ?? 100) / 100) * dataArray.length);
        if (p.smartCut) { start = Math.floor(0.01 * dataArray.length); end = Math.floor(0.6 * dataArray.length); }
        if (start >= end) { start = 0; end = dataArray.length; }
        
        const rawData = dataArray.slice(start, end);
        if (!smoothDataRef.current || smoothDataRef.current.length !== rawData.length) smoothDataRef.current = new Float32Array(rawData.length);
        
        let sum = 0;
        const bEnd = Math.floor(rawData.length * 0.15);
        for (let i = 0; i < rawData.length; i++) {
            const val = (p.vizType.includes('spectrum') || p.vizType.includes('bar') || p.vizType.includes('city') || p.vizType.includes('block') || p.vizType.includes('ring') || p.vizType.includes('circle') || p.vizType.includes('pulse') || p.vizType.includes('star') || p.vizType.includes('lava') || p.vizType.includes('orb') || p.vizType.includes('3d') || p.vizType.includes('grid') || p.vizType.includes('shockwave') || p.vizType.includes('dna') || p.vizType.includes('matrix') || p.vizType.includes('fire') || p.vizType.includes('mandala') || p.vizType.includes('radar') || p.vizType.includes('pyramid') || p.vizType.includes('crystal') || p.vizType.includes('swarm') || p.vizType.includes('seismic') || p.vizType.includes('led')) 
              ? (rawData[i] || 0) / 255.0 : ((rawData[i] || 128) - 128) / 128.0;
            if (p.isPlaying || p.rendering) smoothDataRef.current[i] += (val - smoothDataRef.current[i]) * 0.25;
            const sv = Math.abs(smoothDataRef.current[i]);
            sum += sv; if (i < bEnd) bass += sv;
        }
        avgVol = sum / (rawData.length || 1); bass /= (bEnd || 1);
        
        if (p.smartSensitivity) {
          volumeHistoryRef.current.push(avgVol); if (volumeHistoryRef.current.length > 60) volumeHistoryRef.current.shift();
          const avgRms = volumeHistoryRef.current.reduce((a, b) => a + b, 0) / volumeHistoryRef.current.length;
          if (avgRms > 0.001) curSens *= Math.min(Math.max(0.2 / avgRms, 0.5), 3.0);
        }
      }

      const rV = (isNaN(avgVol) ? 0 : avgVol) * (p.textSensitivity ?? 1.0); 

      const effectiveBgSpeed = (p.bgSpeed ?? 1.0) + (isNaN(avgVol) ? 0 : avgVol) * (p.bgBeatResponse ?? 0.8) * 3;
      if (p.isPlaying || p.rendering) bgTimeRef.current += (isNaN(delta) ? 0 : delta) * effectiveBgSpeed;

      try {
        ctx.save();
        if ((p.shakeIntensity > 0 || (p.textReact === 'jitter' && rV > 0.1)) && (p.isPlaying || p.rendering)) {
          const s = (p.shakeIntensity * 20 * responsiveScale * (1 + avgVol * 2)) + (p.textReact === 'jitter' ? rV * 10 * responsiveScale : 0);
          ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
        }

        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);

        const drawBG = (src: CanvasImageSource) => {
            let iw = 0, ih = 0;
            if (src instanceof HTMLVideoElement) { iw = src.videoWidth; ih = src.videoHeight; }
            else { iw = (src as any).width; ih = (src as any).height; }
            if (!iw || !ih) return;
            const r = Math.max(width / iw, height / ih) * (p.bgZoom || 1.0);
            ctx.save(); ctx.translate(width * ((p.bgOffsetX ?? 50) / 100), height * ((p.bgOffsetY ?? 50) / 100));
            if (p.bgRotation) ctx.rotate((p.bgRotation * Math.PI) / 180);
            ctx.drawImage(src, -(iw*r)/2, -(ih*r)/2, iw*r, ih*r); ctx.restore();
        };

        if (bgType === 'image' && bgImageRef.current?.complete) {
          drawBG(bgImageRef.current);
        } else if (bgType === 'video') {
          const frames = yoyoFramesRef.current;
          if (p.yoyoMode && frames.length > 0) {
            const idx = Math.min(Math.max(Math.floor(yoyoIndexRef.current), 0), frames.length - 1);
            if (frames[idx]) drawBG(frames[idx]);

            if (p.isPlaying || p.rendering) {
                const fps = captureFpsRef.current || 30;
                const increment = (delta / 1000) * fps * effectiveBgSpeed;
                if (yoyoDirRef.current === 1) {
                    yoyoIndexRef.current += increment;
                    if (yoyoIndexRef.current >= frames.length - 1) { yoyoIndexRef.current = frames.length - 1; yoyoDirRef.current = -1; }
                } else {
                    yoyoIndexRef.current -= increment;
                    if (yoyoIndexRef.current <= 0) { yoyoIndexRef.current = 0; yoyoDirRef.current = 1; }
                }
            }
          } else if (bgVideoRef.current && bgVideoRef.current.readyState >= 2) {
            const vid = bgVideoRef.current;
            if ((p.isPlaying || p.rendering) && vid.paused) vid.play().catch(()=>{});
            else if (!(p.isPlaying || p.rendering) && !vid.paused) vid.pause();
            const targetRate = Math.min(Math.max(effectiveBgSpeed, 0.1), 4);
            if (Math.abs(vid.playbackRate - targetRate) > 0.05) vid.playbackRate = targetRate;

            // Loop Transitions
            const loopMode = p.bgLoopMode || 'cut';
            const loopDur = p.bgLoopDuration || 1.0;
            let bgAlpha = 1.0;

            if (loopMode !== 'cut' && vid.duration > loopDur * 2) {
              const t = vid.currentTime;
              const d = vid.duration;
              if (t < loopDur) bgAlpha = t / loopDur;
              else if (t > d - loopDur) bgAlpha = (d - t) / loopDur;
            }

            if (bgAlpha < 1.0) {
              if (loopMode === 'fade') {
                drawBG(vid);
                ctx.save();
                ctx.globalAlpha = 1.0 - bgAlpha;
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
              } else if (loopMode === 'blur') {
                ctx.save();
                ctx.filter = `blur(${Math.floor((1.0 - bgAlpha) * 40 * responsiveScale)}px)`;
                drawBG(vid);
                ctx.restore();
              } else if (loopMode === 'wash_black') {
                drawBG(vid);
                ctx.save();
                ctx.fillStyle = `rgba(0,0,0,${1.0 - bgAlpha})`;
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
                                } else if (loopMode === 'wash_white') {
                                  drawBG(vid);
                                  ctx.save();
                                  ctx.fillStyle = `rgba(255,255,255,${1.0 - bgAlpha})`;
                                  ctx.fillRect(0, 0, width, height);
                                  ctx.restore();
                                } else if (loopMode === 'zoom') {
                                  ctx.save();
                                  const s = 1.0 + (1.0 - bgAlpha) * 0.2;
                                  ctx.translate(width/2, height/2);
                                  ctx.scale(s, s);
                                  ctx.translate(-width/2, -height/2);
                                  drawBG(vid);
                                  ctx.restore();
                                } else if (loopMode === 'slide') {
                                  ctx.save();
                                  ctx.translate((1.0 - bgAlpha) * width, 0);
                                  drawBG(vid);
                                  ctx.restore();
                                } else if (loopMode === 'ghost') {
                                  ctx.save();
                                  drawBG(vid);
                                  ctx.globalAlpha = (1.0 - bgAlpha) * 0.5;
                                  ctx.globalCompositeOperation = 'screen';
                                  ctx.translate(10 * responsiveScale, 0);
                                  drawBG(vid);
                                  ctx.restore();
                                } else if (loopMode === 'glitch') {
                                  if (Math.random() > bgAlpha) {
                                    ctx.save();
                                    const gx = (Math.random() - 0.5) * 50 * responsiveScale;
                                    ctx.translate(gx, 0);
                                    drawBG(vid);
                                    ctx.restore();
                                  } else {
                                    drawBG(vid);
                                  }
                                } else {
                                  drawBG(vid);
                                }            } else {
              drawBG(vid);
            }
          }
        }

        // --- Visualizer Layer ---
        if (smoothDataRef.current) {
          const vD = smoothDataRef.current; const len = vD.length;
          ctx.save();
          ctx.globalAlpha = p.vizOpacity ?? 1.0;
          ctx.translate(width * ((p.vizOffsetX ?? 50) / 100), height * ((p.vizOffsetY ?? 50) / 100));
          ctx.rotate((p.vizRotation * Math.PI) / 180 + (p.autoRotate ? animTime * 0.0005 : 0)); 
          ctx.scale(p.vizScale || 1, p.vizScale || 1);
          
          let vCS = p.barColor; let vCE = p.barColorEnd || '#8b5cf6';
          if (p.vizGradientMotion) { const t = (Math.sin(animTime * 0.001) + 1) / 2; vCS = lerpColor(p.barColor, vCE, t); vCE = lerpColor(vCE, p.barColor, t); }
          let fs: string | CanvasGradient = vCS;
          // Fixed gradient coordinates to be relative to the visualizer's local space (centered at 0,0)
          if(p.useGradient || p.vizGradientMotion) { const g=ctx.createLinearGradient(0, height*0.4, 0, -height*0.4); g.addColorStop(0, vCS); g.addColorStop(1, vCE); fs=g; }
          ctx.fillStyle = fs; ctx.strokeStyle = fs; ctx.lineWidth = Math.max(0.1, (p.vizThickness ?? 2) * responsiveScale);

          const drawViz = () => {
            if (p.vizType === 'spectrum') {
                const bW = width / (len || 1); 
                for (let i = 0; i < len; i++) {
                  ctx.fillRect(Math.floor(-width/2 + i*bW), 0, Math.max(1, Math.floor(bW - 1)), Math.floor(-(vD[i] || 0) * height * 0.5 * curSens));
                }
            } else if (p.vizType === 'mirror_spectrum') {
                const bW = width / (len || 1); 
                for (let i = 0; i < len; i++) { 
                  const vx = Math.floor(-width/2 + i*bW); 
                  const vH = (vD[i] || 0) * height * 0.5 * curSens;
                  ctx.fillRect(vx, 0, Math.max(1, Math.floor(bW - 1)), Math.floor(-vH)); 
                  ctx.fillRect(vx, 0, Math.max(1, Math.floor(bW - 1)), Math.floor(vH)); 
                }
            } else if (p.vizType === 'bars_3d') {
                const bW = (width / 40) * 0.6; for(let i=0; i<40; i++) { const hV = (len > 0 ? vD[Math.floor(i*(len/40))%len] : 0)*height*0.8*curSens; ctx.save(); ctx.translate(Math.floor((i/40)*width-width/2), 0); ctx.transform(1, 0.4, 0, 1, 0, 0); ctx.fillRect(0, 0, Math.max(1, Math.floor(bW)), Math.floor(-hV)); ctx.strokeRect(0, 0, Math.max(1, Math.floor(bW)), Math.floor(-hV)); ctx.restore(); }
            } else if (p.vizType === 'bar_rain') {
                const bW = (width / 40) * 0.8; for(let i=0; i<40; i++) ctx.fillRect(Math.floor((i/40) * width - width/2), Math.floor(-height/2), Math.max(1, Math.floor(bW)), Math.floor((len > 0 ? vD[Math.floor(i * (len/40)) % len] : 0) * height * curSens));
            } else if (p.vizType === 'cyber_city') {
                const bW = (width / 50) * 0.85; for(let i=0; i<50; i++) ctx.fillRect(Math.floor((i/50)*width-width/2), 0, Math.max(1, Math.floor(bW)), Math.floor(-(len > 0 ? vD[Math.floor(i*(len/50))%len] : 0)*height*0.9*curSens));
            } else if (p.vizType === 'pixel_blocks') {
                const size = 50 * responsiveScale; const rows = 15; const cols = Math.floor(width / size); for(let i=0; i<cols; i++) { const hV = Math.floor((len > 0 ? vD[Math.floor(i * (len/cols)) % len] : 0) * rows * curSens); for(let j=0; j<hV; j++) ctx.fillRect(Math.floor((i - cols/2) * size), Math.floor(-j * size), Math.floor(size - 4), Math.floor(size - 4)); }
            } else if (p.vizType === 'led_wall' || p.vizType === 'led') {
                const r=15, c=25; const bW=width/c, bH=height/r; for(let i=0; i<c; i++) for(let j=0; j<(len > 0 ? vD[Math.floor(i*(len/c))%len] : 0)*r*curSens; j++) ctx.fillRect(Math.floor(i*bW-width/2), Math.floor(height/2-j*bH-bH), Math.max(1, Math.floor(bW-2)), Math.max(1, Math.floor(bH-2)));
            } else if (p.vizType === 'wave' || p.vizType === 'dual_wave' || p.vizType === 'classic_wave') {
                ctx.beginPath(); let wx=-width/2; for(let i=0; i<len; i++){ ctx.lineTo(Math.floor(wx),Math.floor((vD[i] || 0)*height*0.4*curSens)); wx+=width/(len || 1); } ctx.stroke();
                if(p.vizType === 'dual_wave'){ ctx.beginPath(); wx=-width/2; for(let i=0; i<len; i++){ ctx.lineTo(Math.floor(wx),Math.floor(-(vD[i] || 0)*height*0.4*curSens)); wx+=width/(len || 1); } ctx.stroke(); }
            } else if (p.vizType === 'circle' || p.vizType === 'ring' || p.vizType === 'pulse') {
                const r=Math.max(1, minDim*0.25+bass*50*curSens); const count=120; for(let i=0; i<count; i++){ const v=(len > 0 ? vD[Math.floor(i*(len/count))%len] : 0); const rad=(Math.PI*2)*(i/count); ctx.beginPath(); if(p.vizType==='ring') { ctx.arc(Math.floor(Math.cos(rad)*(r+v*minDim*0.3*curSens)), Math.floor(Math.sin(rad)*(r+v*minDim*0.3*curSens)), Math.max(0.1, Math.floor(2+v*10)), 0, Math.PI*2); ctx.fill(); } else { ctx.moveTo(Math.floor(Math.cos(rad)*r), Math.floor(Math.sin(rad)*r)); ctx.lineTo(Math.floor(Math.cos(rad)*(Math.max(0.1, r+v*minDim*0.3*curSens))), Math.floor(Math.sin(rad)*(Math.max(0.1, r+v*minDim*0.3*curSens)))); ctx.stroke(); } }
            } else if (p.vizType === 'shockwave') {
                for(let i=0; i<10; i++){ const r=(animTime*0.3+i*100)%1000; ctx.beginPath(); ctx.ellipse(0,0,Math.max(0.1, Math.floor(r)),Math.max(0.1, Math.floor(r*0.5)),0,0,Math.PI*2); ctx.globalAlpha=Math.max(0, (1-r/1000)); ctx.stroke(); }
            } else if (p.vizType === 'dna') {
                for(let i=0; i<40; i++){ const y=(i-20)*25, x=Math.sin(animTime*0.003+i*0.2)*150; const v = (len > 0 ? vD[(i*5)%len] : 0); ctx.beginPath(); ctx.arc(Math.floor(x),Math.floor(y),Math.max(0.1, Math.floor(5+v*20)),0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(Math.floor(-x),Math.floor(y),Math.max(0.1, Math.floor(5+v*20)),0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(Math.floor(x),Math.floor(y)); ctx.lineTo(Math.floor(-x),Math.floor(y)); ctx.stroke(); }
            } else if (p.vizType === 'fire') {
                if(fireRef.current.length<30) fireRef.current=Array.from({length:30},()=>({x:0, y:0, life:0, size:0}));
                for (let i = 0; i < fireRef.current.length; i++) { const f = fireRef.current[i]; if(f.life<=0){f.x=(Math.random()-0.5)*200; f.y=100; f.life=1;} if(p.isPlaying || p.rendering){f.y-=5+(len > 0 ? vD[i%len] : 0)*10; f.life-=0.02;} ctx.fillStyle=`rgba(255,${Math.floor(f.life*200)},0,${Math.max(0, f.life)})`; ctx.beginPath(); ctx.arc(Math.floor(f.x),Math.floor(f.y),Math.max(0.1, Math.floor(10*f.life)),0,Math.PI*2); ctx.fill(); }
            } else if (p.vizType === 'matrix' || p.vizType === 'digital_rain') {
                if(matrixDropsRef.current.length<30) matrixDropsRef.current=Array.from({length:30},()=>({x:(Math.random()-0.5)*width, y:(Math.random()-0.5)*height, speed:2+Math.random()*5, chars:["1","0"]}));
                ctx.font="12px monospace"; matrixDropsRef.current.forEach(d=>{ if(p.isPlaying || p.rendering)d.y+=d.speed; if(d.y>height/2) d.y=-height/2; ctx.fillText(d.chars[Math.floor(Math.random()*2)], Math.floor(d.x), Math.floor(d.y)); });
            } else if (p.vizType === 'neural_net') {
                if(neuralNetRef.current.length<15) neuralNetRef.current=Array.from({length:15},()=>({x:(Math.random()-0.5)*width, y:(Math.random()-0.5)*height, vx:Math.random()-0.5, vy:Math.random()-0.5}));
                for (let i = 0; i < neuralNetRef.current.length; i++) { 
                  const n = neuralNetRef.current[i]; 
                  if(p.isPlaying || p.rendering){
                    const v = (len > 0 ? vD[i%len] : 0);
                    n.x+=n.vx*(1+v*5); n.y+=n.vy*(1+v*5);
                    if (Math.abs(n.x) > width/2) { n.x = Math.sign(n.x)*width/2; n.vx *= -1; }
                    if (Math.abs(n.y) > height/2) { n.y = Math.sign(n.y)*height/2; n.vy *= -1; }
                  } 
                  ctx.beginPath(); ctx.arc(Math.floor(n.x),Math.floor(n.y),5,0,Math.PI*2); ctx.fill(); 
                  for(let j=i+1; j<neuralNetRef.current.length; j++){
                    const n2 = neuralNetRef.current[j];
                    const dist = Math.hypot(n.x-n2.x,n.y-n2.y);
                    if(dist < 200) {
                      ctx.globalAlpha = (1 - dist/200) * (p.vizOpacity ?? 1.0);
                      ctx.beginPath(); ctx.moveTo(Math.floor(n.x),Math.floor(n.y)); ctx.lineTo(Math.floor(n2.x),Math.floor(n2.y)); ctx.stroke();
                      ctx.globalAlpha = p.vizOpacity ?? 1.0;
                    }
                  }
                }
            } else if (p.vizType === 'particle_mesh') {
                if(meshRef.current.length<30) meshRef.current=Array.from({length:30},()=>({x:(Math.random()-0.5)*width, y:(Math.random()-0.5)*height, vx:(Math.random()-0.5)*2, vy:(Math.random()-0.5)*2}));
                for (let i = 0; i < meshRef.current.length; i++) {
                  const n = meshRef.current[i];
                  const v = (len > 0 ? vD[i%len] : 0);
                  if(p.isPlaying || p.rendering){
                    n.x+=n.vx*(1+v*10); n.y+=n.vy*(1+v*10);
                    if (Math.abs(n.x) > width/2) { n.x = Math.sign(n.x)*width/2; n.vx *= -1; }
                    if (Math.abs(n.y) > height/2) { n.y = Math.sign(n.y)*height/2; n.vy *= -1; }
                  }
                  ctx.beginPath(); ctx.arc(Math.floor(n.x), Math.floor(n.y), 2+v*10, 0, Math.PI*2); ctx.fill();
                  for(let j=i+1; j<Math.min(i+8, meshRef.current.length); j++){
                    const n2 = meshRef.current[j];
                    const dist = Math.hypot(n.x-n2.x, n.y-n2.y);
                    if(dist < 200){
                      ctx.globalAlpha = (1 - dist/200) * (p.vizOpacity ?? 1.0);
                      ctx.beginPath(); ctx.moveTo(Math.floor(n.x), Math.floor(n.y)); ctx.lineTo(Math.floor(n2.x), Math.floor(n2.y)); ctx.stroke();
                      ctx.globalAlpha = p.vizOpacity ?? 1.0;
                    }
                  }
                }
            } else if (p.vizType === '3d_wave_floor') {
                const stepX = width / 20, stepY = height / 20;
                for(let j = -10; j <= 10; j++){
                  ctx.beginPath();
                  for(let i = -10; i <= 10; i++){
                    const dist = Math.sqrt(i*i + j*j);
                    const v = (len > 0 ? vD[Math.floor(dist * 5) % len] : 0) || 0;
                    const z = v * 200 * curSens * responsiveScale;
                    const x = i * stepX, y = j * stepY + z;
                    if(i === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                  }
                  ctx.stroke();
                }
            } else if (p.vizType === 'particle_orbit') {
                for(let i = 0; i < 100; i++){
                  const v = (len > 0 ? vD[i%len] : 0);
                  const speed = 0.001 + (v * 0.01);
                  const angle = animTime * speed + i * (Math.PI*2/100);
                  const radius = (200 + i * 2) * responsiveScale;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius * 0.5;
                  ctx.beginPath();
                  ctx.arc(Math.floor(x), Math.floor(y), 2 + v*15, 0, Math.PI*2);
                  ctx.fill();
                }
            } else if (p.vizType === 'nebula_cloud') {
                for(let i = 0; i < 20; i++){
                  const x = Math.floor(Math.sin(animTime * 0.0002 + i) * width * 0.3);
                  const y = Math.floor(Math.cos(animTime * 0.0003 + i * 1.5) * height * 0.3);
                  const v = (len > 0 ? vD[(i * 5) % len] : 0);
                  let r = 100 + v * 300 * responsiveScale;
                  
                  // Guard against NaN/Infinity or extremely small radius
                  if (!isFinite(r) || r < 0.1) r = 0.1;
                  if (r > 2000) r = 2000; // Hard cap to prevent massive gradients crashing context

                  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
                  const color = i % 2 === 0 ? p.barColor : vCE;
                  grad.addColorStop(0, color);
                  grad.addColorStop(1, 'transparent');
                  ctx.fillStyle = grad;
                  ctx.globalAlpha = 0.4 * (p.vizOpacity ?? 1.0);
                  ctx.beginPath(); 
                  ctx.arc(x, y, r, 0, Math.PI*2); 
                  ctx.fill();
                }
                ctx.globalAlpha = p.vizOpacity ?? 1.0;
            } else if (p.vizType === 'fireflies') {
                if(firefliesRef.current.length<30) firefliesRef.current=Array.from({length:30},()=>({x:(Math.random()-0.5)*width, y:(Math.random()-0.5)*height, vx:(Math.random()-0.5), vy:(Math.random()-0.5), size:2+Math.random()*4}));
                firefliesRef.current.forEach((f, i) => {
                  const v = (len > 0 ? vD[i%len] : 0);
                  if(p.isPlaying || p.rendering){
                    f.x += f.vx + Math.sin(animTime*0.001+i)*2; f.y += f.vy + Math.cos(animTime*0.001+i)*2;
                    if (Math.abs(f.x) > width/2) { f.x = Math.sign(f.x)*width/2; f.vx *= -1; }
                    if (Math.abs(f.y) > height/2) { f.y = Math.sign(f.y)*height/2; f.vy *= -1; }
                  }
                  const pulse = 0.5 + Math.sin(animTime*0.005+i)*0.5;
                  ctx.globalAlpha = pulse * (p.vizOpacity ?? 1.0);
                  ctx.beginPath(); ctx.arc(Math.floor(f.x), Math.floor(f.y), f.size + v*20, 0, Math.PI*2); ctx.fill();
                });
                ctx.globalAlpha = p.vizOpacity ?? 1.0;
            } else if (p.vizType === 'snowfall') {
                if(snowRef.current.length<100) snowRef.current=Array.from({length:100},()=>({x:(Math.random()-0.5)*width, y:(Math.random()-0.5)*height, speed:1+Math.random()*3, size:1+Math.random()*3}));
                snowRef.current.forEach((s, i) => {
                  const v = (len > 0 ? vD[i%len] : 0);
                  if(p.isPlaying || p.rendering){
                    s.y += s.speed * (1 + v*15); s.x += Math.sin(animTime*0.001+i);
                    if (s.y > height/2) s.y = -height/2;
                    if (Math.abs(s.x) > width/2) s.x = -s.x;
                  }
                  ctx.beginPath(); ctx.arc(Math.floor(s.x), Math.floor(s.y), s.size, 0, Math.PI*2); ctx.fill();
                });
            } else if (p.vizType === 'confetti') {
                if(confettiRef.current.length < 100 && (p.isPlaying || p.rendering) && bass > 0.6){
                  for(let i=0; i<10; i++) confettiRef.current.push({
                    x:0, y:0, vx:(Math.random()-0.5)*30, vy:(Math.random()-0.5)*30,
                    color: lerpColor(p.barColor, vCE, Math.random()), rot: Math.random()*Math.PI, rSpeed: (Math.random()-0.5)*0.2
                  });
                }
                for(let i=confettiRef.current.length-1; i>=0; i--){
                  const c = confettiRef.current[i];
                  if(p.isPlaying || p.rendering){
                    c.x += c.vx; c.y += c.vy; c.vy += 0.5; // gravity
                    c.rot += c.rSpeed;
                    if(Math.abs(c.x) > width/2 || c.y > height/2) confettiRef.current.splice(i, 1);
                  }
                  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot);
                  ctx.fillStyle = c.color; ctx.fillRect(-5, -5, 10, 10); ctx.restore();
                }
            } else if (p.vizType === 'swarm') {
                if(swarmRef.current.length<50) swarmRef.current=Array.from({length:50},()=>({x:0,y:0,vx:0,vy:0}));
                for (let i = 0; i < swarmRef.current.length; i++) { 
                  const s = swarmRef.current[i]; 
                  if(p.isPlaying || p.rendering){
                    const v = (len > 0 ? vD[i%len] : 0);
                    s.x+=(Math.random()-0.5)*10+s.vx; s.y+=(Math.random()-0.5)*10+s.vy; s.vx*=0.9; s.vy*=0.9; 
                    if(v>0.6){s.vx+=(Math.random()-0.5)*20; s.vy+=(Math.random()-0.5)*20;}
                    if (Math.abs(s.x) > width/2) { s.x = Math.sign(s.x)*width/2; s.vx *= -1; }
                    if (Math.abs(s.y) > height/2) { s.y = Math.sign(s.y)*height/2; s.vy *= -1; }
                  } 
                  ctx.fillRect(Math.floor(s.x),Math.floor(s.y),4,4); 
                }
            } else if (p.vizType === 'segmented_bar') {
                const bW = width / (len || 1); 
                for (let i = 0; i < len; i++) {
                  const v = (vD[i] || 0);
                  for (let j = 0; j < v * 15 * curSens; j++) {
                    ctx.fillRect(Math.floor(-width/2 + i * bW), Math.floor(-j * 12 * responsiveScale), Math.max(1, Math.floor(bW - 1)), Math.floor(-10 * responsiveScale));
                  }
                }
            } else if (p.vizType === 'lightning') {
                ctx.beginPath(); ctx.moveTo(Math.floor(-width/2), 0); for(let i=0; i<len; i++) ctx.lineTo(Math.floor((i/(len || 1))*width-width/2), Math.floor((vD[i] || 0)*350*curSens*responsiveScale*(Math.random()>0.9?3:1))); ctx.stroke();
            } else if (p.vizType === 'glitch_vines') {
                if((p.isPlaying || p.rendering) && Math.random()<0.2 && vinesRef.current.length < 50) vinesRef.current.push({x:(Math.random()-0.5)*width, y:(Math.random()-0.5)*height, angle:Math.random()*Math.PI*2, length:0, color:lerpColor(p.barColor, vCE, Math.random())});
                for (let i = vinesRef.current.length - 1; i >= 0; i--) { const v = vinesRef.current[i]; const spd=5+avgVol*10; v.length+=spd; v.angle+=(Math.random()-0.5)*0.5; const nx=v.x+Math.cos(v.angle)*spd, ny=v.y+Math.sin(v.angle)*spd; ctx.beginPath(); ctx.moveTo(Math.floor(v.x), Math.floor(v.y)); ctx.lineTo(Math.floor(nx), Math.floor(ny)); ctx.stroke(); v.x=nx; v.y=ny; if(v.length>500) vinesRef.current.splice(i,1); }
            } else if (p.vizType === 'heartbeat') {
                ctx.scale(Math.max(0.1, 1.2+bass), Math.max(0.1, 1.2+bass)); ctx.beginPath(); ctx.moveTo(0,30); ctx.bezierCurveTo(0,0,-50,-50,-100,0); ctx.bezierCurveTo(-150,50,-50,150,0,200); ctx.bezierCurveTo(50,150,150,50,100,0); ctx.bezierCurveTo(50,-50,0,0,0,30); ctx.fill();
            } else if (p.vizType === 'cosmic_strings') {
                for(let i=0; i<8; i++){ ctx.beginPath(); for(let x=-width/2; x<width/2; x+=20) ctx.lineTo(Math.floor(x), Math.floor(Math.sin(x*0.002+animTime*0.002+i)*(len > 0 ? vD[(i*10)%len] : 0)*200*curSens)); ctx.stroke(); }
            } else if (p.vizType === 'seismic') {
                ctx.beginPath(); for(let i=0; i<len; i++) ctx.lineTo(Math.floor((i/(len || 1))*width-width/2), Math.floor((vD[i] || 0)*height*0.3*curSens+(Math.random()-0.5)*(vD[i] || 0)*100)); ctx.stroke();
            } else if (p.vizType === 'ribbon') {
                for (let l = 0; l < 3; l++) { ctx.beginPath(); ctx.globalAlpha = Math.max(0, (1 - l/3) * (p.vizOpacity ?? 1.0)); for(let i=0; i<len; i++){ ctx.lineTo(Math.floor((i/(len || 1))*width-width/2), Math.floor(Math.sin(i*0.05+animTime*0.002+l)*100*responsiveScale+(vD[i] || 0)*300*curSens*responsiveScale)); } ctx.stroke(); }
            } else if (p.vizType === 'spectrum_wave') {
                const bW=width/(len || 1); for(let i=0; i<len; i++) ctx.fillRect(Math.floor(-width/2+i*bW), Math.floor(Math.sin(animTime*0.003+i*0.08)*80*responsiveScale), Math.max(1, Math.floor(bW)), Math.floor(-(vD[i] || 0)*height*0.5*curSens));
            } else if (p.vizType === 'radial_spectrum') {
                for(let i=0; i<120; i++){ const v=(len > 0 ? vD[Math.floor(i*(len/120))%len] : 0); const rad=(Math.PI*2)*(i/120); ctx.beginPath(); ctx.moveTo(Math.floor(Math.cos(rad)*100), Math.floor(Math.sin(rad)*100)); ctx.lineTo(Math.floor(Math.cos(rad)*(Math.max(0.1, 100+v*400*curSens))), Math.floor(Math.sin(rad)*(Math.max(0.1, 100+v*400*curSens)))); ctx.stroke(); }
            } else if (p.vizType === 'audio_rings') {
                for(let i=0; i<15; i++){ ctx.beginPath(); ctx.arc(0,0,Math.max(0.1, Math.floor(minDim*0.1+i*40+(len > 0 ? vD[(i*5)%len] : 0)*100*curSens)),0,Math.PI*2); ctx.globalAlpha=Math.max(0, (1-i/15)); ctx.stroke(); }
            } else if (p.vizType === 'rings_cyber') {
                for(let i=0; i<8; i++){ const v = (len > 0 ? vD[(i*5)%len] : 0); ctx.beginPath(); ctx.arc(0,0,Math.max(0.1, Math.floor(100+i*50+v*50)), animTime*0.001*(i%2?1:-1), animTime*0.001*(i%2?1:-1)+Math.PI*(0.5+v)); ctx.stroke(); }
            } else if (p.vizType === 'spiral') {
                ctx.beginPath(); for(let i=0; i<len; i++){ const rad=i*0.1+animTime*0.002, r=i*0.5+(vD[i] || 0)*100*curSens; ctx.lineTo(Math.floor(Math.cos(rad)*r), Math.floor(Math.sin(rad)*r)); } ctx.stroke();
            } else if (p.vizType === 'orbitals') {
                for(let i=0; i<12; i++){ const v = (len > 0 ? vD[(i*10)%len] : 0); const rad=animTime*0.001+i*(Math.PI*2/12), r=200+v*100; ctx.beginPath(); ctx.arc(Math.floor(Math.cos(rad)*r), Math.floor(Math.sin(rad)*r), Math.max(0.1, Math.floor(10+v*40)), 0, Math.PI*2); ctx.fill(); }
            } else if (p.vizType === 'radar') {
                const radius = Math.max(0.1, minDim * 0.4);
                if (p.isPlaying || p.rendering) {
                    radarAngleRef.current += (0.002 + bass * 0.005) * (delta * 0.06);
                }
                const sweepAngle = radarAngleRef.current % (Math.PI * 2);
                
                // Pulsing static background
                ctx.save();
                ctx.globalAlpha = (p.vizOpacity ?? 1.0) * (0.05 + avgVol * 0.1);
                for (let i = 0; i < 50; i++) {
                    const sx = (Math.random() - 0.5) * radius * 2;
                    const sy = (Math.random() - 0.5) * radius * 2;
                    if (sx*sx + sy*sy < radius*radius) {
                        ctx.fillStyle = p.barColor;
                        ctx.fillRect(Math.floor(sx), Math.floor(sy), 2, 2);
                    }
                }
                ctx.restore();

                // Draw Radar background rings
                ctx.strokeStyle = p.barColor;
                ctx.globalAlpha = (p.vizOpacity ?? 1.0) * 0.3;
                for (let i = 1; i <= 4; i++) {
                    ctx.beginPath();
                    ctx.arc(0, 0, radius * (i / 4), 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // Draw crosshair
                ctx.beginPath(); ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, -radius); ctx.lineTo(0, radius); ctx.stroke();
                
                // Draw Sweep Trail
                ctx.save();
                for (let i = 0; i < 30; i++) {
                    const a = sweepAngle - (i * 0.03);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
                    ctx.globalAlpha = (p.vizOpacity ?? 1.0) * (0.3 * (1 - i / 30));
                    ctx.stroke();
                }
                ctx.restore();
                
                // Draw main sweep line
                ctx.lineWidth = 3 * responsiveScale;
                ctx.globalAlpha = p.vizOpacity ?? 1.0;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(sweepAngle) * radius, Math.sin(sweepAngle) * radius);
                ctx.stroke();
                
                // Audio Reactivity: Check frequency at the sweep angle and add blips
                if (p.isPlaying || p.rendering) {
                    const binIdx = Math.floor((sweepAngle / (Math.PI * 2)) * len);
                    const val = (len > 0 ? vD[binIdx % len] : 0);
                    
                    if (val > 0.6 && Math.random() > 0.5) {
                        const bDist = Math.random() * radius;
                        const bx = Math.cos(sweepAngle) * bDist;
                        const by = Math.sin(sweepAngle) * bDist;
                        radarBlipsRef.current.push({
                            angle: sweepAngle,
                            distance: bDist,
                            life: 1.0,
                            size: 5 + val * 15
                        });
                        // Add Shockwave
                        radarShockwavesRef.current.push({
                            x: bx, y: by, life: 1.0, size: 0
                        });
                    }
                    
                    // Update and draw blips
                    for (let i = radarBlipsRef.current.length - 1; i >= 0; i--) {
                        const b = radarBlipsRef.current[i];
                        b.life -= 0.01;
                        if (b.life <= 0) { radarBlipsRef.current.splice(i, 1); continue; }
                        
                        const bx = Math.cos(b.angle) * b.distance;
                        const by = Math.sin(b.angle) * b.distance;
                        
                        ctx.save();
                        ctx.globalAlpha = b.life * (p.vizOpacity ?? 1.0);
                        ctx.fillStyle = p.barColor;
                        ctx.beginPath(); ctx.arc(bx, by, b.size * b.life, 0, Math.PI * 2); ctx.fill();
                        ctx.restore();
                    }

                    // Update and draw shockwaves
                    for (let i = radarShockwavesRef.current.length - 1; i >= 0; i--) {
                        const s = radarShockwavesRef.current[i];
                        s.life -= 0.02;
                        s.size += 5 * responsiveScale;
                        if (s.life <= 0) { radarShockwavesRef.current.splice(i, 1); continue; }
                        ctx.save();
                        ctx.globalAlpha = s.life * (p.vizOpacity ?? 1.0) * 0.5;
                        ctx.strokeStyle = p.barColor;
                        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.stroke();
                        ctx.restore();
                    }
                }
            } else if (p.vizType === 'mandala') {
                for(let i=0; i<12; i++){ ctx.save(); ctx.rotate(i*(Math.PI*2/12)+animTime*0.0001); ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(50, Math.floor(100+(len > 0 ? vD[(i*5)%len] : 0)*200), 0, Math.floor(200+(len > 0 ? vD[(i*5)%len] : 0)*200)); ctx.stroke(); ctx.restore(); }
            } else if (p.vizType === 'cubes_3d') {
                for(let i=0; i<len; i+=15){ const v = (vD[i] || 0); const s=20+v*200; ctx.save(); ctx.translate(Math.floor((i/(len || 1))*width-width/2), Math.floor(Math.sin(animTime*0.002+i)*100)); ctx.rotate(animTime*0.001+i); ctx.strokeRect(Math.floor(-s/2),Math.floor(-s/2),Math.floor(s),Math.floor(s)); ctx.restore(); }
            } else if (p.vizType === 'sphere_3d') {
                for(let i=0; i<len; i+=10){ const v = (vD[i] || 0); const rad=i*0.1+animTime*0.0005, r=200+v*200; ctx.beginPath(); ctx.arc(Math.floor(Math.cos(rad)*r), Math.floor(Math.sin(rad)*r), Math.max(0.1, Math.floor(5+v*10)), 0, Math.PI*2); ctx.fill(); }
            } else if (p.vizType === 'tunnel_3d') {
                for(let i=0; i<12; i++){ ctx.beginPath(); ctx.arc(0,0, Math.max(0.1, Math.floor((animTime*0.2+i*100)%800)), 0, Math.PI*2); ctx.lineWidth=Math.max(0.1, Math.floor(2+(len > 0 ? vD[(i*10)%len] : 0)*20)); ctx.stroke(); }
            } else if (p.vizType === 'neon_grid') {
                for(let x=-width/2; x<width/2; x+=100){ ctx.beginPath(); ctx.moveTo(Math.floor(x),Math.floor(-height/2)); ctx.lineTo(Math.floor(x),Math.floor(height/2)); ctx.lineWidth=Math.max(0.1, Math.floor(1+(len > 0 ? vD[Math.abs(Math.floor(x/10))%len] : 0)*5)); ctx.stroke(); }
                for(let y=-height/2; y<height/2; y+=100){ ctx.beginPath(); ctx.moveTo(Math.floor(-width/2),Math.floor(y)); ctx.lineTo(Math.floor(width/2),Math.floor(y)); ctx.lineWidth=Math.max(0.1, Math.floor(1+(len > 0 ? vD[Math.abs(Math.floor(y/10))%len] : 0)*5)); ctx.stroke(); }
            } else if (p.vizType === 'hexagon') {
                const s=60; for(let i=0; i<8; i++) for(let j=0; j<8; j++) { const v=(len > 0 ? vD[(i*8+j)%len] : 0); ctx.beginPath(); for(let k=0; k<6; k++) ctx.lineTo(Math.floor((j-4)*s*1.5 + s*Math.max(0.1, (0.2+v))*Math.cos(k*Math.PI/3)), Math.floor((i-4)*s*1.7+(j%2?s*0.8:0) + s*Math.max(0.1, (0.2+v))*Math.sin(k*Math.PI/3))); ctx.closePath(); ctx.stroke(); }
            } else if (p.vizType === 'poly_world') {
                ctx.beginPath(); ctx.moveTo(Math.floor(-width/2), Math.floor(height/2)); for(let i=0; i<=10; i++) ctx.lineTo(Math.floor((i/10)*width-width/2), Math.floor(-(len > 0 ? vD[(i*10)%len] : 0)*400)); ctx.lineTo(Math.floor(width/2), Math.floor(height/2)); ctx.fill();
            } else if (p.vizType === 'pyramids') {
                for(let i=0; i<8; i++) { const x=Math.floor((i/8)*width-width/2+50), h=Math.floor((len > 0 ? vD[(i*10)%len] : 0)*400); ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+50,-h); ctx.lineTo(x+100,0); ctx.closePath(); ctx.stroke(); }
            } else if (p.vizType === 'crystal') {
                for(let i=0; i<6; i++){ ctx.save(); ctx.rotate(i*Math.PI/3); const l=Math.floor(100+(len > 0 ? vD[(i*10)%len] : 0)*200); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(30,l); ctx.lineTo(0,l+30); ctx.lineTo(-30,l); ctx.closePath(); ctx.stroke(); ctx.restore(); }
            } else if (p.vizType === 'starfield') {
                for(let i=0; i<100; i++){ const v = (len > 0 ? vD[i%len] : 0); const ang=i*137.5, d=(i*5+animTime*0.1)%width; ctx.fillRect(Math.floor(Math.cos(ang)*d), Math.floor(Math.sin(ang)*d), Math.max(1, Math.floor(2+v*10)), Math.max(1, Math.floor(2+v*10))); }
            } else if (p.vizType === 'particles') {
                for(let i=0; i<100; i++){ const ang=i*2.4+animTime*0.0005; ctx.beginPath(); ctx.arc(Math.floor(Math.sin(ang)*width*0.4), Math.floor(Math.cos(ang*0.8)*height*0.4), Math.max(0.1, Math.floor(2+(len > 0 ? vD[i%len] : 0)*30)), 0, Math.PI*2); ctx.fill(); }
            } else if (p.vizType === 'gravity_well') {
                for(let i=0; i<100; i++){ const v = (len > 0 ? vD[i%len] : 0); const ang=i*0.1, r=300+Math.sin(animTime*0.001+i)*50; ctx.beginPath(); ctx.moveTo(Math.floor(Math.cos(ang)*r), Math.floor(Math.sin(ang)*r)); ctx.lineTo(Math.floor(Math.cos(ang)*(Math.max(0.1, r-v*200))), Math.floor(Math.sin(ang)*(Math.max(0.1, r-v*200)))); ctx.stroke(); }
            } else if (p.vizType === 'star_burst') {
                if((p.isPlaying || p.rendering) && Math.random()<0.3 && starBurstRef.current.length < 200) for(let i=0; i<5; i++) starBurstRef.current.push({x:0, y:0, vx:(Math.random()-0.5)*20, vy:(Math.random()-0.5)*20, life:1, size:Math.max(0.1, 2+Math.random()*5)});
                for (let i = starBurstRef.current.length - 1; i >= 0; i--) { const s = starBurstRef.current[i]; if(p.isPlaying || p.rendering) {s.x+=s.vx; s.y+=s.vy; s.life-=0.02;} ctx.globalAlpha=Math.max(0, s.life); ctx.fillRect(Math.floor(s.x),Math.floor(s.y),Math.max(1, Math.floor(s.size)),Math.max(1, Math.floor(s.size))); if(s.life<=0) starBurstRef.current.splice(i,1); }
            } else if (p.vizType === 'vortex') {
                for(let i=0; i<len; i+=10){ const rad=i*0.1+animTime*0.003, r=i*0.5*(1+bass); ctx.fillRect(Math.floor(Math.cos(rad)*r), Math.floor(Math.sin(rad)*r), 4, 4); }
            } else if (p.vizType === 'vector_field') {
                for(let x=-width/2; x<width/2; x+=50) for(let y=-height/2; y<height/2; y+=50) { const d=Math.hypot(x,y); ctx.save(); ctx.translate(Math.floor(x),Math.floor(y)); ctx.rotate(Math.atan2(y,x)+(len > 0 ? vD[Math.floor(d/20)%len] : 0)*Math.PI); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(20,0); ctx.stroke(); ctx.restore(); }
            } else if (p.vizType === 'lava' || p.vizType === 'floating_orbs' || p.vizType === 'abstract_clouds') {
                for(let i=0; i<15; i++){ const x=Math.sin(animTime*0.0005+i)*width*0.4, y=Math.cos(animTime*0.0004+i*1.5)*height*0.4, r=Math.max(0.1, Math.floor(50+(len > 0 ? vD[(i*5)%len] : 0)*150)); ctx.beginPath(); ctx.arc(Math.floor(x),Math.floor(y),Math.floor(r),0,Math.PI*2); ctx.fill(); if(p.vizType!=='lava') ctx.stroke(); }
            } else if (p.vizType === 'plasma') {
                for(let i=0; i<8; i++){ const r=Math.max(0.1, Math.floor(150+(len > 0 ? vD[(i*20)%len] : 0)*200)), x=Math.cos(animTime*0.001+i)*r, y=Math.sin(animTime*0.001+i)*r; ctx.beginPath(); ctx.arc(Math.floor(x),Math.floor(y),Math.floor(r),0,Math.PI*2); ctx.fill(); }
            } else if (p.vizType === 'fractal_tree') {
                const drawT=(l: number, a: number, d: number)=>{ if(d>8)return; const v = (len > 0 ? vD[(d*10)%len] : 0); const nl=l*(0.7+v*0.2); ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,Math.floor(-l)); ctx.stroke(); ctx.translate(0,Math.floor(-l)); drawT(nl,0.5,d+1); drawT(nl,-0.5,d+1); ctx.restore(); }; drawT(150,0,0);
            } else if (p.vizType === 'liquid_flow' || p.vizType === 'aurora') {
                ctx.beginPath(); ctx.moveTo(Math.floor(-width/2), Math.floor(height/2)); for(let i=0; i<20; i++) ctx.quadraticCurveTo(Math.floor((i/20)*width-width/2), Math.floor(-(len > 0 ? vD[(i*5)%len] : 0)*400), Math.floor(((i+1)/20)*width-width/2), Math.floor(-(len > 0 ? vD[(i*5)%len] : 0)*400)); ctx.lineTo(Math.floor(width/2), Math.floor(height/2)); ctx.fill();
            } else if (p.vizType === 'deep_sea') {
                for(let i=0; i<5; i++){ ctx.beginPath(); ctx.moveTo(Math.floor(-width/2), Math.floor(i*100)); for(let x=-width/2; x<width/2; x+=20) ctx.lineTo(Math.floor(x), Math.floor(i*100+Math.sin(x*0.005+animTime*0.002)*(len > 0 ? vD[(i*20)%len] : 0)*100)); ctx.stroke(); }
            } else if (p.vizType === 'solar_flare') {
                for(let i=0; i<20; i++){ const v = (len > 0 ? vD[i%len] : 0); const ang=i*Math.PI/10, r=100+v*200; ctx.beginPath(); ctx.arc(Math.floor(Math.cos(ang)*r), Math.floor(Math.sin(ang)*r), Math.max(0.1, Math.floor(v*50)), 0, Math.PI*2); ctx.fill(); }
            } else if (p.vizType === 'kaleido_mesh') {
                for(let i=0; i<8; i++){ ctx.save(); ctx.rotate(i*Math.PI/4); ctx.beginPath(); for(let j=0; j<10; j++) ctx.lineTo(Math.floor(j*50), Math.floor(Math.sin(animTime*0.002+j)*(len > 0 ? vD[j%len] : 0)*100)); ctx.stroke(); ctx.restore(); }
            } else if (p.vizType === 'isometric_grid') {
                const step = 60 * responsiveScale;
                const rows = 10, cols = 10;
                ctx.beginPath();
                for(let i = -cols; i <= cols; i++){
                  for(let j = -rows; j <= rows; j++){
                    const d = Math.sqrt(i*i + j*j);
                    const v = (len > 0 ? vD[Math.floor(d * 2) % (len || 1)] : 0) || 0;
                    const hV = v * 120 * curSens * responsiveScale;
                    const isoX = (i - j) * step;
                    const isoY = (i + j) * (step / 2);
                    ctx.moveTo(Math.floor(isoX), Math.floor(isoY - hV));
                    ctx.lineTo(Math.floor(isoX + step), Math.floor(isoY + step/2 - hV));
                    ctx.lineTo(Math.floor(isoX), Math.floor(isoY + step - hV));
                    ctx.lineTo(Math.floor(isoX - step), Math.floor(isoY + step/2 - hV));
                    ctx.lineTo(Math.floor(isoX), Math.floor(isoY - hV));
                  }
                }
                ctx.stroke();
            } else if (p.vizType === 'torus_3d') {
                const r1 = 150 * responsiveScale, r2 = 60 * responsiveScale;
                const steps1 = 24, steps2 = 12;
                for(let i = 0; i < steps1; i++){
                  const phi = (i / steps1) * Math.PI * 2 + animTime * 0.0005;
                  for(let j = 0; j < steps2; j++){
                    const theta = (j / steps2) * Math.PI * 2 + animTime * 0.001;
                    const v = (len > 0 ? vD[Math.floor((i/steps1)*len) % len] : 0) || 0;
                    const rv2 = r2 * (1 + v * curSens);
                    const x = (r1 + rv2 * Math.cos(theta)) * Math.cos(phi);
                    const y = (r1 + rv2 * Math.cos(theta)) * Math.sin(phi);
                    const z = rv2 * Math.sin(theta);
                    // Simple projection
                    const s = 400 / (400 + z);
                    ctx.fillRect(Math.floor(x * s), Math.floor(y * s), 2, 2);
                  }
                }
            } else if (p.vizType === 'attractor') {
                if(attractorRef.current.length < 150) attractorRef.current = Array.from({length: 150}, () => ({
                  x: (Math.random()-0.5) * width, y: (Math.random()-0.5) * height, vx: 0, vy: 0, 
                  color: Math.random() > 0.5 ? p.barColor : vCE
                }));
                attractorRef.current.forEach((p_at, idx) => {
                  const v = (len > 0 ? vD[idx % len] : 0);
                  if(p.isPlaying || p.rendering){
                    const dx = -p_at.x, dy = -p_at.y;
                    const distSq = dx*dx + dy*dy;
                    const dist = Math.sqrt(distSq) || 1;
                    const force = (v * 50 + 5) / Math.max(dist, 20);
                    
                    let ax = dx * force * 0.02;
                    let ay = dy * force * 0.02;
                    
                    // Guard against NaN/Infinity
                    if (!isFinite(ax)) ax = 0;
                    if (!isFinite(ay)) ay = 0;
                    
                    p_at.vx += ax; p_at.vy += ay;
                    
                    const maxVel = 15 + v * 20;
                    const vel = Math.sqrt(p_at.vx * p_at.vx + p_at.vy * p_at.vy);
                    if (vel > maxVel) {
                        p_at.vx = (p_at.vx / vel) * maxVel;
                        p_at.vy = (p_at.vy / vel) * maxVel;
                    }

                    // Add jitter and update position
                    p_at.x += p_at.vx + (Math.random() - 0.5) * 0.2; 
                    p_at.y += p_at.vy + (Math.random() - 0.5) * 0.2;
                    p_at.vx *= 0.92; p_at.vy *= 0.92;

                    if (Math.abs(p_at.x) > width / 2 || Math.abs(p_at.y) > height / 2 || !isFinite(p_at.x) || !isFinite(p_at.y)) {
                        p_at.x = (Math.random() - 0.5) * width;
                        p_at.y = (Math.random() - 0.5) * height;
                        p_at.vx = 0;
                        p_at.vy = 0;
                    }
                  }
                  ctx.fillStyle = p_at.color || p.barColor;
                  ctx.beginPath(); ctx.arc(Math.floor(p_at.x), Math.floor(p_at.y), Math.max(0.1, 3 + v * 15), 0, Math.PI * 2); ctx.fill();
                });
            } else if (p.vizType === 'vaporwave_grid') {
                const speed = 2 + bass * 10;
                vaporwaveGridRef.current.offset = (vaporwaveGridRef.current.offset + speed) % 100;
                const offset = vaporwaveGridRef.current.offset;
                ctx.save();
                ctx.translate(0, height * 0.2);
                const sunR = 150 + bass * 50;
                const sunGrad = ctx.createLinearGradient(0, -sunR, 0, sunR);
                sunGrad.addColorStop(0, '#ff0080'); sunGrad.addColorStop(1, '#ff8c00');
                ctx.fillStyle = sunGrad;
                ctx.beginPath(); ctx.arc(0, -50, sunR, Math.PI, 0); ctx.fill();
                ctx.strokeStyle = p.barColor; ctx.lineWidth = 2;
                for (let i = -10; i <= 10; i++) {
                    ctx.beginPath(); ctx.moveTo(i * 100, 0); ctx.lineTo(i * 1000, height); ctx.stroke();
                }
                for (let i = 0; i < 10; i++) {
                    const y = (i * 100 + offset) % 1000;
                    const py = (y / 1000) * height;
                    const w_grid = (y / 1000) * width * 4;
                    ctx.beginPath(); ctx.moveTo(-w_grid, py); ctx.lineTo(w_grid, py); ctx.stroke();
                }
                ctx.restore();
            } else if (p.vizType === 'geometric_bloom') {
                const sides = 6, count = 12;
                for (let i = 0; i < count; i++) {
                    const r = (i * 40 + animTime * 0.1) % (minDim * 0.6 || 1);
                    const scale = 0.5 + (len > 0 ? vD[(i * 10) % len] : 0) * 1.5;
                    const angle = animTime * 0.0005 * (i % 2 ? 1 : -1);
                    ctx.save(); ctx.rotate(angle);
                    ctx.beginPath();
                    for (let s = 0; s < sides; s++) {
                        const a = (s / sides) * Math.PI * 2;
                        const x = Math.cos(a) * r * scale;
                        const y = Math.sin(a) * r * scale;
                        if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.globalAlpha = Math.max(0, (1 - r / (minDim * 0.6 || 1)) * (p.vizOpacity ?? 1.0));
                    ctx.stroke(); ctx.restore();
                }
            } else if (p.vizType === 'neural_pulse') {
                if (neuralPulseRef.current.nodes.length < 20) {
                    neuralPulseRef.current.nodes = Array.from({length: 20}, () => ({
                        x: (Math.random() - 0.5) * width, y: (Math.random() - 0.5) * height,
                        vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2
                    }));
                }
                const { nodes, sparks } = neuralPulseRef.current;
                nodes.forEach((n, i) => {
                    const v = (len > 0 ? vD[i % len] : 0);
                    if (p.isPlaying || p.rendering) {
                        n.x += n.vx * (1 + bass * 3); n.y += n.vy * (1 + bass * 3);
                        if (Math.abs(n.x) > width/2) n.vx *= -1;
                        if (Math.abs(n.y) > height/2) n.vy *= -1;
                    }
                    ctx.beginPath(); ctx.arc(n.x, n.y, 4 + v * 10, 0, Math.PI * 2); ctx.fill();
                });
                if ((p.isPlaying || p.rendering) && bass > 0.6 && Math.random() > 0.8) {
                    sparks.push({ from: Math.floor(Math.random() * nodes.length), to: Math.floor(Math.random() * nodes.length), progress: 0, speed: 0.02 + Math.random() * 0.05 });
                }
                for (let i = sparks.length - 1; i >= 0; i--) {
                    const s = sparks[i]; const n1 = nodes[s.from], n2 = nodes[s.to];
                    if (!n1 || !n2) { sparks.splice(i, 1); continue; }
                    const sx = n1.x + (n2.x - n1.x) * s.progress, sy = n1.y + (n2.y - n1.y) * s.progress;
                    ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
                    if (p.isPlaying || p.rendering) s.progress += s.speed;
                    if (s.progress >= 1) sparks.splice(i, 1);
                    ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y); ctx.globalAlpha = 0.2; ctx.stroke(); ctx.globalAlpha = 1;
                }
            } else if (p.vizType === 'quantum_foam') {
                if (quantumFoamRef.current.length < 200) {
                    quantumFoamRef.current = Array.from({length: 200}, () => ({
                        x: (Math.random() - 0.5) * width, y: (Math.random() - 0.5) * height,
                        life: Math.random(), size: 1 + Math.random() * 3
                    }));
                }
                const highFreq = len > 0 ? (vD.slice(Math.floor(len * 0.7)).reduce((a, b) => a + b, 0) / (len * 0.3 || 1)) : 0;
                quantumFoamRef.current.forEach(f => {
                    if (p.isPlaying || p.rendering) {
                        f.life -= 0.01 + highFreq * 0.1;
                        if (f.life <= 0) { f.x = (Math.random() - 0.5) * width; f.y = (Math.random() - 0.5) * height; f.life = 1; }
                    }
                    ctx.globalAlpha = Math.max(0, f.life * (p.vizOpacity ?? 1.0));
                    ctx.beginPath(); ctx.arc(f.x, f.y, Math.max(0.1, f.size * (1 + highFreq * 10)), 0, Math.PI * 2); ctx.fill();
                });
                ctx.globalAlpha = 1;
            } else if (p.vizType === 'data_stream') {
                const colCount = 40, colW = width / colCount;
                if (dataStreamRef.current.length < colCount) {
                    dataStreamRef.current = Array.from({length: colCount}, (_, i) => ({
                        x: -width/2 + i * colW, y: (Math.random() - 0.5) * height,
                        speed: 2 + Math.random() * 10, height: 20 + Math.random() * 100,
                        color: Math.random() > 0.5 ? p.barColor : vCE
                    }));
                }
                dataStreamRef.current.forEach((d, i) => {
                    const v = (len > 0 ? vD[i % len] : 0);
                    if (p.isPlaying || p.rendering) {
                        d.y += d.speed * (1 + v * 5);
                        if (d.y > height / 2) d.y = -height / 2 - d.height;
                    }
                    ctx.fillStyle = d.color;
                    ctx.fillRect(d.x + 2, d.y, colW - 4, d.height * (0.5 + v * 2));
                });
            } else if (p.vizType === 'infinite_zoom') {
                const count = 15;
                for (let i = 0; i < count; i++) {
                    const progress = (i / count + animTime * 0.0002) % 1;
                    const size = Math.pow(progress, 3) * minDim * 2;
                    const angle = progress * Math.PI;
                    ctx.save(); ctx.rotate(angle + bass); ctx.lineWidth = 2 + progress * 10;
                    ctx.globalAlpha = (1 - progress) * (p.vizOpacity ?? 1.0);
                    ctx.strokeRect(-size / 2, -size / 2, size, size); ctx.restore();
                }
            } else if (p.vizType === 'reactive_smoke') {
                if (reactiveSmokeRef.current.length < 10 && Math.random() > 0.8) {
                    reactiveSmokeRef.current.push({
                        points: [{x: (Math.random() - 0.5) * width * 0.2, y: height / 2, vx: (Math.random() - 0.5) * 2, vy: -2, life: 1}], opacity: 1
                    });
                }
                reactiveSmokeRef.current.forEach((s, i) => {
                    const last = s.points[s.points.length - 1];
                    if (p.isPlaying || (p.rendering && last && last.life > 0)) {
                        s.points.push({
                            x: last.x + last.vx + Math.sin(animTime * 0.01 + i) * 5, y: last.y + last.vy,
                            vx: last.vx + (Math.random() - 0.5) * 0.5, vy: last.vy - (len > 0 ? vD[i % len] : 0) * 2, life: last.life - 0.02
                        });
                    }
                    ctx.beginPath(); ctx.moveTo(s.points[0].x, s.points[0].y);
                    s.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
                    ctx.globalAlpha = Math.max(0, s.opacity * (p.vizOpacity ?? 1.0));
                    ctx.stroke();
                    if (s.points.length > 50 || s.points[s.points.length - 1].life <= 0) s.opacity *= 0.95;
                    if (s.opacity < 0.01) reactiveSmokeRef.current.splice(i, 1);
                });
                ctx.globalAlpha = 1;
            } else if (p.vizType === 'cyber_shield') {
                const rings = 5, sides = 12;
                for (let r = 1; r <= rings; r++) {
                    const radius = r * 60 * (1 + bass * 0.2);
                    const angleStep = (Math.PI * 2) / sides;
                    for (let s = 0; s < sides; s++) {
                        const angle = s * angleStep + animTime * 0.0005 * r;
                        const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
                        ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
                        ctx.beginPath();
                        for (let h = 0; h < 6; h++) {
                            const ha = (h / 6) * Math.PI * 2;
                            const hx = Math.cos(ha) * 25, hy = Math.sin(ha) * 25;
                            if (h === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
                        }
                        ctx.closePath();
                        ctx.globalAlpha = Math.max(0, (1 - r / (rings + 1)) * (p.vizOpacity ?? 1.0));
                        if ((len > 0 ? vD[(s * r) % len] : 0) > 0.5) ctx.fill(); else ctx.stroke();
                        ctx.restore();
                    }
                }
            } else if (p.vizType === 'audio_origami') {
                const pts = 8;
                if (audioOrigamiRef.current.points.length === 0) {
                    audioOrigamiRef.current.points = Array.from({length: pts}, () => ({x: 0, y: 0}));
                    audioOrigamiRef.current.targetPoints = Array.from({length: pts}, () => ({x: 0, y: 0}));
                }
                const { points, targetPoints } = audioOrigamiRef.current;
                if (p.isPlaying || p.rendering) {
                    targetPoints.forEach((tp, i) => {
                        const ang = (i / pts) * Math.PI * 2 + animTime * 0.001;
                        const dist = 100 + (len > 0 ? vD[(i * 15) % len] : 0) * 300;
                        tp.x = Math.cos(ang) * dist; tp.y = Math.sin(ang) * dist;
                        points[i].x += (tp.x - points[i].x) * 0.1; points[i].y += (tp.y - points[i].y) * 0.1;
                    });
                }
                ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
                for (let i = 0; i < pts; i++) {
                    ctx.lineTo(points[i].x, points[i].y); ctx.lineTo(0, 0); ctx.lineTo(points[(i + 1) % pts].x, points[(i + 1) % pts].y);
                }
                ctx.closePath(); ctx.stroke();
            } else if (p.vizType === 'stellar_core') {
                const coreR = 50 + bass * 50;
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
                grad.addColorStop(0, '#fff'); grad.addColorStop(0.5, p.barColor); grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(0, 0, coreR, 0, Math.PI * 2); ctx.fill();
                for (let i = 0; i < 12; i++) {
                    const ang = (i / 12) * Math.PI * 2 + animTime * 0.001;
                    const l = 50 + (len > 0 ? vD[(i * 10) % len] : 0) * 200;
                    ctx.beginPath(); ctx.moveTo(Math.cos(ang) * coreR, Math.sin(ang) * coreR); ctx.lineTo(Math.cos(ang) * (coreR + l), Math.sin(ang) * (coreR + l)); ctx.stroke();
                }
                if (stellarCoreRef.current.planets.length < 5) {
                    stellarCoreRef.current.planets = Array.from({length: 5}, (_, i) => ({
                        angle: Math.random() * Math.PI * 2, distance: 150 + i * 80,
                        speed: 0.001 + Math.random() * 0.005, size: 5 + Math.random() * 15, color: i % 2 === 0 ? p.barColor : vCE
                    }));
                }
                stellarCoreRef.current.planets.forEach((pl, i) => {
                    if (p.isPlaying || p.rendering) pl.angle += pl.speed * (1 + (len > 0 ? vD[(i * 20) % len] : 0) * 2);
                    const x = Math.cos(pl.angle) * pl.distance, y = Math.sin(pl.angle) * pl.distance;
                    ctx.fillStyle = pl.color;
                    ctx.beginPath(); ctx.arc(x, y, pl.size + (len > 0 ? vD[(i * 10) % len] : 0) * 10, 0, Math.PI * 2); ctx.fill();
                });
            } else if (p.vizType === 'cyber_city_flyover') {
                const buildings = cityBuildingsRef.current;
                if (buildings.length < 100) {
                    for (let i = 0; i < 100; i++) {
                        buildings.push({
                            x: (Math.random() - 0.5) * 2000,
                            z: Math.random() * 2000,
                            h: 100 + Math.random() * 400,
                            w: 40 + Math.random() * 60,
                            color: Math.random() > 0.5 ? p.barColor : vCE
                        });
                    }
                }
                const speed = 5 + bass * 20;
                ctx.save();
                ctx.translate(0, height * 0.1);
                buildings.forEach((b, i) => {
                    if (p.isPlaying || p.rendering) b.z -= speed;
                    if (b.z < 10) { b.z = 2000; b.x = (Math.random() - 0.5) * 2000; }
                    const scale = 400 / b.z;
                    const x = b.x * scale;
                    const y = height * 0.3 * scale;
                    const bw = b.w * scale;
                    const bh = (b.h + (len > 0 ? vD[i % len] : 0) * 300) * scale;
                    ctx.fillStyle = b.color;
                    ctx.globalAlpha = Math.min(1, scale * 2) * (p.vizOpacity ?? 1.0);
                    ctx.fillRect(Math.floor(x - bw / 2), Math.floor(y - bh), Math.floor(bw), Math.floor(bh));
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
                    ctx.strokeRect(Math.floor(x - bw / 2), Math.floor(y - bh), Math.floor(bw), Math.floor(bh));
                });
                ctx.restore();
            } else if (p.vizType === 'kaleido_tunnel') {
                const shapes = tunnelShapesRef.current;
                if (shapes.length < 30) {
                    for (let i = 0; i < 30; i++) {
                        shapes.push({ z: i * 50, rot: Math.random() * Math.PI * 2, type: Math.floor(Math.random() * 3), color: Math.random() > 0.5 ? p.barColor : vCE });
                    }
                }
                const highFreq = len > 0 ? (vD.slice(Math.floor(len * 0.7)).reduce((a, b) => a + b, 0) / (len * 0.3 || 1)) : 0;
                const speed = 2 + highFreq * 20;
                shapes.forEach((s, i) => {
                    if (p.isPlaying || p.rendering) {
                        s.z -= speed;
                        s.rot += 0.01 + (bass * 0.05);
                    }
                    if (s.z < 1) s.z = 1500;
                    const scale = 600 / s.z;
                    ctx.save();
                    ctx.rotate(s.rot);
                    ctx.strokeStyle = s.color;
                    ctx.lineWidth = 2 * scale;
                    ctx.globalAlpha = Math.min(1, 1500 / s.z - 1) * (p.vizOpacity ?? 1.0);
                    const r = 100 * scale;
                    ctx.beginPath();
                    if (s.type === 0) {
                        for (let k = 0; k < 6; k++) ctx.lineTo(Math.cos(k * Math.PI / 3) * r, Math.sin(k * Math.PI / 3) * r);
                    } else if (s.type === 1) {
                        ctx.arc(0, 0, r, 0, Math.PI * 2);
                    } else {
                        ctx.rect(-r, -r, r * 2, r * 2);
                    }
                    ctx.closePath(); ctx.stroke();
                    ctx.restore();
                });
            } else if (p.vizType === 'vhs_glitch_field') {
                const lines = vhsGlitchRef.current;
                if (lines.length < 10) {
                    for (let i = 0; i < 10; i++) lines.push({ y: (Math.random() - 0.5) * height, speed: 1 + Math.random() * 3, opacity: Math.random() });
                }
                ctx.save();
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                for (let i = -height / 2; i < height / 2; i += 4) ctx.fillRect(-width / 2, i, width, 1);
                lines.forEach(l => {
                    if (p.isPlaying || p.rendering) l.y += l.speed * (1 + bass * 5);
                    if (l.y > height / 2) l.y = -height / 2;
                    ctx.fillStyle = p.barColor;
                    ctx.globalAlpha = l.opacity * (0.2 + avgVol * 0.5) * (p.vizOpacity ?? 1.0);
                    ctx.fillRect(-width / 2, Math.floor(l.y), width, Math.floor(2 + Math.random() * 5));
                });
                if ((p.isPlaying || p.rendering) && Math.random() > 0.95) {
                    const h_slice = Math.random() * 100;
                    const y_slice = (Math.random() - 0.5) * height;
                    ctx.drawImage(canvas, 0, Math.floor(y_slice + height/2), width, Math.floor(h_slice), Math.floor((Math.random() - 0.5) * 50), Math.floor(y_slice + height/2), width, Math.floor(h_slice));
                }
                ctx.restore();
            } else if (p.vizType === 'celestial_clock') {
                const gears = clockGearsRef.current;
                if (gears.length < 5) {
                    for (let i = 0; i < 5; i++) gears.push({ angle: 0, speed: (i + 1) * 0.001, size: 100 + i * 80, x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 });
                }
                gears.forEach((g, i) => {
                    const v = (len > 0 ? vD[Math.floor(i * len / 5) % len] : 0);
                    if (p.isPlaying || p.rendering) g.angle += g.speed * (1 + v * 5);
                    ctx.save();
                    ctx.translate(g.x, g.y);
                    ctx.rotate(g.angle);
                    ctx.strokeStyle = i % 2 === 0 ? p.barColor : vCE;
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = (p.vizOpacity ?? 1.0) * (0.3 + v * 0.7);
                    const r = g.size * (1 + v * 0.2);
                    ctx.beginPath();
                    for (let k = 0; k < 40; k++) {
                        const a = (k / 40) * Math.PI * 2;
                        const tr = k % 2 === 0 ? r : r + 10;
                        ctx.lineTo(Math.cos(a) * tr, Math.sin(a) * tr);
                    }
                    ctx.closePath(); ctx.stroke();
                    if (i === 0) {
                        ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2); ctx.stroke();
                    }
                    ctx.restore();
                });
            } else if (p.vizType === 'liquid_metal_blob') {
                const pts = 64;
                if (liquidBlobRef.current.points.length === 0) {
                    for (let i = 0; i < pts; i++) liquidBlobRef.current.points.push({ x: 0, y: 0 });
                }
                const radius = minDim * 0.2;
                ctx.beginPath();
                for (let i = 0; i <= pts; i++) {
                    const idx = i % pts;
                    const angle = (idx / pts) * Math.PI * 2;
                    const v = (len > 0 ? vD[Math.floor((idx / pts) * len) % len] : 0);
                    const r = radius * (1 + v * curSens * 0.8) + Math.sin(animTime * 0.002 + i * 0.2) * 20;
                    const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2);
                grad.addColorStop(0, p.barColor); grad.addColorStop(1, vCE);
                ctx.fillStyle = grad; ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            } else if (p.vizType === 'neural_storm') {
                const { nodes, bolts } = neuralStormRef.current;
                if (nodes.length < 30) {
                    for (let i = 0; i < 30; i++) nodes.push({ x: (Math.random() - 0.5) * width, y: (Math.random() - 0.5) * height, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 });
                }
                nodes.forEach((n, i) => {
                    if (p.isPlaying || p.rendering) {
                        n.x += n.vx * (1 + bass * 2); n.y += n.vy * (1 + bass * 2);
                        if (Math.abs(n.x) > width / 2) n.vx *= -1;
                        if (Math.abs(n.y) > height / 2) n.vy *= -1;
                    }
                    ctx.fillStyle = p.barColor;
                    ctx.beginPath(); ctx.arc(n.x, n.y, 2, 0, Math.PI * 2); ctx.fill();
                });
                if ((p.isPlaying || p.rendering) && bass > 0.7 && Math.random() > 0.6) {
                    bolts.push({ from: Math.floor(Math.random() * nodes.length), to: Math.floor(Math.random() * nodes.length), life: 1.0 });
                }
                for (let i = bolts.length - 1; i >= 0; i--) {
                    const b = bolts[i]; b.life -= 0.05;
                    if (b.life <= 0) { bolts.splice(i, 1); continue; }
                    const n1 = nodes[b.from], n2 = nodes[b.to];
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * b.life; ctx.globalAlpha = b.life * (p.vizOpacity ?? 1.0);
                    ctx.beginPath(); ctx.moveTo(n1.x, n1.y);
                    for (let k = 1; k < 5; k++) {
                        const tx = n1.x + (n2.x - n1.x) * (k / 5) + (Math.random() - 0.5) * 50;
                        const ty = n1.y + (n2.y - n1.y) * (k / 5) + (Math.random() - 0.5) * 50;
                        ctx.lineTo(tx, ty);
                    }
                    ctx.lineTo(n2.x, n2.y); ctx.stroke();
                }
                ctx.globalAlpha = (p.vizOpacity ?? 1.0);
            } else if (p.vizType === 'particle_shatter') {
                const particles = shatterParticlesRef.current;
                const sides = 6, r_base = 150 * (1 + bass * 0.2);
                if ((p.isPlaying || p.rendering) && bass > 0.8 && Math.random() > 0.8) {
                    for (let i = 0; i < 50; i++) {
                        const ang = Math.random() * Math.PI * 2;
                        const spd = 5 + Math.random() * 15;
                        particles.push({
                            x: 0, y: 0, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                            life: 1.0, color: Math.random() > 0.5 ? p.barColor : vCE, size: 2 + Math.random() * 5
                        });
                    }
                }
                ctx.save();
                ctx.globalAlpha = (p.vizOpacity ?? 1.0) * (1 - bass * 0.5);
                ctx.beginPath();
                for (let i = 0; i < sides; i++) {
                    const a = (i / sides) * Math.PI * 2 + animTime * 0.001;
                    const x = Math.cos(a) * r_base, y = Math.sin(a) * r_base;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath(); ctx.stroke();
                for (let i = particles.length - 1; i >= 0; i--) {
                    const pt = particles[i];
                    if (p.isPlaying || p.rendering) {
                        pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.02;
                        pt.vx *= 0.98; pt.vy *= 0.98;
                    }
                    if (pt.life <= 0) { particles.splice(i, 1); continue; }
                    ctx.fillStyle = pt.color; ctx.globalAlpha = pt.life * (p.vizOpacity ?? 1.0);
                    ctx.fillRect(Math.floor(pt.x), Math.floor(pt.y), Math.floor(pt.size), Math.floor(pt.size));
                }
                ctx.restore();
            } else if (p.vizType === 'circuit_board') {
                const { traces } = circuitBoardRef.current;
                if ((p.isPlaying || p.rendering) && bass > 0.6 && traces.length < 100) {
                    for(let i=0; i<5; i++) traces.push({
                        x: (Math.random()-0.5)*width, y: (Math.random()-0.5)*height,
                        vx: Math.random() > 0.5 ? (Math.random()>0.5?2:-2) : 0,
                        vy: Math.random() > 0.5 ? 0 : (Math.random()>0.5?2:-2),
                        life: 1.0, color: Math.random() > 0.5 ? p.barColor : vCE
                    });
                }
                traces.forEach((t, i) => {
                    if (p.isPlaying || p.rendering) {
                        t.x += t.vx; t.y += t.vy; t.life -= 0.005;
                        if (Math.random() > 0.98) { // branching
                            const horizontal = t.vx !== 0;
                            t.vx = horizontal ? 0 : (Math.random()>0.5?2:-2);
                            t.vy = horizontal ? (Math.random()>0.5?2:-2) : 0;
                        }
                    }
                    ctx.strokeStyle = t.color; ctx.lineWidth = 2; ctx.globalAlpha = t.life * (p.vizOpacity ?? 1.0);
                    ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x-t.vx*5, t.y-t.vy*5); ctx.stroke();
                    if (t.life <= 0) traces.splice(i, 1);
                });
            } else if (p.vizType === 'geometric_kaleidoscope') {
                const sides = 6;
                for (let i = 0; i < 8; i++) {
                    ctx.save();
                    ctx.rotate((i / 8) * Math.PI * 2 + animTime * 0.0005);
                    const v = (len > 0 ? vD[Math.floor(i * len / 8) % len] : 0);
                    const r = 100 + v * 300;
                    ctx.beginPath();
                    for (let s = 0; s < sides; s++) {
                        const a = (s / sides) * Math.PI * 2;
                        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                    }
                    ctx.closePath();
                    ctx.strokeStyle = i % 2 === 0 ? p.barColor : vCE;
                    ctx.stroke();
                    ctx.restore();
                }
            } else if (p.vizType === 'matrix_tunnel') {
                const { chars } = matrixTunnelRef.current;
                if (chars.length < 100) {
                    for(let i=0; i<100; i++) chars.push({
                        x: (Math.random()-0.5)*width*2, y: (Math.random()-0.5)*height*2, z: Math.random()*2000,
                        char: String.fromCharCode(0x30A0 + Math.random() * 96)
                    });
                }
                const speed = 5 + bass * 30;
                chars.forEach(c => {
                    if (p.isPlaying || p.rendering) c.z -= speed;
                    if (c.z < 1) { c.z = 2000; c.char = String.fromCharCode(0x30A0 + Math.random() * 96); }
                    const scale = 600 / c.z;
                    ctx.font = `${Math.floor(20 * scale)}px monospace`;
                    ctx.fillStyle = p.barColor;
                    ctx.globalAlpha = Math.min(1, 2000/c.z - 1) * (p.vizOpacity ?? 1.0);
                    ctx.fillText(c.char, c.x * scale, c.y * scale);
                });
            } else if (p.vizType === 'neon_butterfly') {
                const wings = 2;
                for (let i = 0; i < wings; i++) {
                    ctx.save();
                    const side = i === 0 ? 1 : -1;
                    const flap = Math.sin(animTime * 0.01) * 0.5 * side;
                    ctx.scale(side, 1);
                    ctx.rotate(flap);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    const r1 = 100 + bass * 200, r2 = 200 + avgVol * 300;
                    ctx.bezierCurveTo(r1, -r1, r2, r1, 0, r2);
                    ctx.fillStyle = p.barColor; ctx.globalAlpha = (p.vizOpacity ?? 1.0) * 0.6;
                    ctx.fill(); ctx.strokeStyle = "#fff"; ctx.stroke();
                    ctx.restore();
                }
            } else if (p.vizType === 'voxel_terrain') {
                const grid = voxelTerrainRef.current.grid;
                const rows = 20, cols = 20;
                if (grid.length === 0) {
                    for(let i=0; i<rows; i++) grid[i] = new Array(cols).fill(0);
                }
                const stepX = width / cols, stepY = height / rows;
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < cols; j++) {
                        const v = (len > 0 ? vD[Math.floor((i*cols+j) * len / (rows*cols)) % len] : 0);
                        if (p.isPlaying || p.rendering) grid[i][j] = v * 200;
                        const x = (j - cols/2) * stepX, y = (i - rows/2) * stepY;
                        const h_v = grid[i][j];
                        ctx.fillStyle = p.barColor; ctx.globalAlpha = (p.vizOpacity ?? 1.0) * (0.2 + v);
                        ctx.fillRect(x, y - h_v, stepX-2, stepY-2);
                    }
                }
            } else if (p.vizType === 'glitch_portraits') {
                if (Math.random() > 0.9 && (p.isPlaying || p.rendering)) {
                    for (let i = 0; i < 5; i++) {
                        const x = (Math.random()-0.5)*width, y = (Math.random()-0.5)*height;
                        const w_p = 50 + Math.random()*200, h_p = 50 + Math.random()*200;
                        ctx.fillStyle = Math.random() > 0.5 ? p.barColor : vCE;
                        ctx.globalAlpha = (p.vizOpacity ?? 1.0) * 0.5;
                        ctx.fillRect(x, y, w_p, h_p);
                        ctx.strokeStyle = "#fff"; ctx.strokeRect(x, y, w_p, h_p);
                    }
                }
            } else if (p.vizType === 'poly_pulse') {
                const { faces } = polyPulseRef.current;
                if (faces.length === 0) {
                    for(let i=0; i<20; i++) faces.push({ angles: [Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2], dist: 100, v: 0 });
                }
                faces.forEach(f => {
                    if (p.isPlaying || p.rendering) {
                        f.v = bass * 50;
                        f.dist = 150 + f.v;
                    }
                    ctx.beginPath();
                    f.angles.forEach((a, i) => {
                        const x = Math.cos(a) * f.dist, y = Math.sin(a) * f.dist;
                        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    });
                    ctx.closePath();
                    ctx.strokeStyle = p.barColor; ctx.globalAlpha = (p.vizOpacity ?? 1.0);
                    ctx.stroke();
                });
            } else if (p.vizType === 'retro_wave_sun') {
                const r = minDim * 0.3 + bass * 50;
                const grad = ctx.createLinearGradient(0, -r, 0, r);
                grad.addColorStop(0, '#ff0080'); grad.addColorStop(1, '#ff8c00');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.fill();
                // Scanlines on sun
                ctx.fillStyle = '#000';
                for (let i = 0; i < r; i += 10) {
                    const h_line = 2 + (i/r)*8;
                    ctx.fillRect(-r, i, r*2, h_line);
                }
            } else if (p.vizType === 'energy_orb') {
                const { sparks } = energyOrbRef.current;
                const r = 100 + avgVol * 150;
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
                grad.addColorStop(0, '#fff'); grad.addColorStop(0.4, p.barColor); grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
                if ((p.isPlaying || p.rendering) && Math.random() > 0.7) {
                    sparks.push({ ang: Math.random()*Math.PI*2, len: 0, life: 1.0 });
                }
                sparks.forEach((s, i) => {
                    if (p.isPlaying || p.rendering) {
                        s.len += 20; s.life -= 0.05;
                    }
                    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.globalAlpha = s.life * (p.vizOpacity ?? 1.0);
                    ctx.beginPath(); ctx.moveTo(Math.cos(s.ang)*r, Math.sin(s.ang)*r);
                    ctx.lineTo(Math.cos(s.ang)*(r+s.len), Math.sin(s.ang)*(r+s.len));
                    ctx.stroke();
                    if (s.life <= 0) sparks.splice(i, 1);
                });
            } else if (p.vizType === 'strings_of_fate') {
                const count = 20;
                const w_s = width / count;
                for (let i = 0; i < count; i++) {
                    const v = (len > 0 ? vD[Math.floor(i * len / count) % len] : 0);
                    const x = -width/2 + i * w_s;
                    ctx.beginPath();
                    ctx.moveTo(x, -height/2);
                    ctx.quadraticCurveTo(x + v*100, 0, x, height/2);
                    ctx.strokeStyle = p.barColor; ctx.lineWidth = 1 + v*5;
                    ctx.globalAlpha = (p.vizOpacity ?? 1.0) * (0.3 + v);
                    ctx.stroke();
                }
            } else if (p.vizType === 'flow_field') {
                if(flowFieldRef.current.length < 150) flowFieldRef.current = Array.from({length: 150}, () => ({
                  x: (Math.random()-0.5) * width, y: (Math.random()-0.5) * height, vx: 0, vy: 0, life: Math.random()
                }));
                flowFieldRef.current.forEach((p_f, idx) => {
                  const v = (len > 0 ? vD[idx % len] : 0);
                  if(p.isPlaying || p.rendering){
                    const angle = (p_f.x / (width || 1)) * Math.PI * 4 + (p_f.y / (height || 1)) * Math.PI * 4 + animTime * 0.001;
                    const speed = 2 + v * 15;
                    p_f.vx = Math.cos(angle) * speed; p_f.vy = Math.sin(angle) * speed;
                    p_f.x += p_f.vx; p_f.y += p_f.vy;
                    p_f.life -= 0.01;
                    if(p_f.life <= 0 || Math.abs(p_f.x) > width/2 || Math.abs(p_f.y) > height/2 || !isFinite(p_f.x) || !isFinite(p_f.y)){
                      p_f.x = (Math.random()-0.5) * width; p_f.y = (Math.random()-0.5) * height; p_f.life = 1;
                    }
                  }
                  ctx.globalAlpha = Math.max(0, p_f.life * (p.vizOpacity ?? 1.0));
                  ctx.fillRect(Math.floor(p_f.x), Math.floor(p_f.y), 3, 3);
                });
                ctx.globalAlpha = p.vizOpacity ?? 1.0;
            } else if (p.vizType === 'techno_wires') {
                const pts=Array.from({length:10},(_,i)=>({x:Math.cos(i)*200, y:Math.sin(i)*200, v:(len > 0 ? vD[i%len] : 0)}));
                pts.forEach((pt)=>{ ctx.beginPath(); ctx.arc(Math.floor(pt.x),Math.floor(pt.y),Math.max(0.1, Math.floor(5+pt.v*10)),0,Math.PI*2); ctx.fill(); pts.forEach(p2=>{ if(Math.hypot(pt.x-p2.x,p2.y-pt.y)<300) { ctx.beginPath(); ctx.moveTo(Math.floor(pt.x),Math.floor(pt.y)); ctx.lineTo(Math.floor(p2.x),Math.floor(p2.y)); ctx.stroke(); } }); });
            } else {
                const bW = (width / (len || 1)) * 2; for (let i = 0; i < len; i++) ctx.fillRect(Math.floor(-width/2 + i*bW), 0, Math.max(1, Math.floor(bW-1)), Math.floor(-(vD[i] || 0) * height * 0.4 * curSens));
            }
          };
          drawViz();
          if (p.mirrorX) { ctx.save(); ctx.scale(-1,1); drawViz(); ctx.restore(); }
          if (p.mirrorY) { ctx.save(); ctx.scale(1,-1); drawViz(); ctx.restore(); }
          ctx.restore();
        }

        // --- Typography ---
        ctx.save();
        let bS = 1.0;
        let tOX = 0;
        let tOY = 0;
        let tAlpha = 1.0;
        let rGlow = 0;

        if (p.textReact === 'pulse') bS = 1.0 + (rV * 0.5);
        if (p.textReact === 'bounce') tOY = -rV * 100 * responsiveScale;
        if (p.textReact === 'jitter') {
          tOX = (Math.random() - 0.5) * rV * 50 * responsiveScale;
          tOY = (Math.random() - 0.5) * rV * 50 * responsiveScale;
        }
        if (p.textReact === 'flash') tAlpha = Math.max(0.2, 1.0 - (rV * 0.8));
        if (p.textReact === 'glow') rGlow = rV * 100 * responsiveScale;

        ctx.globalAlpha = tAlpha;

        const margin = ((p.textMargin ?? 5) / 100) * width;
        const baseSize = 80 * responsiveScale * (p.fontSizeScale ?? 1.0) * bS;
        
        let tx = width / 2, ty = height / 2;
        let align: CanvasTextAlign = 'center';

        if (p.textPosition.includes('top')) ty = margin + baseSize;
        else if (p.textPosition.includes('bottom')) ty = height - margin - (baseSize * 0.5);
        
        if (p.textPosition.includes('left')) { tx = margin; align = 'left'; }
        else if (p.textPosition.includes('right')) { tx = width - margin; align = 'right'; }
        
        tx += (p.textOffsetX ?? 0) * (width / 100) + tOX;
        ty += (p.textOffsetY ?? 0) * (height / 100) + tOY;

        // Text Gradient Logic
        let tCS = p.textColor; let tCE = p.textColorEnd || '#8b5cf6';
        if (p.textGradientMotion) { const t = (Math.sin(animTime * 0.0012) + 1) / 2; tCS = lerpColor(p.textColor, tCE, t); tCE = lerpColor(tCE, p.textColor, t); }
        
        let finalTextColor: string | CanvasGradient = tCS;
        if (p.useTextGradient || p.textGradientMotion) {
          const g = ctx.createLinearGradient(tx, ty - baseSize, tx, ty + baseSize*0.5);
          g.addColorStop(0, tCS); g.addColorStop(1, tCE);
          finalTextColor = g;
        }

        // Reactive Brightness for Glow mode (if not using gradient)
        if (p.textReact === 'glow' && rV > 0.1 && !p.useTextGradient && !p.textGradientMotion) {
          const rgb = hexToRgb(p.textColor);
          const boost = Math.floor(rV * 100);
          finalTextColor = `rgb(${Math.min(255, rgb.r + boost)}, ${Math.min(255, rgb.g + boost)}, ${Math.min(255, rgb.b + boost)})`;
        }
        ctx.fillStyle = finalTextColor; 
        
        if (p.textGlow || p.textReact === 'glow') {
          ctx.shadowColor = p.textReact === 'glow' ? (typeof finalTextColor === 'string' ? finalTextColor : p.textColor) : p.textColor;
          ctx.shadowBlur = (p.textGlow ? 15 * responsiveScale : 0) + rGlow;
        }

        ctx.font = `bold ${Math.floor(baseSize)}px "${p.fontFamily}", sans-serif`;
        ctx.textAlign = align;
        
        if (p.textOutline) {
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 4 * responsiveScale;
          ctx.strokeText(p.title, tx, ty);
        }
        ctx.fillText(p.title, tx, ty);
        
        ctx.font = `${Math.floor(baseSize * 0.5)}px "${p.fontFamily}", sans-serif`;
        if (p.textOutline) {
          ctx.lineWidth = 2 * responsiveScale;
          ctx.strokeText(p.artist, tx, ty + baseSize * 0.8);
        }
        ctx.fillText(p.artist, tx, ty + baseSize * 0.8);
        ctx.restore();

        // --- Master Effects & Post-Processing ---
        if ((p.isPlaying || p.rendering)) {
          // Kaleidoscope
          if (p.kaleidoscope) {
            if (!pixelCanvasRef.current) pixelCanvasRef.current = document.createElement('canvas');
            const pC = pixelCanvasRef.current;
            if (pC.width !== width || pC.height !== height) { pC.width = width; pC.height = height; }
            const pCtx = pC.getContext('2d');
            if (pCtx) {
              pCtx.drawImage(canvas, 0, 0);
              ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
              ctx.save();
              ctx.translate(width/2, height/2);
              const slices = 8;
              for (let i = 0; i < slices; i++) {
                ctx.rotate((Math.PI * 2) / slices);
                ctx.drawImage(pC, -width/2, -height/2);
              }
              ctx.restore();
            }
          }

          // RGB Shift & Glitch & Other FX
          if (p.rgbShiftIntensity > 0 || p.glitchIntensity > 0 || p.noise || p.invert || p.pixelate) {
            if (!pixelCanvasRef.current) pixelCanvasRef.current = document.createElement('canvas');
            const pC = pixelCanvasRef.current;
            if (pC.width !== width || pC.height !== height) { pC.width = width; pC.height = height; }
            const pCtx = pC.getContext('2d');
            if (pCtx) {
              pCtx.drawImage(canvas, 0, 0);

              // RGB Shift
              if (p.rgbShiftIntensity > 0) {
                const shift = p.rgbShiftIntensity * 15 * responsiveScale;
                ctx.save();
                ctx.clearRect(0, 0, width, height);
                ctx.globalAlpha = 0.6;
                ctx.globalCompositeOperation = 'screen';
                ctx.drawImage(pC, shift, 0);
                ctx.drawImage(pC, -shift, 0);
                ctx.drawImage(pC, 0, 0);
                ctx.restore();
                pCtx.drawImage(canvas, 0, 0);
              }

              // Glitch Slices
              if (p.glitchIntensity > 0 && Math.random() < p.glitchIntensity) {
                const sliceCount = Math.floor(5 + p.glitchIntensity * 10);
                for (let i = 0; i < sliceCount; i++) {
                  const sy = Math.random() * height;
                  const sh = Math.random() * 100 * responsiveScale;
                  const sx = (Math.random() - 0.5) * 150 * p.glitchIntensity * responsiveScale;
                  ctx.drawImage(pC, 0, sy, width, sh, sx, sy, width, sh);
                }
                pCtx.drawImage(canvas, 0, 0);
              }

              // Invert
              if (p.invert) {
                ctx.save();
                ctx.globalCompositeOperation = 'difference';
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
                pCtx.drawImage(canvas, 0, 0);
              }

              // Pixelate
              if (p.pixelate) {
                const size = Math.max(2, Math.floor(4 * responsiveScale));
                const sw = Math.floor(width / size);
                const sh = Math.floor(height / size);
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(canvas, 0, 0, width, height, 0, 0, sw, sh);
                ctx.drawImage(canvas, 0, 0, sw, sh, 0, 0, width, height);
                ctx.restore();
                pCtx.drawImage(canvas, 0, 0);
              }

              // Noise
              if (p.noise) {
                ctx.save();
                ctx.fillStyle = `rgba(${Math.random()*50}, ${Math.random()*50}, ${Math.random()*50}, 0.1)`;
                for(let i=0; i<5; i++) {
                   ctx.fillRect(Math.random()*width, Math.random()*height, 2, 2);
                }
                ctx.restore();
              }
            }
          }
        }

        ctx.restore(); // Restore master shake

        // FX
        if (p.vignette) { const vg = ctx.createRadialGradient(width/2, height/2, width/3, width/2, height/2, width*0.9); vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.8)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, width, height); }
        if (p.scanlines) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let i = 0; i < height; i += 4) ctx.fillRect(0, i, width, 1); }

        // --- 6. FADES ---
        if (audioElement) {
          const ct = audioElement.currentTime;
          const du = p.endTime || audioElement.duration;
          const st = p.startTime || 0;
          let a = 1.0;
          let ft = 'none';
          
          if (ct < st + (p.fadeInDuration ?? 2)) {
            ft = p.fadeInType ?? 'none';
            a = Math.max(0, (ct - st) / (p.fadeInDuration ?? 2));
          } else if (ct > du - (p.fadeOutDuration ?? 2)) {
            ft = p.fadeOutType ?? 'none';
            a = Math.max(0, (du - ct) / (p.fadeOutDuration ?? 2));
            if (ct >= du) a = 0; // Force full fade at end
          }

          if (a < 1.0 && ft !== 'none') {
            if (ft === 'pixel') {
              if (!pixelCanvasRef.current) pixelCanvasRef.current = document.createElement('canvas');
              const pC = pixelCanvasRef.current;
              const pS = Math.max(1, Math.floor(1 + (1 - a) * 80));
              const tW = Math.max(1, Math.floor(width / pS));
              const tH = Math.max(1, Math.floor(height / pS));
              if (pC.width !== tW || pC.height !== tH) { pC.width = tW; pC.height = tH; }
              const pCtx = pC.getContext('2d', { alpha: false });
              if (pCtx) {
                pCtx.imageSmoothingEnabled = false;
                pCtx.drawImage(canvas, 0, 0, width, height, 0, 0, tW, tH);
                ctx.save();
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, width, height);
                ctx.imageSmoothingEnabled = false;
                ctx.globalAlpha = a;
                ctx.drawImage(pC, 0, 0, tW, tH, 0, 0, width, height);
                ctx.restore();
              }
            } else if (ft === 'black') {
              ctx.save();
              ctx.fillStyle = `rgba(0,0,0,${1 - a})`;
              ctx.fillRect(0, 0, width, height);
              ctx.restore();
            } else if (ft === 'white') {
              ctx.save();
              ctx.fillStyle = `rgba(255,255,255,${1 - a})`;
              ctx.fillRect(0, 0, width, height);
              ctx.restore();
            } else if (ft === 'simple') {
              ctx.save();
              ctx.globalAlpha = 1 - a;
              ctx.fillStyle = '#000';
              ctx.fillRect(0, 0, width, height);
              ctx.restore();
            } else if (ft === 'blur') {
              ctx.save();
              ctx.filter = `blur(${Math.floor((1 - a) * 30 * responsiveScale)}px)`;
              ctx.drawImage(canvas, 0, 0);
              ctx.restore();
            }
          }
        }

      } catch (err) { console.error(err); }
      
      const nextFrame = () => { if (animationRef.current !== undefined) animationRef.current = requestAnimationFrame(render); };
      if (!p.rendering) {
        nextFrame();
      }
    };
    renderFrameRef.current = render;
    animationRef.current = requestAnimationFrame(render);
    return () => { if (animationRef.current !== undefined) { cancelAnimationFrame(animationRef.current); animationRef.current = undefined; } };
  }, [analyser, bgType, resolution, w, h]);

  return (
    <div className="visualizer-container" style={{ 
      aspectRatio: `${w}/${h}`, 
      maxWidth: '100%', 
      maxHeight: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#000',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}));