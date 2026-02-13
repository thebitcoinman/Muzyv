import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

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
}

export const Visualizer = forwardRef<HTMLCanvasElement, VisualizerProps>((props, ref) => {
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

  const [w, h] = resolution.split('x').map(Number);

  // Web Worker Heartbeat to prevent tab throttling during export
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (props.rendering) {
      const blob = new Blob([`
        let interval;
        onmessage = (e) => {
          if (e.data === 'start') {
            interval = setInterval(() => postMessage('tick'), 16);
          } else if (e.data === 'stop') {
            clearInterval(interval);
          }
        };
      `], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      workerRef.current = worker;
      
      worker.onmessage = () => {
        if (propsRef.current.rendering && animationRef.current === undefined) {
          // Worker tick acts as a fallback if requestAnimationFrame is throttled
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
  const vinesRef = useRef<{x: number, y: number, angle: number, length: number, color: string}[]>([]);

  const clearYoyoFrames = () => {
    yoyoFramesRef.current.forEach(b => { try { b.close(); } catch(e) {} });
    yoyoFramesRef.current = [];
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
    matrixDropsRef.current = [];
    starBurstRef.current = [];
    fireRef.current = [];
    swarmRef.current = [];
    neuralNetRef.current = [];
    vinesRef.current = [];
  }, [props.vizType]);

  // Background Logic
  useEffect(() => {
    let isCancelled = false;
    const { yoyoMode } = propsRef.current;

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
  }, [bgUrl, bgType, props.yoyoMode, w, h]);

  useEffect(() => {
    bgTimeRef.current = 0;
    frozenTimeRef.current = 0;
  }, [bgUrl]);

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
        if (now - lastExportFrameTimeRef.current < frameInterval - 1) { 
          animationRef.current = requestAnimationFrame(render); return; 
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

      const effectiveBgSpeed = (p.bgSpeed ?? 1.0) + (isNaN(avgVol) ? 0 : avgVol) * (p.bgBeatResponse ?? 0.8) * 3;
      if (p.isPlaying || p.rendering) bgTimeRef.current += (isNaN(delta) ? 0 : delta) * effectiveBgSpeed;
      const bgTimeValue = bgTimeRef.current;

      try {
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
          if(p.useGradient || p.vizGradientMotion) { const g=ctx.createLinearGradient(0, height/2, 0, -height/2); g.addColorStop(0, vCS); g.addColorStop(1, vCE); fs=g; }
          ctx.fillStyle = fs; ctx.strokeStyle = fs; ctx.lineWidth = Math.max(0.1, (p.vizThickness ?? 2) * responsiveScale);

          const drawViz = () => {
            if (p.vizType === 'spectrum') {
                const bW = (width / len) * 2; for (let i = 0; i < len; i++) ctx.fillRect(Math.floor(-width/2 + i*(bW+1)), 0, Math.max(1, Math.floor(bW)), Math.floor(-vD[i] * height * 0.5 * curSens));
            } else if (p.vizType === 'mirror_spectrum') {
                const bW = (width / len) * 4; for (let i = 0; i < len; i++) { const vx = Math.floor(-width/2 + i*(bW+1)); ctx.fillRect(vx, 0, Math.max(1, Math.floor(bW)), Math.floor(-vD[i] * height * 0.5 * curSens)); ctx.fillRect(vx, 0, Math.max(1, Math.floor(bW)), Math.floor(vD[i] * height * 0.5 * curSens)); }
            } else if (p.vizType === 'bars_3d') {
                const bW = (width / 40) * 0.6; for(let i=0; i<40; i++) { const hV = vD[Math.floor(i*(len/40))%len]*height*0.8*curSens; ctx.save(); ctx.translate(Math.floor((i/40)*width-width/2), 0); ctx.transform(1, 0.4, 0, 1, 0, 0); ctx.fillRect(0, 0, Math.max(1, Math.floor(bW)), Math.floor(-hV)); ctx.strokeRect(0, 0, Math.max(1, Math.floor(bW)), Math.floor(-hV)); ctx.restore(); }
            } else if (p.vizType === 'bar_rain') {
                const bW = (width / 40) * 0.8; for(let i=0; i<40; i++) ctx.fillRect(Math.floor((i/40) * width - width/2), Math.floor(-height/2), Math.max(1, Math.floor(bW)), Math.floor(vD[Math.floor(i * (len/40)) % len] * height * curSens));
            } else if (p.vizType === 'cyber_city') {
                const bW = (width / 50) * 0.85; for(let i=0; i<50; i++) ctx.fillRect(Math.floor((i/50)*width-width/2), 0, Math.max(1, Math.floor(bW)), Math.floor(-vD[Math.floor(i*(len/50))%len]*height*0.9*curSens));
            } else if (p.vizType === 'pixel_blocks') {
                const size = 50 * responsiveScale; const rows = 15; const cols = Math.floor(width / size); for(let i=0; i<cols; i++) { const hV = Math.floor(vD[Math.floor(i * (len/cols)) % len] * rows * curSens); for(let j=0; j<hV; j++) ctx.fillRect(Math.floor((i - cols/2) * size), Math.floor(-j * size), Math.floor(size - 4), Math.floor(size - 4)); }
            } else if (p.vizType === 'led_wall' || p.vizType === 'led') {
                const r=15, c=25; const bW=width/c, bH=height/r; for(let i=0; i<c; i++) for(let j=0; j<vD[Math.floor(i*(len/c))%len]*r*curSens; j++) ctx.fillRect(Math.floor(i*bW-width/2), Math.floor(height/2-j*bH-bH), Math.max(1, Math.floor(bW-2)), Math.max(1, Math.floor(bH-2)));
            } else if (p.vizType === 'wave' || p.vizType === 'dual_wave' || p.vizType === 'classic_wave') {
                ctx.beginPath(); let wx=-width/2; for(let i=0; i<len; i++){ ctx.lineTo(Math.floor(wx),Math.floor(vD[i]*height*0.4*curSens)); wx+=width/len; } ctx.stroke();
                if(p.vizType === 'dual_wave'){ ctx.beginPath(); wx=-width/2; for(let i=0; i<len; i++){ ctx.lineTo(Math.floor(wx),Math.floor(-vD[i]*height*0.4*curSens)); wx+=width/len; } ctx.stroke(); }
            } else if (p.vizType === 'circle' || p.vizType === 'ring' || p.vizType === 'pulse') {
                const r=Math.max(1, minDim*0.25+bass*50*curSens); const count=120; for(let i=0; i<count; i++){ const v=vD[Math.floor(i*(len/count))%len]; const rad=(Math.PI*2)*(i/count); ctx.beginPath(); if(p.vizType==='ring') ctx.arc(Math.floor(Math.cos(rad)*(r+v*minDim*0.3*curSens)), Math.floor(Math.sin(rad)*(r+v*minDim*0.3*curSens)), Math.max(0.1, Math.floor(2+v*10)), 0, Math.PI*2), ctx.fill(); else ctx.moveTo(Math.floor(Math.cos(rad)*r), Math.floor(Math.sin(rad)*r)), ctx.lineTo(Math.floor(Math.cos(rad)*(Math.max(0.1, r+v*minDim*0.3*curSens))), Math.floor(Math.sin(rad)*(Math.max(0.1, r+v*minDim*0.3*curSens)))), ctx.stroke(); }
            } else if (p.vizType === 'shockwave') {
                for(let i=0; i<10; i++){ const r=(animTime*0.3+i*100)%1000; ctx.beginPath(); ctx.ellipse(0,0,Math.max(0.1, Math.floor(r)),Math.max(0.1, Math.floor(r*0.5)),0,0,Math.PI*2); ctx.globalAlpha=Math.max(0, (1-r/1000)); ctx.stroke(); }
            } else if (p.vizType === 'dna') {
                for(let i=0; i<40; i++){ const y=(i-20)*25, x=Math.sin(animTime*0.003+i*0.2)*150; ctx.beginPath(); ctx.arc(Math.floor(x),Math.floor(y),Math.max(0.1, Math.floor(5+vD[(i*5)%len]*20)),0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(Math.floor(-x),Math.floor(y),Math.max(0.1, Math.floor(5+vD[(i*5)%len]*20)),0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(Math.floor(x),Math.floor(y)); ctx.lineTo(Math.floor(-x),Math.floor(y)); ctx.stroke(); }
            } else if (p.vizType === 'fire') {
                if(fireRef.current.length<30) fireRef.current=Array.from({length:30},()=>({x:0, y:0, life:0, size:0}));
                for (let i = 0; i < fireRef.current.length; i++) { const f = fireRef.current[i]; if(f.life<=0){f.x=(Math.random()-0.5)*200; f.y=100; f.life=1;} if(p.isPlaying || p.rendering){f.y-=5+vD[i%len]*10; f.life-=0.02;} ctx.fillStyle=`rgba(255,${Math.floor(f.life*200)},0,${Math.max(0, f.life)})`; ctx.beginPath(); ctx.arc(Math.floor(f.x),Math.floor(f.y),Math.max(0.1, Math.floor(10*f.life)),0,Math.PI*2); ctx.fill(); }
            } else if (p.vizType === 'matrix' || p.vizType === 'digital_rain') {
                if(matrixDropsRef.current.length<30) matrixDropsRef.current=Array.from({length:30},()=>({x:(Math.random()-0.5)*width, y:(Math.random()-0.5)*height, speed:2+Math.random()*5, chars:["1","0"]}));
                ctx.font="12px monospace"; matrixDropsRef.current.forEach(d=>{ if(p.isPlaying || p.rendering)d.y+=d.speed; if(d.y>height/2) d.y=-height/2; ctx.fillText(d.chars[Math.floor(Math.random()*2)], Math.floor(d.x), Math.floor(d.y)); });
            } else if (p.vizType === 'neural_net') {
                if(neuralNetRef.current.length<20) neuralNetRef.current=Array.from({length:20},()=>({x:(Math.random()-0.5)*width, y:(Math.random()-0.5)*height, vx:Math.random()-0.5, vy:Math.random()-0.5}));
                for (let i = 0; i < neuralNetRef.current.length; i++) { const n = neuralNetRef.current[i]; if(p.isPlaying || p.rendering){n.x+=n.vx*(1+vD[i%len]*5); n.y+=n.vy*(1+vD[i%len]*5);} ctx.beginPath(); ctx.arc(Math.floor(n.x),Math.floor(n.y),5,0,Math.PI*2); ctx.fill(); neuralNetRef.current.forEach(n2=>{ if(Math.hypot(n.x-n2.x,n.y-n2.y)<200) ctx.beginPath(),ctx.moveTo(Math.floor(n.x),Math.floor(n.y)),ctx.lineTo(Math.floor(n2.x),Math.floor(n2.y)),ctx.stroke(); }); }
            } else if (p.vizType === 'swarm') {
                if(swarmRef.current.length<50) swarmRef.current=Array.from({length:50},()=>({x:0,y:0,vx:0,vy:0}));
                for (let i = 0; i < swarmRef.current.length; i++) { const s = swarmRef.current[i]; if(p.isPlaying || p.rendering){s.x+=(Math.random()-0.5)*10+s.vx; s.y+=(Math.random()-0.5)*10+s.vy; s.vx*=0.9; s.vy*=0.9; if(vD[i%len]>0.6){s.vx+=(Math.random()-0.5)*20; s.vy+=(Math.random()-0.5)*20;}} ctx.fillRect(Math.floor(s.x),Math.floor(s.y),4,4); }
            } else if (p.vizType === 'segmented_bar') {
                const bW=(width/len)*2; for(let i=0; i<len; i++) for(let j=0; j<vD[i]*15*curSens; j++) ctx.fillRect(Math.floor(-width/2+i*(bW+1)), Math.floor(-j*12*responsiveScale), Math.max(1, Math.floor(bW)), Math.floor(-10*responsiveScale));
            } else if (p.vizType === 'lightning') {
                ctx.beginPath(); ctx.moveTo(Math.floor(-width/2), 0); for(let i=0; i<len; i++) ctx.lineTo(Math.floor((i/len)*width-width/2), Math.floor(vD[i]*350*curSens*responsiveScale*(Math.random()>0.9?3:1))); ctx.stroke();
            } else if (p.vizType === 'glitch_vines') {
                if((p.isPlaying || p.rendering) && Math.random()<0.2 && vinesRef.current.length < 50) vinesRef.current.push({x:(Math.random()-0.5)*width, y:(Math.random()-0.5)*height, angle:Math.random()*Math.PI*2, length:0, color:lerpColor(p.barColor, vCE, Math.random())});
                for (let i = vinesRef.current.length - 1; i >= 0; i--) { const v = vinesRef.current[i]; const spd=5+avgVol*10; v.length+=spd; v.angle+=(Math.random()-0.5)*0.5; const nx=v.x+Math.cos(v.angle)*spd, ny=v.y+Math.sin(v.angle)*spd; ctx.beginPath(); ctx.moveTo(Math.floor(v.x), Math.floor(v.y)); ctx.lineTo(Math.floor(nx), Math.floor(ny)); ctx.stroke(); v.x=nx; v.y=ny; if(v.length>500) vinesRef.current.splice(i,1); }
            } else if (p.vizType === 'heartbeat') {
                ctx.scale(Math.max(0.1, 1.2+bass), Math.max(0.1, 1.2+bass)); ctx.beginPath(); ctx.moveTo(0,30); ctx.bezierCurveTo(0,0,-50,-50,-100,0); ctx.bezierCurveTo(-150,50,-50,150,0,200); ctx.bezierCurveTo(50,150,150,50,100,0); ctx.bezierCurveTo(50,-50,0,0,0,30); ctx.fill();
            } else if (p.vizType === 'cosmic_strings') {
                for(let i=0; i<8; i++){ ctx.beginPath(); for(let x=-width/2; x<width/2; x+=20) ctx.lineTo(Math.floor(x), Math.floor(Math.sin(x*0.002+animTime*0.002+i)*vD[(i*10)%len]*200*curSens)); ctx.stroke(); }
            } else if (p.vizType === 'seismic') {
                ctx.beginPath(); for(let i=0; i<len; i++) ctx.lineTo(Math.floor((i/len)*width-width/2), Math.floor(vD[i]*height*0.3*curSens+(Math.random()-0.5)*vD[i]*100)); ctx.stroke();
            } else if (p.vizType === 'ribbon') {
                for (let l = 0; l < 3; l++) { ctx.beginPath(); ctx.globalAlpha = Math.max(0, (1 - l/3) * (p.vizOpacity ?? 1.0)); for(let i=0; i<len; i++){ ctx.lineTo(Math.floor((i/len)*width-width/2), Math.floor(Math.sin(i*0.05+animTime*0.002+l)*100*responsiveScale+vD[i]*300*curSens*responsiveScale)); } ctx.stroke(); }
            } else if (p.vizType === 'spectrum_wave') {
                const bW=width/len; for(let i=0; i<len; i++) ctx.fillRect(Math.floor(-width/2+i*bW), Math.floor(Math.sin(animTime*0.003+i*0.08)*80*responsiveScale), Math.max(1, Math.floor(bW)), Math.floor(-vD[i]*height*0.5*curSens));
            } else if (p.vizType === 'radial_spectrum') {
                for(let i=0; i<120; i++){ const v=vD[Math.floor(i*(len/120))%len]; const rad=(Math.PI*2)*(i/120); ctx.beginPath(); ctx.moveTo(Math.floor(Math.cos(rad)*100), Math.floor(Math.sin(rad)*100)); ctx.lineTo(Math.floor(Math.cos(rad)*(Math.max(0.1, 100+v*400*curSens))), Math.floor(Math.sin(rad)*(Math.max(0.1, 100+v*400*curSens)))); ctx.stroke(); }
            } else if (p.vizType === 'audio_rings') {
                for(let i=0; i<15; i++){ ctx.beginPath(); ctx.arc(0,0,Math.max(0.1, Math.floor(minDim*0.1+i*40+vD[(i*5)%len]*100*curSens)),0,Math.PI*2); ctx.globalAlpha=Math.max(0, (1-i/15)); ctx.stroke(); }
            } else if (p.vizType === 'rings_cyber') {
                for(let i=0; i<8; i++){ ctx.beginPath(); ctx.arc(0,0,Math.max(0.1, Math.floor(100+i*50+vD[(i*5)%len]*50)), animTime*0.001*(i%2?1:-1), animTime*0.001*(i%2?1:-1)+Math.PI*(0.5+vD[(i*5)%len])); ctx.stroke(); }
            } else if (p.vizType === 'spiral') {
                ctx.beginPath(); for(let i=0; i<len; i++){ const rad=i*0.1+animTime*0.002, r=i*0.5+vD[i]*100*curSens; ctx.lineTo(Math.floor(Math.cos(rad)*r), Math.floor(Math.sin(rad)*r)); } ctx.stroke();
            } else if (p.vizType === 'orbitals') {
                for(let i=0; i<12; i++){ const rad=animTime*0.001+i*(Math.PI*2/12), r=200+vD[(i*10)%len]*100; ctx.beginPath(); ctx.arc(Math.floor(Math.cos(rad)*r), Math.floor(Math.sin(rad)*r), Math.max(0.1, Math.floor(10+vD[(i*10)%len]*40)), 0, Math.PI*2); ctx.fill(); }
            } else if (p.vizType === 'radar') {
                ctx.beginPath(); ctx.arc(0,0,Math.max(0.1, Math.floor(minDim*0.4)),0,Math.PI*2); ctx.stroke(); const ang=(animTime*0.002)%(Math.PI*2); ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,Math.max(0.1, Math.floor(minDim*0.4)), ang, ang+0.4); ctx.fill();
            } else if (p.vizType === 'mandala') {
                for(let i=0; i<12; i++){ ctx.save(); ctx.rotate(i*(Math.PI*2/12)+animTime*0.0001); ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(50, Math.floor(100+vD[(i*5)%len]*200), 0, Math.floor(200+vD[(i*5)%len]*200)); ctx.stroke(); ctx.restore(); }
            } else if (p.vizType === 'cubes_3d') {
                for(let i=0; i<len; i+=15){ const s=20+vD[i]*200; ctx.save(); ctx.translate(Math.floor((i/len)*width-width/2), Math.floor(Math.sin(animTime*0.002+i)*100)); ctx.rotate(animTime*0.001+i); ctx.strokeRect(Math.floor(-s/2),Math.floor(-s/2),Math.floor(s),Math.floor(s)); ctx.restore(); }
            } else if (p.vizType === 'sphere_3d') {
                for(let i=0; i<len; i+=10){ const rad=i*0.1+animTime*0.0005, r=200+vD[i]*200; ctx.beginPath(); ctx.arc(Math.floor(Math.cos(rad)*r), Math.floor(Math.sin(rad)*r), Math.max(0.1, Math.floor(5+vD[i]*10)), 0, Math.PI*2); ctx.fill(); }
            } else if (p.vizType === 'tunnel_3d') {
                for(let i=0; i<12; i++){ ctx.beginPath(); ctx.arc(0,0, Math.max(0.1, Math.floor((animTime*0.2+i*100)%800)), 0, Math.PI*2); ctx.lineWidth=Math.max(0.1, Math.floor(2+vD[(i*10)%len]*20)); ctx.stroke(); }
            } else if (p.vizType === 'neon_grid') {
                for(let x=-width/2; x<width/2; x+=100){ ctx.beginPath(); ctx.moveTo(Math.floor(x),Math.floor(-height/2)); ctx.lineTo(Math.floor(x),Math.floor(height/2)); ctx.lineWidth=Math.max(0.1, Math.floor(1+vD[Math.abs(Math.floor(x/10))%len]*5)); ctx.stroke(); }
                for(let y=-height/2; y<height/2; y+=100){ ctx.beginPath(); ctx.moveTo(Math.floor(-width/2),Math.floor(y)); ctx.lineTo(Math.floor(width/2),Math.floor(y)); ctx.lineWidth=Math.max(0.1, Math.floor(1+vD[Math.abs(Math.floor(y/10))%len]*5)); ctx.stroke(); }
            } else if (p.vizType === 'hexagon') {
                const s=60; for(let i=0; i<8; i++) for(let j=0; j<8; j++) { const v=vD[(i*8+j)%len]; ctx.beginPath(); for(let k=0; k<6; k++) ctx.lineTo(Math.floor((j-4)*s*1.5 + s*Math.max(0.1, (0.2+v))*Math.cos(k*Math.PI/3)), Math.floor((i-4)*s*1.7+(j%2?s*0.8:0) + s*Math.max(0.1, (0.2+v))*Math.sin(k*Math.PI/3))); ctx.closePath(); ctx.stroke(); }
            } else if (p.vizType === 'poly_world') {
                ctx.beginPath(); ctx.moveTo(Math.floor(-width/2), Math.floor(height/2)); for(let i=0; i<=10; i++) ctx.lineTo(Math.floor((i/10)*width-width/2), Math.floor(-vD[(i*10)%len]*400)); ctx.lineTo(Math.floor(width/2), Math.floor(height/2)); ctx.fill();
            } else if (p.vizType === 'pyramids') {
                for(let i=0; i<8; i++) { const x=Math.floor((i/8)*width-width/2+50), h=Math.floor(vD[(i*10)%len]*400); ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+50,-h); ctx.lineTo(x+100,0); ctx.closePath(); ctx.stroke(); }
            } else if (p.vizType === 'crystal') {
                for(let i=0; i<6; i++){ ctx.save(); ctx.rotate(i*Math.PI/3); const l=Math.floor(100+vD[(i*10)%len]*200); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(30,l); ctx.lineTo(0,l+30); ctx.lineTo(-30,l); ctx.closePath(); ctx.stroke(); ctx.restore(); }
            } else if (p.vizType === 'starfield') {
                for(let i=0; i<100; i++){ const ang=i*137.5, d=(i*5+animTime*0.1)%width; ctx.fillRect(Math.floor(Math.cos(ang)*d), Math.floor(Math.sin(ang)*d), Math.max(1, Math.floor(2+vD[i%len]*10)), Math.max(1, Math.floor(2+vD[i%len]*10))); }
            } else if (p.vizType === 'particles') {
                for(let i=0; i<100; i++){ const ang=i*2.4+animTime*0.0005; ctx.beginPath(); ctx.arc(Math.floor(Math.sin(ang)*width*0.4), Math.floor(Math.cos(ang*0.8)*height*0.4), Math.max(0.1, Math.floor(2+vD[i%len]*30)), 0, Math.PI*2); ctx.fill(); }
            } else if (p.vizType === 'gravity_well') {
                for(let i=0; i<100; i++){ const ang=i*0.1, r=300+Math.sin(animTime*0.001+i)*50; ctx.beginPath(); ctx.moveTo(Math.floor(Math.cos(ang)*r), Math.floor(Math.sin(ang)*r)); ctx.lineTo(Math.floor(Math.cos(ang)*(Math.max(0.1, r-vD[i%len]*200))), Math.floor(Math.sin(ang)*(Math.max(0.1, r-vD[i%len]*200)))); ctx.stroke(); }
            } else if (p.vizType === 'star_burst') {
                if((p.isPlaying || p.rendering) && Math.random()<0.3 && starBurstRef.current.length < 200) for(let i=0; i<5; i++) starBurstRef.current.push({x:0, y:0, vx:(Math.random()-0.5)*20, vy:(Math.random()-0.5)*20, life:1, size:Math.max(0.1, 2+Math.random()*5)});
                for (let i = starBurstRef.current.length - 1; i >= 0; i--) { const s = starBurstRef.current[i]; if(p.isPlaying || p.rendering) {s.x+=s.vx; s.y+=s.vy; s.life-=0.02;} ctx.globalAlpha=Math.max(0, s.life); ctx.fillRect(Math.floor(s.x),Math.floor(s.y),Math.max(1, Math.floor(s.size)),Math.max(1, Math.floor(s.size))); if(s.life<=0) starBurstRef.current.splice(i,1); }
            } else if (p.vizType === 'vortex') {
                for(let i=0; i<len; i+=10){ const rad=i*0.1+animTime*0.003, r=i*0.5*(1+bass); ctx.fillRect(Math.floor(Math.cos(rad)*r), Math.floor(Math.sin(rad)*r), 4, 4); }
            } else if (p.vizType === 'vector_field') {
                for(let x=-width/2; x<width/2; x+=50) for(let y=-height/2; y<height/2; y+=50) { const d=Math.hypot(x,y); ctx.save(); ctx.translate(Math.floor(x),Math.floor(y)); ctx.rotate(Math.atan2(y,x)+vD[Math.floor(d/20)%len]*Math.PI); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(20,0); ctx.stroke(); ctx.restore(); }
            } else if (p.vizType === 'lava' || p.vizType === 'floating_orbs' || p.vizType === 'abstract_clouds') {
                for(let i=0; i<15; i++){ const x=Math.sin(animTime*0.0005+i)*width*0.4, y=Math.cos(animTime*0.0004+i*1.5)*height*0.4, r=Math.max(0.1, Math.floor(50+vD[(i*5)%len]*150)); ctx.beginPath(); ctx.arc(Math.floor(x),Math.floor(y),Math.floor(r),0,Math.PI*2); ctx.fill(); if(p.vizType!=='lava') ctx.stroke(); }
            } else if (p.vizType === 'plasma') {
                for(let i=0; i<8; i++){ const r=Math.max(0.1, Math.floor(150+vD[(i*20)%len]*200)), x=Math.cos(animTime*0.001+i)*r, y=Math.sin(animTime*0.001+i)*r; ctx.beginPath(); ctx.arc(Math.floor(x),Math.floor(y),Math.floor(r),0,Math.PI*2); ctx.fill(); }
            } else if (p.vizType === 'fractal_tree') {
                const drawT=(l: number, a: number, d: number)=>{ if(d>8)return; const nl=l*(0.7+vD[(d*10)%len]*0.2); ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,Math.floor(-l)); ctx.stroke(); ctx.translate(0,Math.floor(-l)); drawT(nl,0.5,d+1); drawT(nl,-0.5,d+1); ctx.restore(); }; drawT(150,0,0);
            } else if (p.vizType === 'liquid_flow' || p.vizType === 'aurora') {
                ctx.beginPath(); ctx.moveTo(Math.floor(-width/2), Math.floor(height/2)); for(let i=0; i<20; i++) ctx.quadraticCurveTo(Math.floor((i/20)*width-width/2), Math.floor(-vD[(i*5)%len]*400), Math.floor(((i+1)/20)*width-width/2), Math.floor(-vD[(i*5)%len]*400)); ctx.lineTo(Math.floor(width/2), Math.floor(height/2)); ctx.fill();
            } else if (p.vizType === 'deep_sea') {
                for(let i=0; i<5; i++){ ctx.beginPath(); ctx.moveTo(Math.floor(-width/2), Math.floor(i*100)); for(let x=-width/2; x<width/2; x+=20) ctx.lineTo(Math.floor(x), Math.floor(i*100+Math.sin(x*0.005+animTime*0.002)*vD[(i*20)%len]*100)); ctx.stroke(); }
            } else if (p.vizType === 'solar_flare') {
                for(let i=0; i<20; i++){ const ang=i*Math.PI/10, r=100+vD[i%len]*200; ctx.beginPath(); ctx.arc(Math.floor(Math.cos(ang)*r), Math.floor(Math.sin(ang)*r), Math.max(0.1, Math.floor(vD[i%len]*50)), 0, Math.PI*2); ctx.fill(); }
            } else if (p.vizType === 'kaleido_mesh') {
                for(let i=0; i<8; i++){ ctx.save(); ctx.rotate(i*Math.PI/4); ctx.beginPath(); for(let j=0; j<10; j++) ctx.lineTo(Math.floor(j*50), Math.floor(Math.sin(animTime*0.002+j)*vD[j%len]*100)); ctx.stroke(); ctx.restore(); }
            } else if (p.vizType === 'techno_wires') {
                const pts=Array.from({length:10},(_,i)=>({x:Math.cos(i)*200, y:Math.sin(i)*200, v:vD[i%len]}));
                pts.forEach((pt)=>{ ctx.beginPath(); ctx.arc(Math.floor(pt.x),Math.floor(pt.y),Math.max(0.1, Math.floor(5+pt.v*10)),0,Math.PI*2); ctx.fill(); pts.forEach(p2=>{ if(Math.hypot(pt.x-p2.x,p2.y-pt.y)<300) ctx.beginPath(),ctx.moveTo(Math.floor(pt.x),Math.floor(pt.y)),ctx.lineTo(Math.floor(p2.x),Math.floor(p2.y)),ctx.stroke(); }); });
            } else {
                const bW = (width / len) * 2; for (let i = 0; i < len; i++) ctx.fillRect(Math.floor(-width/2 + i*bW), 0, Math.max(1, Math.floor(bW-1)), Math.floor(-vD[i] * height * 0.4 * curSens));
            }
          };
          drawViz();
          if (p.mirrorX) { ctx.save(); ctx.scale(-1,1); drawViz(); ctx.restore(); }
          if (p.mirrorY) { ctx.save(); ctx.scale(1,-1); drawViz(); ctx.restore(); }
          ctx.restore();
        }

        // --- Typography ---
        ctx.save();
        const rV = (isNaN(avgVol) ? 0 : avgVol) * (p.textSensitivity ?? 1.0); let bS = 1.0;
        if (p.textReact === 'pulse') bS = 1.0 + (rV * 0.5);
        const margin = ((p.textMargin ?? 5) / 100) * width;
        const baseSize = 80 * responsiveScale * (p.fontSizeScale ?? 1.0) * bS;
        ctx.font = `bold ${Math.floor(baseSize)}px "${p.fontFamily}", sans-serif`;
        ctx.fillStyle = p.textColor; 
        
        if (p.textGlow) {
          ctx.shadowColor = p.textColor;
          ctx.shadowBlur = 15 * responsiveScale;
        }

        let tx = width / 2, ty = height / 2;
        let align: CanvasTextAlign = 'center';

        if (p.textPosition.includes('top')) ty = margin + baseSize;
        else if (p.textPosition.includes('bottom')) ty = height - margin - (baseSize * 0.5);
        
        if (p.textPosition.includes('left')) { tx = margin; align = 'left'; }
        else if (p.textPosition.includes('right')) { tx = width - margin; align = 'right'; }
        
        tx += (p.textOffsetX ?? 0) * (width / 100);
        ty += (p.textOffsetY ?? 0) * (height / 100);

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

        // FX
        if (p.vignette) { const vg = ctx.createRadialGradient(width/2, height/2, width/3, width/2, height/2, width*0.9); vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.8)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, width, height); }
        if (p.scanlines) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let i = 0; i < height; i += 4) ctx.fillRect(0, i, width, 1); }

        // --- 6. FADES ---
        if (audioElement?.duration) {
          const ct = audioElement.currentTime;
          const du = audioElement.duration;
          let a = 1.0;
          let ft = 'none';
          
          if (ct < (p.fadeInDuration ?? 2)) {
            ft = p.fadeInType ?? 'none';
            a = ct / (p.fadeInDuration ?? 2);
          } else if (ct > du - (p.fadeOutDuration ?? 2)) {
            ft = p.fadeOutType ?? 'none';
            a = (du - ct) / (p.fadeOutDuration ?? 2);
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
      if (p.rendering) setTimeout(nextFrame, 16); else nextFrame();
    };
    animationRef.current = requestAnimationFrame(render);
    return () => { if (animationRef.current !== undefined) { cancelAnimationFrame(animationRef.current); animationRef.current = undefined; } };
  }, [analyser, bgType, resolution, w, h]);

  return (
    <div className="visualizer-container" style={{ aspectRatio: `${w}/${h}`, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
    </div>
  );
});