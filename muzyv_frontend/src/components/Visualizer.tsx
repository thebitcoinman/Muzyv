import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  bgUrl: string | null;
  bgType: 'image' | 'video' | 'none';
  bgZoom?: number;
  bgOffsetX?: number;
  bgOffsetY?: number;
  bgRotation?: number;
  vizType: string;
  barColor: string;
  barColorEnd?: string;
  useGradient?: boolean;
  textColor: string;
  title: string;
  artist: string;
  resolution: string; 
  textPosition: string; 
  fontFamily: string;
  fontSizeScale?: number;
  textMargin?: number;
  sensitivity: number; 
  smartSensitivity: boolean;
  vizScale: number;
  vizRotation: number;
  vizOffsetX?: number;
  vizOffsetY?: number;
  vizMirror?: string;
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
  onProcessingChange?: (isProcessing: boolean) => void;
  fadeInType?: string;
  fadeInDuration?: number;
  fadeOutType?: string;
  fadeOutDuration?: number;
  audioElement: HTMLAudioElement | null;
}

export const Visualizer = forwardRef<HTMLCanvasElement, VisualizerProps>((props, ref) => {
  const {
    analyser, bgUrl, bgType, resolution, isPlaying, onProcessingChange, audioElement
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const yoyoFramesRef = useRef<ImageBitmap[]>([]);
  const frozenTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const smoothDataRef = useRef<Float32Array | null>(null);
  const captureFpsRef = useRef<number>(30);
  const volumeHistoryRef = useRef<number[]>([]);
  
  const pixelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const kaleidoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Persistent State for Complex Visualizers
  const matrixDropsRef = useRef<{x: number, y: number, speed: number, chars: string[]}[]>([]);
  const liquidPointsRef = useRef<{x: number, y: number, vx: number, vy: number}[]>([]);
  const vinesRef = useRef<{x: number, y: number, angle: number, length: number, color: string}[]>([]);
  const starBurstRef = useRef<{x: number, y: number, vx: number, vy: number, life: number, size: number}[]>([]);
  const cityBarsRef = useRef<{x: number, h: number, targetH: number, color: string}[]>([]);
  const neuralNetRef = useRef<{x: number, y: number, vx: number, vy: number}[]>([]);
  const swarmRef = useRef<{x: number, y: number, vx: number, vy: number}[]>([]);
  const fireRef = useRef<{x: number, y: number, life: number, size: number}[]>([]);

  const propsRef = useRef(props);
  useEffect(() => { propsRef.current = props; }, [props]);

  const [w, h] = resolution.split('x').map(Number);

  useImperativeHandle(ref, () => canvasRef.current!, []);

  const clearYoyoFrames = () => {
    yoyoFramesRef.current.forEach(b => { try { b.close(); } catch(e) {} });
    yoyoFramesRef.current = [];
  };

  useEffect(() => {
    if (!props.yoyoMode || bgType !== 'video' || !bgUrl) { onProcessingChange?.(false); clearYoyoFrames(); return; }
    const vid = document.createElement('video'); vid.src = bgUrl; vid.muted = true;
    bgVideoRef.current = vid;
    const processFrames = async () => {
      onProcessingChange?.(true); clearYoyoFrames(); vid.pause(); vid.currentTime = 0;
      const safetyTimeout = setTimeout(() => onProcessingChange?.(false), 15000);
      try {
        await new Promise<void>((resolve, reject) => {
          const onLoaded = () => { vid.removeEventListener('loadedmetadata', onLoaded); resolve(); };
          if (vid.readyState >= 1) resolve(); else { vid.addEventListener('loadedmetadata', onLoaded); vid.addEventListener('error', reject); }
        });
        if (!Number.isFinite(vid.duration)) { onProcessingChange?.(false); clearTimeout(safetyTimeout); return; }
        await vid.play();
        const captureFrame = async () => {
          if (!vid || vid.ended || vid.currentTime >= vid.duration - 0.1 || yoyoFramesRef.current.length > 200) { 
            clearTimeout(safetyTimeout);
            if (yoyoFramesRef.current.length > 0 && vid.currentTime > 0) captureFpsRef.current = yoyoFramesRef.current.length / vid.currentTime;
            onProcessingChange?.(false); return; 
          }
          try {
            const bitmap = await createImageBitmap(vid, { resizeWidth: Math.min(w || 1920, 960), resizeHeight: Math.min(h || 1080, 540) });
            yoyoFramesRef.current.push(bitmap);
          } catch (e) { console.warn(e); }
          if (vid.paused && !vid.ended) vid.play().catch(() => {});
          if ('requestVideoFrameCallback' in vid) (vid as any).requestVideoFrameCallback(captureFrame);
          else requestAnimationFrame(captureFrame);
        };
        if ('requestVideoFrameCallback' in vid) (vid as any).requestVideoFrameCallback(captureFrame);
        else requestAnimationFrame(captureFrame);
      } catch (e) { console.error(e); clearTimeout(safetyTimeout); onProcessingChange?.(false); }
    };
    processFrames();
    return () => { clearYoyoFrames(); };
  }, [bgUrl, bgType, props.yoyoMode, resolution, w, h, onProcessingChange]);

  const bgImageRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!bgUrl) { bgImageRef.current = null; return; }
    if (bgType === 'image') { const img = new Image(); img.src = bgUrl; bgImageRef.current = img; }
    else if (bgType === 'video' && !props.yoyoMode) {
        const vid = document.createElement('video'); vid.src = bgUrl; vid.loop = true; vid.muted = true;
        bgVideoRef.current = vid;
    }
  }, [bgUrl, bgType, props.yoyoMode]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false }); if (!ctx) return;
    canvas.width = w || 1920; canvas.height = h || 1080;

    let dataArray: Uint8Array;
    if (analyser) dataArray = new Uint8Array(analyser.frequencyBinCount);

    const render = () => {
      const p = propsRef.current;
      const width = canvas.width; const height = canvas.height;
      const minDim = Math.min(width, height);
      const responsiveScale = minDim / 1000;

      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      if (p.isPlaying) frozenTimeRef.current += delta;
      const animTime = frozenTimeRef.current;

      ctx.imageSmoothingEnabled = !p.pixelate;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);

      // --- 1. Background ---
      const drawBG = (src: CanvasImageSource, opacity = 1.0) => {
          let iw = 0; let ih = 0;
          if (src instanceof HTMLVideoElement) { iw = src.videoWidth; ih = src.videoHeight; }
          else if (src instanceof HTMLImageElement || src instanceof ImageBitmap) { iw = src.width; ih = src.height; }
          if (!iw || !ih) return;
          const r = Math.max(width / iw, height / ih) * (p.bgZoom || 1.0);
          const nw = iw * r; const nh = ih * r;
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.translate(width * ((p.bgOffsetX ?? 50) / 100), height * ((p.bgOffsetY ?? 50) / 100));
          if (p.bgRotation) ctx.rotate((p.bgRotation * Math.PI) / 180);
          ctx.drawImage(src, -nw / 2, -nh / 2, nw, nh);
          ctx.restore();
      };

      if (bgType === 'image' && bgImageRef.current?.complete) drawBG(bgImageRef.current);
      else if (bgType === 'video') {
         if (p.yoyoMode && yoyoFramesRef.current.length > 0) {
            const frames = yoyoFramesRef.current;
            const cycleLen = Math.max(1, (frames.length * 2) - 2);
            const totalFramesElapsed = (animTime / 1000) * (captureFpsRef.current || 30);
            const cycleIndex = totalFramesElapsed % cycleLen;
            const idxFloat = cycleIndex < frames.length ? cycleIndex : cycleLen - cycleIndex;
            const idx1 = Math.floor(idxFloat); const idx2 = Math.ceil(idxFloat) % frames.length; const frac = idxFloat - idx1;
            if (frames[idx1]) drawBG(frames[idx1]);
            if (frac > 0.05 && frames[idx2]) drawBG(frames[idx2], frac);
         } else if (bgVideoRef.current && bgVideoRef.current.readyState >= 2) {
             if (p.isPlaying && bgVideoRef.current.paused) bgVideoRef.current.play().catch(()=>{});
             else if (!p.isPlaying && !bgVideoRef.current.paused) bgVideoRef.current.pause();
             drawBG(bgVideoRef.current);
         }
      }

      // --- 2. Audio Analysis ---
      let curSens = p.sensitivity; let avgVol = 0; let bass = 0; let mid = 0; let treble = 0;
      if (analyser && dataArray) {
        if (p.vizType.includes('wave') && !p.vizType.includes('shockwave') && !p.vizType.includes('ribbon')) analyser.getByteTimeDomainData(dataArray as any); 
        else analyser.getByteFrequencyData(dataArray as any);
        let start = Math.floor((p.lowCut / 100) * dataArray.length);
        let end = Math.floor((p.highCut / 100) * dataArray.length);
        if (p.smartCut) { start = Math.floor(0.01 * dataArray.length); end = Math.floor(0.6 * dataArray.length); }
        const rawData = dataArray.slice(start, end);
        if (!smoothDataRef.current || smoothDataRef.current.length !== rawData.length) smoothDataRef.current = new Float32Array(rawData.length);
        const bEnd = Math.floor(rawData.length * 0.15); const mEnd = Math.floor(rawData.length * 0.5);
        let bS = 0, mS = 0, tS = 0;
        for (let i = 0; i < rawData.length; i++) {
            const val = (p.vizType.includes('spectrum') || p.vizType.includes('bar') || p.vizType.includes('city') || p.vizType.includes('block') || p.vizType.includes('ring') || p.vizType.includes('circle') || p.vizType.includes('pulse') || p.vizType.includes('star') || p.vizType.includes('lava') || p.vizType.includes('orb') || p.vizType.includes('3d') || p.vizType.includes('grid') || p.vizType.includes('shockwave') || p.vizType.includes('dna') || p.vizType.includes('matrix') || p.vizType.includes('fire') || p.vizType.includes('mandala') || p.vizType.includes('radar') || p.vizType.includes('pyramid') || p.vizType.includes('crystal') || p.vizType.includes('swarm') || p.vizType.includes('seismic')) 
              ? rawData[i] / 255.0 : (rawData[i] - 128) / 128.0;
            if (p.isPlaying) smoothDataRef.current[i] += (val - smoothDataRef.current[i]) * 0.25;
            const sv = Math.abs(smoothDataRef.current[i]);
            if (i < bEnd) bS += sv; else if (i < mEnd) mS += sv; else tS += sv;
        }
        bass = (bS / (bEnd || 1)) * curSens; mid = (mS / ((mEnd - bEnd) || 1)) * curSens; treble = (tS / ((rawData.length - mEnd) || 1)) * curSens;
        avgVol = (bass + mid + treble) / 3;
        if (p.smartSensitivity) {
          volumeHistoryRef.current.push(isNaN(avgVol) ? 0 : avgVol); if (volumeHistoryRef.current.length > 60) volumeHistoryRef.current.shift();
          const avgRms = volumeHistoryRef.current.reduce((a, b) => a + b, 0) / volumeHistoryRef.current.length;
          if (avgRms > 0.001) curSens *= Math.min(Math.max(0.2 / (avgRms/curSens), 0.5), 3.0);
        }
      }

      // --- 3. Visualizer Layer ---
      ctx.save();
      ctx.globalAlpha = p.vizOpacity;
      ctx.translate((p.vizOffsetX / 100) * width, (p.vizOffsetY / 100) * height);
      if(p.vizMirror==='x'||p.vizMirror==='xy') ctx.scale(-1,1); if(p.vizMirror==='y'||p.vizMirror==='xy') ctx.scale(1,-1);
      ctx.rotate((p.vizRotation * Math.PI) / 180 + (p.autoRotate ? animTime * 0.0005 : 0)); 
      ctx.scale(p.vizScale, p.vizScale);

      let fs: string | CanvasGradient = p.barColor;
      if(p.useGradient) { const g=ctx.createLinearGradient(0, height/2, 0, -height/2); g.addColorStop(0,p.barColor); g.addColorStop(1,p.barColorEnd || '#8b5cf6'); fs=g; }
      ctx.fillStyle = fs; ctx.strokeStyle = fs; ctx.lineWidth = p.vizThickness * responsiveScale; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      if (analyser && smoothDataRef.current) {
        const vD = smoothDataRef.current; const len = vD.length;
        // === CLASSIC & BARS ===
        if (p.vizType === 'spectrum' || p.vizType === 'mirror_spectrum') {
            const mirrored = p.vizType === 'mirror_spectrum'; const bW = (width / len) * (mirrored ? 4 : 2); const maxH = height * 0.5 * curSens;
            for (let i = 0; i < len; i++) { const vx = -width/2 + i*(bW+1); ctx.fillRect(vx, 0, bW, -vD[i] * maxH); if(mirrored) ctx.fillRect(vx, 0, bW, vD[i] * maxH); }
        } else if (p.vizType === 'led_wall') {
            const rows = 20; const cols = 30; const boxW = width / cols; const boxH = height / rows;
            for (let i = 0; i < cols; i++) { const v = vD[Math.floor(i * (len/cols))]; const activeRows = Math.floor(v * rows * curSens);
                for (let j = 0; j < activeRows; j++) { ctx.globalAlpha = 0.8 * p.vizOpacity; ctx.fillRect(i * boxW - width/2, height/2 - j * boxH - boxH, boxW - 2, boxH - 2); }
            }
        } else if (p.vizType === 'segmented_bar') {
            const bW = (width / len) * 2;
            for (let i = 0; i < len; i++) { const v = vD[i]; const segs = Math.floor(v * 20 * curSens);
                for (let j = 0; j < segs; j++) { ctx.fillRect(-width/2 + i * (bW+1), -j * 10 * responsiveScale, bW, -8 * responsiveScale); }
            }
        } else if (p.vizType === 'bar_rain') {
            const count = 40; const bW = (width / count) * 0.8;
            for(let i=0; i<count; i++) { const v = vD[Math.floor(i * (len/count)) % len]; const x = (i/count) * width - width/2; const hV = v * height * curSens * (1 + (i < count/2 ? bass : mid) * 0.5);
                ctx.fillRect(x, -height/2, bW, hV); ctx.fillStyle = '#fff'; ctx.fillRect(x, -height/2 + hV - 4, bW, 4); ctx.fillStyle = fs;
            }
        } else if (p.vizType === 'cyber_city') {
            const count = 50; const bW = (width / count) * 0.85; if (cityBarsRef.current.length !== count) cityBarsRef.current = Array.from({length: count}, () => ({ x: 0, h: 0, targetH: 0, color: '' }));
            for(let i=0; i<count; i++) { const hV = vD[Math.floor(i * (len/count)) % len] * height * 0.9 * curSens * (1 + (i % 3 === 0 ? bass : mid) * 0.2); const bar = cityBarsRef.current[i]; bar.h += (hV - bar.h) * 0.15; ctx.fillRect((i/count)*width - width/2, 0, bW, -bar.h);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + treble * 0.8})`; for(let j=20*responsiveScale; j<bar.h - 10; j+=40*responsiveScale) { if ((i+j) % 3 === 0) ctx.fillRect((i/count)*width - width/2 + 4, -j, bW/4, 8); if ((i+j) % 4 === 0) ctx.fillRect((i/count)*width - width/2 + bW - 10, -j - 15, bW/4, 8); } ctx.fillStyle = fs;
            }
        } else if (p.vizType === 'pixel_blocks') {
            const size = 50 * responsiveScale; const rows = Math.floor(height / size / 1.5); const cols = Math.floor(width / size);
            for(let i=0; i<cols; i++) { const hBlocks = Math.floor(vD[Math.floor(i * (len/cols)) % len] * rows * curSens * (1 + bass * 0.3));
                for(let j=0; j<hBlocks; j++) { ctx.globalAlpha = (1 - j/rows) * p.vizOpacity; ctx.fillRect((i - cols/2) * size, -j * size, size - 4, size - 4); }
            } ctx.globalAlpha = p.vizOpacity;
        } else if (p.vizType === 'digital_rain') {
            ctx.font = `${12 * responsiveScale}px monospace`; for(let i=0; i<50; i++) { const v = vD[Math.floor(i * (len/50)) % len]; const x = (i/50) * width - width/2; for(let j=0; j<10; j++) { const y = ((animTime * 0.1 + i * 100 + j * 20) % height) - height/2; ctx.globalAlpha = (1 - j/10) * p.vizOpacity * v; ctx.fillText(Math.random() > 0.5 ? "1" : "0", x, y); } } ctx.globalAlpha = p.vizOpacity;
        } 
        
        // === WAVEFORMS ===
        else if (p.vizType === 'wave') {
            const mH = height * 0.4 * curSens; ctx.beginPath(); const sW=width/len; let wx=-width/2;
            for(let i=0; i<len; i++){ const vy=vD[i]*mH; if(i===0)ctx.moveTo(wx,vy); else ctx.lineTo(wx,vy); wx+=sW; } ctx.stroke();
        } else if (p.vizType === 'dual_wave') {
            const mH = height * 0.4 * curSens; const sW = width / len;
            ctx.beginPath(); let wx = -width/2; for(let i=0; i<len; i++){ const vy = vD[i] * mH; if(i===0)ctx.moveTo(wx,vy); else ctx.lineTo(wx,vy); wx += sW; } ctx.stroke();
            ctx.beginPath(); wx = -width/2; for(let i=0; i<len; i++){ const vy = -vD[i] * mH; if(i===0)ctx.moveTo(wx,vy); else ctx.lineTo(wx,vy); wx += sW; } ctx.stroke();
        } else if (p.vizType === 'ribbon') {
            for (let l = 0; l < 3; l++) { ctx.beginPath(); ctx.globalAlpha = (1 - l/3) * p.vizOpacity;
                for(let i=0; i<len; i++){ const x = (i/len) * width - width/2; const y = Math.sin(i * 0.05 + animTime * 0.002 + l) * 100 * responsiveScale + vD[i] * 300 * curSens * responsiveScale; if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
                ctx.stroke();
            }
        } else if (p.vizType === 'spectrum_wave') {
            const bW = width / len; for(let i=0; i<len; i++) { const hV = vD[i] * height * 0.5 * curSens; const off = Math.sin(animTime * 0.003 + i * 0.08) * 80 * responsiveScale; ctx.fillRect(-width/2 + i * bW, off, bW, -hV); }
        } else if (p.vizType === 'lightning') {
            ctx.beginPath(); ctx.moveTo(-width/2, 0); for(let i=0; i<len; i++) { const x = (i/len) * width - width/2; const y = vD[i] * 350 * curSens * responsiveScale * (Math.random() > 0.9 ? 2.5 : 1); ctx.lineTo(x, y); } ctx.stroke();
        } else if (p.vizType === 'glitch_vines') {
            if (vinesRef.current.length < 60 && p.isPlaying && Math.random() < 0.15) vinesRef.current.push({ x: (Math.random() - 0.5) * width, y: (Math.random() - 0.5) * height, angle: Math.random() * Math.PI * 2, length: 0, color: `hsl(${(animTime * 0.05 + Math.random() * 60) % 360}, 80%, 60%)` });
            for (let i = vinesRef.current.length - 1; i >= 0; i--) { const vine = vinesRef.current[i]; const spd = (2 + avgVol * 15) * (p.isPlaying ? 1 : 0); vine.length += spd; vine.angle += (Math.random() - 0.5) * 0.6; const nx = vine.x + Math.cos(vine.angle) * spd; const ny = vine.y + Math.sin(vine.angle) * spd;
                ctx.beginPath(); ctx.moveTo(vine.x, vine.y); ctx.lineTo(nx, ny); ctx.strokeStyle = p.useGradient ? fs : vine.color; ctx.lineWidth = (1 + avgVol * 8) * responsiveScale; ctx.stroke(); vine.x = nx; vine.y = ny; if (vine.length > 600 || Math.abs(vine.x) > width/2 || Math.abs(vine.y) > height/2) vinesRef.current.splice(i, 1);
            } ctx.strokeStyle = fs;
        } else if (p.vizType === 'heartbeat') {
            const s = (1.2 + (bass * 1.5 + mid * 0.5) * 0.6) * responsiveScale; ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, 30); ctx.bezierCurveTo(0, 0, -50, -50, -100, 0); ctx.bezierCurveTo(-150, 50, -50, 150, 0, 200); ctx.bezierCurveTo(50, 150, 150, 50, 100, 0); ctx.bezierCurveTo(50, -50, 0, 0, 0, 30); ctx.fill();
        } else if (p.vizType === 'cosmic_strings') {
            for(let i=0; i<8; i++) { const v = vD[Math.floor(i * (len/8)) % len]; ctx.beginPath(); ctx.moveTo(-width/2, 0); ctx.lineWidth = (1 + v * 12 + bass * 5) * responsiveScale; for(let x=-width/2; x<width/2; x+=60) ctx.quadraticCurveTo(x, Math.sin(x * 0.0015 + animTime * 0.0015 + i) * 250 * v * curSens * responsiveScale, x + 30, Math.sin(x * 0.0015 + animTime * 0.0015 + i) * 250 * v * curSens * responsiveScale); ctx.stroke(); }
        } else if (p.vizType === 'seismic') {
            ctx.beginPath(); let wx = -width/2;
            for(let i=0; i<len; i++){ 
                const noise = (Math.random() - 0.5) * vD[i] * 50 * curSens;
                const vy = vD[i] * height * 0.3 * curSens + noise; 
                if(i===0)ctx.moveTo(wx,vy); else ctx.lineTo(wx,vy); wx += width/len; 
            } ctx.stroke();
        }

        // === CIRCULAR ===
        else if (p.vizType === 'circle' || p.vizType === 'ring' || p.vizType === 'pulse') {
          const r = minDim * (p.vizType === 'pulse' ? 0.15 + bass * 0.3 : 0.25); const mBH = (minDim * 0.3) * curSens; const segs = 180;
          for (let i = 0; i < segs; i++) { const v = vD[Math.floor(i * (len/segs)) % len]; const rad = (Math.PI * 2) * (i / segs); const x1 = Math.cos(rad) * r; const y1 = Math.sin(rad) * r; const x2 = Math.cos(rad) * (r + v * mBH); const y2 = Math.sin(rad) * (r + v * mBH);
            if (p.vizType === 'ring') { ctx.beginPath(); ctx.arc(x2, y2, (2 + v * 10) * responsiveScale, 0, Math.PI * 2); ctx.fill(); }
            else { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
          }
        } else if (p.vizType === 'radial_spectrum') {
            const innerR = 120 * responsiveScale * (1 + bass * 0.2); const outerR = 380 * responsiveScale * curSens; const segs = 180;
            for(let i=0; i<segs; i++) { const v = vD[Math.floor(i * (len/segs)) % len]; const ang = (i/segs) * Math.PI * 2 + animTime * 0.0002;
                const x1 = Math.cos(ang) * innerR; const y1 = Math.sin(ang) * innerR; const x2 = Math.cos(ang) * (innerR + v * outerR); const y2 = Math.sin(ang) * (innerR + v * outerR);
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
                if (i % 12 === 0) { ctx.beginPath(); ctx.arc(0, 0, innerR + v * outerR, ang, ang + 0.15); ctx.lineWidth = (1 + treble * 5) * responsiveScale; ctx.stroke(); }
            }
        } else if (p.vizType === 'audio_rings') {
            const count = 15; for(let i=0; i<count; i++) { const v = vD[Math.floor(i * (len/count)) % len]; const r = (minDim * 0.05 + i * 50 * responsiveScale + v * 150 * curSens * responsiveScale) * (1 + bass * 0.1);
                ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.globalAlpha = (1 - i/count) * p.vizOpacity; ctx.lineWidth = (1 + v * 15 + (i < 5 ? bass : mid) * 10) * responsiveScale; ctx.stroke();
            } ctx.globalAlpha = p.vizOpacity;
        } else if (p.vizType === 'rings_cyber') {
            const count = 8; for(let i=0; i<count; i++) { const v = vD[Math.floor(i * (len/count)) % len]; const r = (120 + i * 60 + v * 80 * curSens) * responsiveScale * (1 + bass * 0.2);
                const start = animTime * 0.001 * (i % 2 === 0 ? 1 : -1) + i; ctx.beginPath(); ctx.arc(0, 0, r, start, start + Math.PI * 0.5 + v * Math.PI); ctx.lineWidth = (2 + v * 15 * curSens) * responsiveScale; ctx.stroke();
            }
        } else if (p.vizType === 'spiral') {
            ctx.beginPath(); for(let i=0; i<len; i++) { const r = (i * 0.6 + vD[i] * 100 * curSens) * responsiveScale * (1 + bass * 0.1); const ang = i * 0.12 + animTime * 0.002;
                const x = Math.cos(ang) * r; const y = Math.sin(ang) * r; if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
        } else if (p.vizType === 'orbitals') {
            const count = 16; for(let i=0; i<count; i++) { const v = vD[Math.floor(i * (len/count)) % len]; const ang = animTime * 0.0015 + (i * Math.PI * 2 / count); const r = (220 + Math.sin(animTime*0.001 + i) * 120 + v * 100) * responsiveScale;
                const ox = Math.cos(ang) * r; const oy = Math.sin(ang) * r; ctx.beginPath(); ctx.arc(ox, oy, (8 + v * 45 * curSens) * responsiveScale, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(ox, oy); ctx.globalAlpha = (0.1 + v * 0.4) * p.vizOpacity; ctx.stroke(); ctx.globalAlpha = p.vizOpacity;
            }
        } else if (p.vizType === 'radar') {
            const r = minDim * 0.4; ctx.beginPath(); ctx.arc(0,0, r, 0, Math.PI*2); ctx.stroke();
            const ang = (animTime * 0.001) % (Math.PI * 2);
            ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0, r, ang, ang + 0.5); ctx.lineTo(0,0); 
            ctx.fillStyle = fs; ctx.globalAlpha = 0.3; ctx.fill(); ctx.globalAlpha = p.vizOpacity;
            for(let i=0; i<len; i+=10) {
                const v = vD[i]; if(v > 0.5) {
                    const a = Math.random() * Math.PI * 2; const d = Math.random() * r;
                    ctx.beginPath(); ctx.arc(Math.cos(a)*d, Math.sin(a)*d, 3, 0, Math.PI*2); ctx.fill();
                }
            }
        } else if (p.vizType === 'mandala') {
            const petals = 12; 
            for(let i=0; i<petals; i++) {
                ctx.save(); ctx.rotate((Math.PI * 2 / petals) * i + animTime * 0.0001);
                ctx.beginPath(); 
                const v = vD[i * 5 % len];
                const l = (100 + v * 200 * curSens) * responsiveScale;
                ctx.moveTo(0,0); ctx.quadraticCurveTo(50, l/2, 0, l); ctx.quadraticCurveTo(-50, l/2, 0, 0);
                ctx.stroke(); ctx.restore();
            }
        }

        // === 3D & GEOMETRY ===
        else if (p.vizType === 'cubes_3d') {
            for(let i=0; i<len; i+=10) { const s = (20 + vD[i]*250*curSens) * responsiveScale; ctx.save(); ctx.translate((i/len)*width - width/2, Math.sin(animTime*0.002 + i)*150*responsiveScale * (1 + bass)); ctx.rotate(animTime*0.001 + i + mid); ctx.strokeRect(-s/2, -s/2, s, s); ctx.globalAlpha *= 0.3; ctx.fillRect(-s/2, -s/2, s, s); ctx.restore(); }
        } else if (p.vizType === 'sphere_3d') {
            const rBase = 200 * responsiveScale * (1 + bass * 0.2);
            for(let i=0; i<len; i+=6) { const rad = (Math.PI*2)*(i/len) + animTime*0.0005; const r = rBase + vD[i]*250*curSens*responsiveScale; ctx.beginPath(); ctx.arc(Math.cos(rad)*r, Math.sin(rad)*r, vD[i]*12*responsiveScale+1, 0, Math.PI*2); ctx.fill(); }
        } else if (p.vizType === 'tunnel_3d') {
            for(let i=0; i<15; i++) { const r = ((animTime*0.2 + i*80) % 800) * responsiveScale; ctx.beginPath(); ctx.arc(0, 0, r * (1 + bass * 0.5), 0, Math.PI*2); ctx.lineWidth = (2 + vD[(i*10)%len]*30*curSens) * responsiveScale; ctx.stroke(); }
        } else if (p.vizType === 'neon_grid') {
            const step = 100 * responsiveScale; for(let x = -width/2; x < width/2; x += step) { const v = vD[Math.abs(Math.floor(x/10)) % len]; ctx.beginPath(); ctx.moveTo(x, -height/2); ctx.lineTo(x, height/2); ctx.lineWidth = (1 + v * 8 * curSens + bass * 5) * responsiveScale; ctx.stroke(); }
            for(let y = -height/2; y < height/2; y += step) { const v = vD[Math.abs(Math.floor(y/10)) % len]; ctx.beginPath(); ctx.moveTo(-width/2, y); ctx.lineTo(width/2, y); ctx.lineWidth = (1 + v * 8 * curSens + mid * 5) * responsiveScale; ctx.stroke(); }
        } else if (p.vizType === 'hexagon') {
            const size = 70 * responsiveScale; const dim = 10;
            for(let i=0; i<dim; i++) for(let j=0; j<dim; j++) {
                const v = vD[(i*dim+j)%len]; const hx = (j - dim/2) * size * 1.5; const hy = (i - dim/2) * size * 1.7 + (j % 2) * size * 0.8;
                const s = size * (0.2 + v * curSens * 1.2) * (1 + (i < 3 ? bass : i < 7 ? mid : treble) * 0.5); ctx.beginPath();
                for(let k=0; k<6; k++) { const ang = k * Math.PI / 3; const px = hx + s * Math.cos(ang); const py = hy + s * Math.sin(ang); if(k===0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
                ctx.closePath(); if (v > 0.6) ctx.fill(); else ctx.stroke();
            }
        } else if (p.vizType === 'poly_world') {
            const count = 12; ctx.beginPath(); ctx.moveTo(-width/2, height/2); for(let i=0; i<=count; i++){ const x = (i / count) * width - width/2; const y = -(vD[Math.floor(i * (len/count)) % len] * 400 * curSens + bass * 150) * responsiveScale; ctx.lineTo(x, y); }
            ctx.lineTo(width/2, height/2); ctx.lineTo(-width/2, height/2); ctx.closePath(); ctx.globalAlpha = 0.4 * p.vizOpacity; ctx.fill(); ctx.globalAlpha = p.vizOpacity; ctx.stroke();
            for(let i=0; i<count; i++){ const v = vD[i * 10 % len]; if (v > 0.6) { const x = (i / count) * width - width/2; const y = -(v * 450 * curSens + mid * 100) * responsiveScale; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30 * responsiveScale, y - 60 * responsiveScale); ctx.lineTo(x - 30 * responsiveScale, y - 60 * responsiveScale); ctx.closePath(); ctx.stroke(); } }
        } else if (p.vizType === 'geo_chaos') {
            for(let i=0; i<15; i++) { const v = vD[i * 10 % len]; ctx.save(); ctx.rotate(animTime * 0.001 * (i % 2 === 0 ? 1 : -1) + i); const s = v * 300 * curSens * responsiveScale;
                if (i % 3 === 0) ctx.strokeRect(-s/2, -s/2, s, s); else if (i % 3 === 1) { ctx.beginPath(); ctx.moveTo(0, -s/2); ctx.lineTo(s/2, s/2); ctx.lineTo(-s/2, s/2); ctx.closePath(); ctx.stroke(); } else { ctx.beginPath(); ctx.arc(0, 0, s/2, 0, Math.PI * 2); ctx.stroke(); } ctx.restore();
            }
        } else if (p.vizType === 'pyramids') {
            const count = 8;
            for(let i=0; i<count; i++) {
                const v = vD[i * 10 % len];
                const x = (i/count) * width - width/2 + 50;
                const h = 100 + v * 300 * curSens;
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 50, -h); ctx.lineTo(x + 100, 0); ctx.closePath(); ctx.stroke();
            }
        } else if (p.vizType === 'crystal') {
            const count = 6;
            for(let i=0; i<count; i++) {
                ctx.save(); ctx.rotate(Math.PI * 2 / count * i);
                const v = vD[i * 5 % len];
                const l = 100 + v * 200 * curSens;
                ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(50, l); ctx.lineTo(0, l + 50); ctx.lineTo(-50, l); ctx.closePath(); ctx.stroke();
                ctx.restore();
            }
        }

        // === ABSTRACT & PARTICLES ===
        else if (p.vizType === 'starfield') {
            for(let i=0; i<150; i++) { const v = vD[i % len]; const ang = i * 137.5 + animTime * 0.0001; const dist = (i * 4 + animTime * 0.1 * (1 + bass * 5)) % (minDim * 0.8);
                const x = Math.cos(ang) * dist; const y = Math.sin(ang) * dist; const s = (1 + v * 8 * curSens) * responsiveScale;
                ctx.fillRect(x, y, s, s); if (v > 0.8) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x * 1.1, y * 1.1); ctx.stroke(); }
            }
        } else if (p.vizType === 'particles') {
            for(let i=0; i<150; i++) { const v = vD[i % len]; const ang = i * 2.4 + animTime * 0.0005; const x = Math.sin(ang) * width * 0.4; const y = Math.cos(ang * 0.8) * height * 0.4;
                ctx.beginPath(); ctx.arc(x, y, (2 + v * 35 * curSens) * responsiveScale, 0, Math.PI*2); ctx.fill(); if (v > 0.7) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x * 1.05, y * 1.05); ctx.stroke(); }
            }
        } else if (p.vizType === 'shockwave') {
             const rings = 12; for(let i=0; i<rings; i++) {
                 const r = ((animTime * 0.3 + i * 80) % 1000) * responsiveScale; const a = Math.max(0, (1 - r/(1000 * responsiveScale)));
                 ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.5, 0, 0, Math.PI * 2); ctx.lineWidth = (1 + bass * 20) * a * responsiveScale; ctx.globalAlpha = a * p.vizOpacity; ctx.stroke();
             }
        } else if (p.vizType === 'gravity_well') {
            const count = 200; for(let i=0; i<count; i++) { const ang = (i / count) * Math.PI * 2 + animTime * 0.0008; const base = (Math.sin(animTime * 0.001 + i * 0.05) * 80 + 350) * responsiveScale; const pull = vD[i % len] * 250 * curSens * responsiveScale * (1 + bass * 0.5);
                const x = Math.cos(ang) * base; const y = Math.sin(ang) * base; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(ang) * pull, y - Math.sin(ang) * pull); ctx.lineWidth = (1 + vD[i % len] * 5) * responsiveScale; ctx.stroke(); ctx.fillRect(x - Math.cos(ang) * pull - 3, y - Math.sin(ang) * pull - 3, 6, 6);
            }
        } else if (p.vizType === 'star_burst') {
            if (starBurstRef.current.length < 300 && p.isPlaying) { const count = Math.floor(bass * 10); for(let i=0; i<count; i++) { const ang = Math.random() * Math.PI * 2; const spd = 3 + Math.random() * 15 * bass; starBurstRef.current.push({ x: 0, y: 0, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 1.0, size: 2 + Math.random() * 6 }); } }
            for (let i = starBurstRef.current.length - 1; i >= 0; i--) { const pt = starBurstRef.current[i]; if (p.isPlaying) { pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.015; } if (pt.life <= 0) { starBurstRef.current.splice(i, 1); continue; }
                ctx.globalAlpha = pt.life * p.vizOpacity; ctx.fillRect(pt.x, pt.y, pt.size * responsiveScale, pt.size * responsiveScale); if (pt.life > 0.8) { ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pt.x - pt.vx * 2, pt.y - pt.vy * 2); ctx.stroke(); }
            } ctx.globalAlpha = p.vizOpacity;
        } else if (p.vizType === 'vortex') {
            for(let i=0; i<len; i+=8) { const r = i * responsiveScale * (1 + bass * 2); const rad = i*0.15 + animTime*0.003;
                ctx.fillRect(Math.cos(rad)*r, Math.sin(rad)*r, (2 + vD[i]*10)*responsiveScale, (2 + vD[i]*10)*responsiveScale);
            }
        } else if (p.vizType === 'vector_field') {
            const step = 45 * responsiveScale; for(let x=-width/2; x<width/2; x+=step) for(let y=-height/2; y<height/2; y+=step) { const v = vD[Math.floor(Math.hypot(x, y) / 12) % len]; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(y, x) + v * Math.PI * 1.5 * curSens + bass * 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo((15 + v * 20) * responsiveScale, 0); ctx.lineWidth = (1 + v * 5) * responsiveScale; ctx.stroke(); ctx.restore(); }
        } else if (p.vizType === 'swarm') {
            const count = 50; if(swarmRef.current.length !== count) swarmRef.current = Array.from({length:count}, () => ({x:0, y:0, vx:0, vy:0}));
            swarmRef.current.forEach((s, i) => {
                const v = vD[i % len];
                s.x += (Math.random() - 0.5) * 5 + s.vx; s.y += (Math.random() - 0.5) * 5 + s.vy;
                s.vx *= 0.95; s.vy *= 0.95;
                if(v > 0.5) { s.vx += (Math.random()-0.5)*10; s.vy += (Math.random()-0.5)*10; }
                if(Math.abs(s.x) > width/2) s.x = 0; if(Math.abs(s.y) > height/2) s.y = 0;
                ctx.fillRect(s.x, s.y, 4, 4);
            });
        }

        // === NATURE & ORGANIC ===
        else if (p.vizType === 'dna') {
            const count = 50; for(let i=0; i<count; i++) {
                const y = (i - count/2) * (height/count) * 1.2; const twist = animTime * 0.003 + i * 0.2; const xOff = Math.sin(twist) * 200 * responsiveScale * (1 + mid * 0.5);
                ctx.beginPath(); ctx.arc(xOff, y, (4 + vD[Math.floor(i*(len/count))]*30*curSens)*responsiveScale, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(-xOff, y, (4 + vD[Math.floor(i*(len/count))]*30*curSens)*responsiveScale, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.moveTo(xOff, y); ctx.lineTo(-xOff, y); ctx.lineWidth = (1 + vD[Math.floor(i*(len/count))]*5)*responsiveScale; ctx.stroke();
            }
        } else if (p.vizType === 'lava') {
             const count = 20; for(let i=0; i<count; i++) { const v = vD[i*5 % len];
                 const x = Math.sin(animTime * 0.0005 + i) * width * 0.4; const y = Math.cos(animTime * 0.0004 + i * 1.5) * height * 0.4; const r = (40 + v*150*curSens)*responsiveScale*(1+bass*0.3);
                 const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, p.barColor); g.addColorStop(1, 'transparent'); ctx.fillStyle = g;
                 ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
             }
        } else if (p.vizType === 'liquid_flow') {
            const count = 25; if (liquidPointsRef.current.length !== count) liquidPointsRef.current = Array.from({length: count}, (_, i) => ({ x: (i/count) * width - width/2, y: 0, vx: 0, vy: 0 }));
            ctx.beginPath(); ctx.moveTo(-width/2, 0); liquidPointsRef.current.forEach((pt, i) => { const targetY = vD[Math.floor(i * (len/count)) % len] * 400 * curSens * responsiveScale * (1 + (i < count/2 ? bass : mid) * 0.4); pt.y += (targetY - pt.y) * 0.15; const next = liquidPointsRef.current[i+1] || {x: width/2, y: pt.y}; ctx.quadraticCurveTo(pt.x, pt.y, (pt.x + next.x) / 2, (pt.y + next.y) / 2); });
            ctx.lineTo(width/2, height/2); ctx.lineTo(-width/2, height/2); ctx.fill(); ctx.stroke();
        } else if (p.vizType === 'aurora') {
            for(let l=0; l<3; l++) { ctx.beginPath(); ctx.moveTo(-width/2, height/2); const segs = 20; for(let i=0; i<=segs; i++) { const x = (i/segs) * width - width/2; const y = -( (vD[Math.floor(i * (len/segs)) % len]/255.0) * 400 * curSens + Math.sin(animTime * 0.001 + i + l) * 100) * responsiveScale; ctx.bezierCurveTo(x - 50, y + 100, x + 50, y - 100, x, y); }
                ctx.lineTo(width/2, height/2); const g = ctx.createLinearGradient(0, 0, 0, -height/2); g.addColorStop(0, 'transparent'); g.addColorStop(1, p.barColor); ctx.fillStyle = g; ctx.globalAlpha = 0.3 * p.vizOpacity; ctx.fill();
            } ctx.globalAlpha = p.vizOpacity;
        } else if (p.vizType === 'deep_sea') {
            for(let i=0; i<8; i++) { const v = vD[i * 15 % len] / 255.0; const y = (i / 8) * height - height/2; ctx.beginPath(); ctx.moveTo(-width/2, y); for(let x=-width/2; x<width/2; x+=20) ctx.lineTo(x, y + Math.sin(x * 0.005 + animTime * 0.002 + i) * 50 * v * curSens); ctx.stroke(); }
        } else if (p.vizType === 'abstract_clouds') {
            for(let i=0; i<20; i++) { const v = vD[i * 8 % len]; const x = Math.sin(animTime * 0.0006 + i) * width * 0.4; const y = Math.cos(animTime * 0.0004 + i * 2.2) * height * 0.3; const r = (120 + v * 250 * curSens) * responsiveScale * (1 + bass * 0.2);
                const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, p.barColor); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.globalAlpha = (0.3 + v * 0.3) * p.vizOpacity; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            } ctx.globalAlpha = p.vizOpacity;
        } else if (p.vizType === 'solar_flare') {
            const count = 30; for(let i=0; i<count; i++) { const v = vD[i % len] / 255.0; const ang = (i / count) * Math.PI * 2 + animTime * 0.0002; const r = 150 * responsiveScale + v * 200 * curSens * responsiveScale; const x = Math.cos(ang) * r; const y = Math.sin(ang) * r;
                const g = ctx.createRadialGradient(x, y, 0, x, y, v * 100 * responsiveScale); g.addColorStop(0, p.barColor); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, v * 100 * responsiveScale, 0, Math.PI * 2); ctx.fill();
            }
        } else if (p.vizType === 'kaleido_mesh') {
            const count = 12; const r = 400 * responsiveScale; ctx.save(); for(let i=0; i<count; i++) { ctx.rotate(Math.PI * 2 / count); ctx.beginPath(); for(let j=0; j<10; j++) { const x = (j / 10) * r; const y = Math.sin(animTime * 0.002 + j) * 50 * (vD[Math.floor(j * 10) % len] / 255.0) * curSens * responsiveScale; if(j===0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); ctx.stroke(); } ctx.restore();
        } else if (p.vizType === 'techno_wires') {
            const nodes = 18; const pts = Array.from({length: nodes}, (_, i) => { const ang = (i / nodes) * Math.PI * 2 + animTime * 0.0004; const r = (200 + vD[Math.floor(i * (len/nodes)) % len] * 200 * curSens) * responsiveScale * (1 + bass * 0.2); return {x: Math.cos(ang) * r, y: Math.sin(ang) * r, v: vD[Math.floor(i * (len/nodes)) % len]}; });
            pts.forEach((pt, i) => { ctx.beginPath(); ctx.arc(pt.x, pt.y, (5 + pt.v * 15) * responsiveScale, 0, Math.PI*2); ctx.fill();
                pts.forEach((pt2, j) => { if (i === j) return; const d = Math.hypot(pt.x - pt2.x, pt.y - pt2.y); const thres = 450 * responsiveScale * (1 + mid * 0.3); if (d < thres) { ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pt2.x, pt2.y); ctx.globalAlpha = (1 - d/thres) * 0.6 * p.vizOpacity; ctx.lineWidth = (1 + pt.v * 5) * responsiveScale; ctx.stroke(); } });
            }); ctx.globalAlpha = p.vizOpacity;
        } else if (p.vizType === 'neural_net') {
            const count = 25; if (neuralNetRef.current.length !== count) neuralNetRef.current = Array.from({length: count}, () => ({ x: (Math.random() - 0.5) * width, y: (Math.random() - 0.5) * height, vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.5) * 2.5 }));
            neuralNetRef.current.forEach((n, i) => { const v = vD[i % len]; const spd = p.isPlaying ? (1 + v * 6 * curSens + bass * 4) : 0; n.x += n.vx * spd; n.y += n.vy * spd; if (Math.abs(n.x) > width/2) n.vx *= -1; if (Math.abs(n.y) > height/2) n.vy *= -1; ctx.beginPath(); ctx.arc(n.x, n.y, (5 + v * 15) * responsiveScale, 0, Math.PI * 2); ctx.fill();
                neuralNetRef.current.forEach((n2, j) => { if (i === j) return; const d = Math.hypot(n.x - n2.x, n.y - n2.y); const thres = 350 * responsiveScale * (1 + mid * 0.4); if (d < thres) { ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n2.x, n2.y); ctx.globalAlpha = (1 - d/thres) * 0.5 * p.vizOpacity * (0.5 + v * 0.5); ctx.lineWidth = (1 + v * 4) * responsiveScale; ctx.stroke(); } });
            }); ctx.globalAlpha = p.vizOpacity;
        } else if (p.vizType === 'matrix') {
             const count = 60; if (matrixDropsRef.current.length !== count) matrixDropsRef.current = Array.from({length: count}, (_, i) => ({ x: (i - count/2) * (width/count) * 1.5, y: (Math.random() - 0.5) * height, speed: 1 + Math.random() * 3, chars: Array.from({length: 10}, () => String.fromCharCode(0x30A0 + Math.random()*96)) }));
             ctx.font = `${14 * responsiveScale}px monospace`;
             matrixDropsRef.current.forEach((drop, i) => { drop.y += drop.speed * (1 + bass * 8) * (p.isPlaying ? 1 : 0); if (drop.y > height/2) drop.y = -height/2 - 200; drop.chars.forEach((char, j) => { ctx.globalAlpha = Math.max(0, 1 - (j / drop.chars.length)) * p.vizOpacity; const cY = drop.y - (j * 22 * responsiveScale); if (j === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(drop.x - 2, cY, 4, -vD[Math.floor(i*(len/count)%len)] * 60 * curSens * responsiveScale); } else ctx.fillStyle = fs; if (cY > -height/2 && cY < height/2) ctx.fillText(char, drop.x, cY); }); });
             ctx.globalAlpha = p.vizOpacity;
        } else if (p.vizType === 'fire') {
            const count = 50; 
            if(fireRef.current.length !== count) fireRef.current = Array.from({length:count}, () => ({x:0, y:0, life:0, size:0}));
            fireRef.current.forEach((f, i) => {
                if(f.life <= 0) { f.x = (Math.random() - 0.5) * 200; f.y = 100; f.life = 1; f.size = 10 + Math.random()*20; }
                f.y -= 2 + vD[i%len]*5; f.life -= 0.02;
                ctx.globalAlpha = f.life * p.vizOpacity;
                ctx.fillStyle = `rgba(255, ${Math.floor(f.life*200)}, 0, ${f.life})`;
                ctx.beginPath(); ctx.arc(f.x, f.y, f.size * f.life * responsiveScale, 0, Math.PI*2); ctx.fill();
            });
            ctx.globalAlpha = p.vizOpacity;
        } else if (p.vizType === 'bars_3d') {
            const count = 40; const bW = (width / count) * 0.6;
            for(let i=0; i<count; i++) { const vx = (i/count)*width - width/2; const hV = vD[Math.floor(i*(len/count))]*height*0.8*curSens; ctx.save(); ctx.translate(vx, 0); ctx.transform(1, 0.4, 0, 1, 0, 0); ctx.fillRect(0, 0, bW, -hV); ctx.strokeRect(0, 0, bW, -hV); ctx.fillStyle = '#fff'; ctx.fillRect(0, -hV, bW, 4 * responsiveScale); ctx.restore(); }
        } else if (p.vizType === 'mountain_view') {
            for(let l=0; l<6; l++) { ctx.beginPath(); ctx.moveTo(-width/2, height/2); const segs = 50; const lB = l < 2 ? bass : l < 4 ? mid : treble;
                for(let i=0; i<=segs; i++) { const x = (i/segs) * width - width/2; const y = -(vD[Math.floor(i * (len/segs)) % len] * 250 * curSens + (6 - l) * 120 + Math.sin(i * 0.4 + animTime * 0.001 + l) * 60 + lB * 100) * responsiveScale; ctx.lineTo(x, y); }
                ctx.lineTo(width/2, height/2); ctx.globalAlpha = (0.15 + l * 0.12) * p.vizOpacity; ctx.fill(); ctx.stroke();
            } ctx.globalAlpha = p.vizOpacity;
        } else if (p.vizType === 'floating_orbs') {
            for(let i=0; i<30; i++) { const x = Math.sin(animTime * 0.0006 + i) * width * 0.4; const y = Math.cos(animTime * 0.0005 + i * 2) * height * 0.4;
                ctx.beginPath(); ctx.arc(x, y, (15 + vD[i*5%len] * 80 * curSens) * responsiveScale, 0, Math.PI*2); ctx.globalAlpha = (0.2 + vD[i*5%len] * 0.4) * p.vizOpacity; ctx.fill(); ctx.globalAlpha = p.vizOpacity; ctx.stroke();
            }
        }
      }
      ctx.restore();

      // --- 4. Typography ---
      ctx.save();
      const rV = avgVol * p.textSensitivity;
      let bS = 1.0; let jX = 0; let jY = 0; let tA = 1.0;
      if (p.textReact === 'pulse') bS = 1.0 + (rV * 0.5);
      if (p.textReact === 'jitter' && rV > 0.1) { jX = (Math.random() - 0.5) * 50 * rV; jY = (Math.random() - 0.5) * 50 * rV; }
      if (p.textReact === 'bounce') { jY = -Math.abs(Math.sin(animTime * 0.015)) * 80 * rV; bS = 1.0 + (rV * 0.15); }
      if (p.textReact === 'flash') tA = 0.3 + (1 - rV) * 0.7;
      ctx.globalAlpha = tA;

      const margin = ((p.textMargin ?? 5) / 100) * width;
      const safeWidth = width - (margin * 2);
      
      const baseSize = 100 * responsiveScale * p.fontSizeScale * bS;
      ctx.font = `bold ${baseSize}px "${p.fontFamily}", sans-serif`;
      let titleWidth = ctx.measureText(p.title).width;
      let titleSize = baseSize;
      if (titleWidth > safeWidth) {
          titleSize = (safeWidth / titleWidth) * baseSize;
          ctx.font = `bold ${titleSize}px "${p.fontFamily}", sans-serif`;
      }

      ctx.fillStyle = p.textColor;
      ctx.shadowColor = p.textGlow || p.textReact === 'glow' ? p.textColor : 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = p.textGlow || p.textReact === 'glow' ? 30 * responsiveScale : 10 * responsiveScale;

      let tx = width / 2; let ty = height / 2; let al: CanvasTextAlign = 'center';
      
      if (p.textPosition === 'top') ty = margin + titleSize;
      else if (p.textPosition === 'bottom') ty = height - margin - (titleSize * 0.5);
      else if (p.textPosition.includes('left')) { tx = margin; al = 'left'; }
      else if (p.textPosition.includes('right')) { tx = width - margin; al = 'right'; }
      
      if (p.textPosition.includes('top')) ty = margin + titleSize;
      if (p.textPosition.includes('bottom')) ty = height - margin - (titleSize * 0.5);

      ctx.translate(tx + jX, ty + jY);
      ctx.textAlign = al;
      if (p.textOutline) { ctx.strokeStyle = '#000'; ctx.lineWidth = titleSize / 10; ctx.strokeText(p.title, 0, 0); }
      ctx.fillText(p.title, 0, 0);
      
      const artistSize = titleSize * 0.5;
      ctx.font = `${artistSize}px "${p.fontFamily}", sans-serif`;
      ctx.fillText(p.artist, 0, titleSize * 0.85);
      ctx.restore();

      // --- 5. Post FX ---
      if (p.kaleidoscope) { if (!kaleidoCanvasRef.current) kaleidoCanvasRef.current = document.createElement('canvas'); const kC = kaleidoCanvasRef.current; kC.width = width; kC.height = height; const kCtx = kC.getContext('2d'); if (kCtx) { kCtx.drawImage(canvas, 0, 0); ctx.save(); ctx.translate(width / 2, height / 2); for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.drawImage(kC, -width / 2, -height / 2); } ctx.restore(); } }
      if (p.shakeIntensity > 0 && avgVol > 0.15) { const s = p.shakeIntensity * avgVol * 60 * responsiveScale; ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s); }
      if (p.glitchIntensity > 0 && avgVol > 0.15 && Math.random() < p.glitchIntensity * 0.4) { const gh = Math.random() * 150 + 20; const gy = Math.random() * height; ctx.drawImage(canvas, 0, gy, width, gh, (Math.random() - 0.5) * 200 * p.glitchIntensity * responsiveScale, gy, width, gh); }
      if (p.vignette) { const vg = ctx.createRadialGradient(width / 2, height / 2, width / 3, width / 2, height / 2, width * 0.9); vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.8)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, width, height); }

      // --- 7. Fades ---
      if (audioElement?.duration) { const ct = audioElement.currentTime; const du = audioElement.duration; let a = 1.0; let ft = 'none';
        if (ct < p.fadeInDuration) { ft = p.fadeInType; a = ct / p.fadeInDuration; } else if (ct > du - p.fadeOutDuration) { ft = p.fadeOutType; a = (du - ct) / p.fadeOutDuration; }
        if (a < 1.0 && ft !== 'none') {
          if (ft === 'pixel') {
            if (!pixelCanvasRef.current) pixelCanvasRef.current = document.createElement('canvas');
            const pC = pixelCanvasRef.current;
            const pS = Math.max(1, Math.floor(1 + (1 - a) * 80));
            const sw = Math.max(1, Math.floor(width / pS)); const sh = Math.max(1, Math.floor(height / pS));
            pC.width = sw; pC.height = sh;
            const pCtx = pC.getContext('2d');
            if (pCtx) {
              pCtx.imageSmoothingEnabled = false; pCtx.drawImage(canvas, 0, 0, width, height, 0, 0, sw, sh);
              ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
              ctx.imageSmoothingEnabled = false; ctx.globalAlpha = a; ctx.drawImage(pC, 0, 0, sw, sh, 0, 0, width, height); ctx.restore();
            }
          } else if (ft === 'black') { ctx.fillStyle = `rgba(0,0,0,${1 - a})`; ctx.fillRect(0, 0, width, height); }
          else if (ft === 'white') { ctx.fillStyle = `rgba(255,255,255,${1 - a})`; ctx.fillRect(0, 0, width, height); }
          else if (ft === 'simple') { ctx.save(); ctx.globalAlpha = 1 - a; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); ctx.restore(); }
          else if (ft === 'blur') { ctx.save(); ctx.filter = `blur(${(1 - a) * 30 * responsiveScale}px)`; ctx.drawImage(canvas, 0, 0); ctx.restore(); }
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [analyser, bgType, resolution, w, h]);

  return (
    <div className="visualizer-container" style={{ aspectRatio: `${w}/${h}` }}>
      <canvas ref={canvasRef} />
    </div>
  );
});
