import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  bgUrl: string | null;
  bgType: 'image' | 'video' | 'none';
  bgZoom?: number;
  bgOffsetX?: number;
  bgOffsetY?: number;
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
  isPlaying: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
  fadeInType?: string;
  fadeInDuration?: number;
  fadeOutType?: string;
  fadeOutDuration?: number;
  audioElement: HTMLAudioElement | null;
}

export const Visualizer = forwardRef<HTMLCanvasElement, VisualizerProps>(({
  analyser, bgUrl, bgType, bgZoom = 1.0, bgOffsetX = 50, bgOffsetY = 50,
  vizType, barColor, barColorEnd = '#8b5cf6', useGradient = false, textColor,
  title, artist, resolution, textPosition, fontFamily, fontSizeScale = 1.0, sensitivity, smartSensitivity,
  vizScale, vizRotation, vizOffsetX = 50, vizOffsetY = 50, vizMirror = 'none', vizThickness = 2, vizOpacity = 1.0,
  lowCut = 0, highCut = 100, smartCut = true,
  glitchIntensity, shakeIntensity, rgbShiftIntensity, pixelate, vignette,
  kaleidoscope = false, scanlines = false, noise = false, invert = false,
  textGlow = false, textOutline = false, textReact = 'pulse', textSensitivity = 1.0,
  yoyoMode, isPlaying, onProcessingChange, fadeInType = 'none', fadeInDuration = 2, fadeOutType = 'none', fadeOutDuration = 2,
  audioElement
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const yoyoFramesRef = useRef<ImageBitmap[]>([]);
  const yoyoFrameIndexRef = useRef(0);
  const yoyoDirectionRef = useRef(1); 
  const lastFrameTimeRef = useRef<number>(performance.now());
  const videoDurationRef = useRef<number>(0);
  const volumeHistoryRef = useRef<number[]>([]);
  
  const pixelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const kaleidoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [w, h] = resolution.split('x').map(Number);
  const aspectRatio = (w && h) ? w / h : 16/9;

  useImperativeHandle(ref, () => canvasRef.current!, []);

  // Yo-Yo Capture
  useEffect(() => {
    if (!yoyoMode || bgType !== 'video' || !bgUrl) { onProcessingChange?.(false); return; }
    const vid = document.createElement('video'); vid.src = bgUrl; vid.muted = true;
    bgVideoRef.current = vid;
    const processFrames = async () => {
      onProcessingChange?.(true); yoyoFramesRef.current = []; vid.pause(); vid.currentTime = 0;
      try {
        await new Promise<void>((resolve, reject) => {
          const onLoaded = () => { vid.removeEventListener('loadedmetadata', onLoaded); resolve(); };
          if (vid.readyState >= 1) resolve(); else { vid.addEventListener('loadedmetadata', onLoaded); vid.addEventListener('error', reject); }
        });
        videoDurationRef.current = vid.duration || 1;
        await vid.play();
        const captureFrame = async () => {
          if (vid.ended || vid.currentTime >= vid.duration - 0.05 || yoyoFramesRef.current.length > 300) { onProcessingChange?.(false); return; }
          const bitmap = await createImageBitmap(vid, { resizeWidth: Math.min(w || 1920, 1280), resizeHeight: Math.min(h || 1080, 720) });
          yoyoFramesRef.current.push(bitmap);
          if (vid.paused) return; 
          if ('requestVideoFrameCallback' in vid) (vid as any).requestVideoFrameCallback(captureFrame);
          else requestAnimationFrame(captureFrame);
        };
        if ('requestVideoFrameCallback' in vid) (vid as any).requestVideoFrameCallback(captureFrame);
        else requestAnimationFrame(captureFrame);
      } catch (e) { console.error(e); onProcessingChange?.(false); }
    };
    processFrames();
    return () => { yoyoFramesRef.current.forEach(b => b.close()); yoyoFramesRef.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgUrl, bgType, yoyoMode, resolution]);

  const bgImageRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!bgUrl) { bgImageRef.current = null; return; }
    if (bgType === 'image') { const img = new Image(); img.src = bgUrl; bgImageRef.current = img; }
    else if (bgType === 'video' && !yoyoMode) {
        const vid = document.createElement('video'); vid.src = bgUrl; vid.loop = true; vid.muted = true;
        bgVideoRef.current = vid;
    }
  }, [bgUrl, bgType, yoyoMode]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true }); if (!ctx) return;
    canvas.width = w || 1920; canvas.height = h || 1080;

    let dataArray: Uint8Array;
    if (analyser) dataArray = new Uint8Array(analyser.frequencyBinCount);

    const render = (time: number) => {
      const width = canvas.width; const height = canvas.height;
      const minDim = Math.min(width, height);
      const responsiveScale = minDim / 1000;

      ctx.imageSmoothingEnabled = !pixelate;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);

      // --- 1. Background ---
      const drawBG = (src: CanvasImageSource) => {
          let iw = 0; let ih = 0;
          if (src instanceof HTMLVideoElement) { iw = src.videoWidth; ih = src.videoHeight; }
          else if (src instanceof HTMLImageElement || src instanceof ImageBitmap) { iw = src.width; ih = src.height; }
          if (!iw || !ih) return;
          const r = Math.max(width / iw, height / ih) * bgZoom;
          const nw = iw * r; const nh = ih * r;
          const cx = (width * (bgOffsetX / 100)) - (nw / 2);
          const cy = (height * (bgOffsetY / 100)) - (nh / 2);
          ctx.drawImage(src, cx, cy, nw, nh);
      };

      if (bgType === 'image' && bgImageRef.current?.complete) drawBG(bgImageRef.current);
      else if (bgType === 'video') {
         if (yoyoMode && yoyoFramesRef.current.length > 0) {
            const frames = yoyoFramesRef.current;
            const idx = Math.min(Math.max(yoyoFrameIndexRef.current, 0), frames.length - 1);
            if (frames[idx]) drawBG(frames[idx]);
            if (isPlaying) {
                const fps = 30;
                if (time - lastFrameTimeRef.current >= 1000/fps) {
                    lastFrameTimeRef.current = time;
                    if (yoyoDirectionRef.current === 1) { if (yoyoFrameIndexRef.current >= frames.length-1) yoyoDirectionRef.current = -1; else yoyoFrameIndexRef.current++; }
                    else { if (yoyoFrameIndexRef.current <= 0) yoyoDirectionRef.current = 1; else yoyoFrameIndexRef.current--; }
                }
            }
         } else if (bgVideoRef.current && bgVideoRef.current.readyState >= 2) {
             if (isPlaying && bgVideoRef.current.paused) bgVideoRef.current.play().catch(()=>{});
             else if (!isPlaying && !bgVideoRef.current.paused) bgVideoRef.current.pause();
             drawBG(bgVideoRef.current);
         }
      }

      // --- 2. Audio Analysis ---
      let curSens = sensitivity; let avgVol = 0;
      let vizData = dataArray;
      if (analyser && dataArray) {
        if (vizType.includes('wave')) analyser.getByteTimeDomainData(dataArray as any); else analyser.getByteFrequencyData(dataArray as any);
        let start = Math.floor((lowCut / 100) * dataArray.length);
        let end = Math.floor((highCut / 100) * dataArray.length);
        if (smartCut) { start = Math.floor(0.01 * dataArray.length); end = Math.floor(0.6 * dataArray.length); }
        vizData = dataArray.slice(start, end);
        let sum = 0; for (let i = 0; i < vizData.length; i++) {
            const val = (vizType.includes('spectrum') || vizType.includes('ring') || vizType.includes('circle') || vizType.includes('pulse') || vizType.includes('starfield') || vizType.includes('lava') || vizType.includes('orbs') || vizType.includes('3d') || vizType.includes('grid')) 
              ? vizData[i] / 255.0 : (vizData[i] - 128) / 128.0;
            sum += val * val;
        }
        avgVol = Math.sqrt(sum / vizData.length);
        if (smartSensitivity) {
          volumeHistoryRef.current.push(avgVol); if (volumeHistoryRef.current.length > 60) volumeHistoryRef.current.shift();
          const avgRms = volumeHistoryRef.current.reduce((a, b) => a + b, 0) / volumeHistoryRef.current.length;
          if (avgRms > 0.001) curSens *= Math.min(Math.max(0.2 / avgRms, 0.5), 3.0);
        }
      }

      // --- 3. Visualizer Layer ---
      ctx.save();
      ctx.globalAlpha = vizOpacity;
      ctx.translate((vizOffsetX / 100) * width, (vizOffsetY / 100) * height);
      if(vizMirror==='x'||vizMirror==='xy') ctx.scale(-1,1); if(vizMirror==='y'||vizMirror==='xy') ctx.scale(1,-1);
      ctx.rotate((vizRotation*Math.PI)/180); ctx.scale(vizScale, vizScale);

      let fs: string | CanvasGradient = barColor;
      if(useGradient) { const g=ctx.createLinearGradient(0, height/2, 0, -height/2); g.addColorStop(0,barColor); g.addColorStop(1,barColorEnd); fs=g; }
      ctx.fillStyle = fs; ctx.strokeStyle = fs; ctx.lineWidth = vizThickness * responsiveScale; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      if (analyser && vizData) {
        const len = vizData.length;
        if (vizType === 'spectrum' || vizType === 'mirror_spectrum') {
            const mirrored = vizType === 'mirror_spectrum';
            const bW = (width / len) * (mirrored ? 4 : 2);
            const maxH = height * 0.5 * curSens;
            for (let i = 0; i < len; i++) {
                const hVal = (vizData[i]/255) * maxH;
                const vx = -width/2 + i*(bW+1);
                ctx.fillRect(vx, 0, bW, -hVal);
                if(mirrored) ctx.fillRect(vx, 0, bW, hVal);
            }
        } else if (vizType === 'wave') {
            const mH = height*0.3*curSens; ctx.beginPath(); const sW=width/len; let wx=-width/2;
            for(let i=0; i<len; i++){ const vy=(vizData[i]/128.0-1)*mH; if(i===0)ctx.moveTo(wx,vy); else ctx.lineTo(wx,vy); wx+=sW; } ctx.stroke();
        } else if (vizType === 'cubes_3d') {
            for(let i=0; i<len; i+=10) {
                const v = vizData[i]/255.0; const size = (20 + v*150*curSens) * responsiveScale;
                const tx = (i/len)*width - width/2; const ty = Math.sin(time*0.001 + i)*100*responsiveScale;
                ctx.save(); ctx.translate(tx, ty); ctx.rotate(time*0.001 + i);
                ctx.strokeRect(-size/2, -size/2, size, size);
                ctx.globalAlpha *= 0.3; ctx.fillRect(-size/2, -size/2, size, size); ctx.restore();
            }
        } else if (vizType === 'sphere_3d') {
            const radius = 250 * responsiveScale;
            for(let i=0; i<len; i+=8) {
                const v = vizData[i]/255.0; const rad = (Math.PI*2)*(i/len) + time*0.0005;
                const r = radius + v*200*curSens*responsiveScale;
                ctx.beginPath(); ctx.arc(Math.cos(rad)*r, Math.sin(rad)*r, v*8*responsiveScale+1, 0, Math.PI*2); ctx.fill();
            }
        } else if (vizType === 'tunnel_3d') {
            for(let i=0; i<12; i++) {
                const v = vizData[i*15 % len]/255.0;
                const r = ((time*0.15 + i*120) % 1000) * responsiveScale;
                ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2);
                ctx.lineWidth = v*20*curSens*responsiveScale; ctx.stroke();
            }
        } else if (vizType === 'bars_3d') {
            const count = 50; const bW = (width / count) * 0.7;
            for(let i=0; i<count; i++) {
                const v = vizData[Math.floor(i*(len/count))]/255.0;
                const bx = (i/count)*width - width/2; const hVal = v*height*0.7*curSens;
                ctx.save(); ctx.translate(bx, 0); ctx.transform(1, 0.5, 0, 1, 0, 0); 
                ctx.fillRect(0, 0, bW, -hVal); ctx.strokeRect(0, 0, bW, -hVal); ctx.restore();
            }
        } else if (vizType === 'cyber_grid') {
            const rows = 10; const cols = 10;
            for(let i=0; i<rows; i++) {
                for(let j=0; j<cols; j++) {
                    const v = vizData[(i*cols + j) % len]/255.0;
                    const size = v * 80 * responsiveScale * curSens;
                    ctx.strokeRect((j-cols/2)*100*responsiveScale, (i-rows/2)*100*responsiveScale, size, size);
                }
            }
        } else if (vizType === 'vortex') {
            for(let i=0; i<len; i+=10) {
                const v = vizData[i]/255.0; const rad = i*0.1 + time*0.002;
                const r = i * responsiveScale * curSens * v;
                ctx.fillRect(Math.cos(rad)*r, Math.sin(rad)*r, 4, 4);
            }
        } else if (vizType === 'circle' || vizType === 'ring' || vizType === 'pulse') {
          const r = minDim * (vizType === 'pulse' ? 0.1 + avgVol * 0.2 : 0.25);
          const mBH = (minDim * 0.2) * curSens;
          for (let i = 0; i < len; i += 6) {
            const v = vizData[i] / 255.0; const bH = v * mBH; const rad = (Math.PI * 2) * (i / len);
            const x1 = Math.cos(rad) * r; const y1 = Math.sin(rad) * r;
            const x2 = Math.cos(rad) * (r + bH); const y2 = Math.sin(rad) * (r + bH);
            if (vizType === 'ring') { ctx.beginPath(); ctx.arc(x2, y2, v * 5 * responsiveScale + 1, 0, Math.PI * 2); ctx.fill(); }
            else { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
          }
        }
      }
      ctx.restore();

      // --- 4. Typography ---
      ctx.save();
      const rVol = avgVol * textSensitivity;
      let beatScale = 1.0; let jX = 0; let jY = 0; let tAlpha = 1.0;
      if (textReact === 'pulse') beatScale = 1.0 + (rVol * 0.5);
      if (textReact === 'jitter' && rVol > 0.1) { jX = (Math.random() - 0.5) * 50 * rVol; jY = (Math.random() - 0.5) * 50 * rVol; }
      if (textReact === 'bounce') { jY = -Math.abs(Math.sin(time * 0.015)) * 80 * rVol; beatScale = 1.0 + (rVol * 0.15); }
      if (textReact === 'flash') tAlpha = 0.3 + (1 - rVol) * 0.7;
      if (textReact === 'glow') { ctx.shadowBlur = 50 * rVol * responsiveScale; }

      ctx.globalAlpha = tAlpha;
      const tS = 100 * responsiveScale * fontSizeScale * beatScale;
      ctx.font = `bold ${tS}px "${fontFamily}", sans-serif`;
      ctx.fillStyle = textColor;
      ctx.shadowColor = textGlow || textReact === 'glow' ? textColor : 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = textGlow || textReact === 'glow' ? 30 * responsiveScale : 10 * responsiveScale;

      const padX = width * 0.08; const padY = height * 0.15;
      let tx = width / 2; let ty = height / 2; let align: CanvasTextAlign = 'center';
      if (textPosition === 'top') ty = padY; else if (textPosition === 'bottom') ty = height - padY;
      else if (textPosition.includes('left')) { tx = padX; align = 'left'; } else if (textPosition.includes('right')) { tx = width - padX; align = 'right'; }
      if (textPosition.includes('top')) ty = padY; if (textPosition.includes('bottom')) ty = height - padY;

      ctx.translate(tx + jX, ty + jY);
      ctx.textAlign = align;
      if (textOutline) { ctx.strokeStyle = '#000'; ctx.lineWidth = tS / 10; ctx.strokeText(title, 0, 0); }
      ctx.fillText(title, 0, 0);
      ctx.font = `${tS * 0.5}px "${fontFamily}", sans-serif`;
      ctx.fillText(artist, 0, tS * 0.85);
      ctx.restore();

      // --- 5. Kaleidoscope ---
      if (kaleidoscope) {
        if (!kaleidoCanvasRef.current) kaleidoCanvasRef.current = document.createElement('canvas');
        const kCan = kaleidoCanvasRef.current; kCan.width = width; kCan.height = height;
        const kCtx = kCan.getContext('2d');
        if (kCtx) {
          kCtx.drawImage(canvas, 0, 0);
          ctx.save(); ctx.translate(width / 2, height / 2);
          const slices = 8; const angle = (Math.PI * 2) / slices;
          for (let i = 0; i < slices; i++) { ctx.rotate(angle); ctx.drawImage(kCan, -width / 2, -height / 2); }
          ctx.restore();
        }
      }

      // --- 6. Post FX ---
      if (shakeIntensity > 0 && avgVol > 0.15) {
        const s = shakeIntensity * avgVol * 60 * responsiveScale;
        ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
      }
      if (glitchIntensity > 0 && avgVol > 0.15 && Math.random() < glitchIntensity * 0.4) {
        const gh = Math.random() * 150 + 20; const gy = Math.random() * height; const goff = (Math.random() - 0.5) * 200 * glitchIntensity * responsiveScale;
        ctx.drawImage(canvas, 0, gy, width, gh, goff, gy, width, gh);
      }
      if (rgbShiftIntensity > 0 && avgVol > 0.1) {
        const shift = rgbShiftIntensity * avgVol * 15 * responsiveScale;
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.5;
        ctx.drawImage(canvas, shift, 0); ctx.drawImage(canvas, -shift, 0); ctx.restore();
      }
      if (scanlines) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < height; i += 4) ctx.fillRect(0, i, width, 1); }
      if (noise) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`; ctx.fillRect(0, 0, width, height); }
      if (invert) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, width, height); ctx.restore(); }
      if (vignette) {
        const vg = ctx.createRadialGradient(width / 2, height / 2, width / 3, width / 2, height / 2, width * 0.9);
        vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = vg; ctx.fillRect(0, 0, width, height);
      }

      // --- 7. Fades ---
      if (audioElement?.duration) {
        const ct = audioElement.currentTime; const du = audioElement.duration;
        let alpha = 1.0; let ftype = 'none';
        if (ct < fadeInDuration) { ftype = fadeInType; alpha = ct / fadeInDuration; }
        else if (ct > du - fadeOutDuration) { ftype = fadeOutType; alpha = (du - ct) / fadeOutDuration; }
        
        if (alpha < 1.0 && ftype !== 'none') {
          if (ftype === 'pixel') {
            if (!pixelCanvasRef.current) pixelCanvasRef.current = document.createElement('canvas');
            const pCan = pixelCanvasRef.current;
            const psize = Math.floor(1 + (1 - alpha) * 80);
            const sw = Math.max(1, Math.floor(width / psize)); const sh = Math.max(1, Math.floor(height / psize));
            pCan.width = sw; pCan.height = sh;
            const pCtx = pCan.getContext('2d');
            if (pCtx) {
              pCtx.imageSmoothingEnabled = false; pCtx.drawImage(canvas, 0, 0, width, height, 0, 0, sw, sh);
              ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(pCan, 0, 0, sw, sh, 0, 0, width, height); ctx.restore();
            }
          } else if (ftype === 'black') { ctx.fillStyle = `rgba(0,0,0,${1 - alpha})`; ctx.fillRect(0, 0, width, height); }
          else if (ftype === 'white') { ctx.fillStyle = `rgba(255,255,255,${1 - alpha})`; ctx.fillRect(0, 0, width, height); }
          else if (ftype === 'simple') { ctx.save(); ctx.globalAlpha = 1 - alpha; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); ctx.restore(); }
          else if (ftype === 'blur') { ctx.save(); ctx.filter = `blur(${(1 - alpha) * 30 * responsiveScale}px)`; ctx.drawImage(canvas, 0, 0); ctx.restore(); }
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };
    render(performance.now());
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [analyser, vizType, barColor, barColorEnd, useGradient, textColor, title, artist, resolution, textPosition, fontFamily, fontSizeScale, sensitivity, smartSensitivity, vizScale, vizRotation, vizOffsetX, vizOffsetY, vizMirror, vizThickness, vizOpacity, lowCut, highCut, smartCut, glitchIntensity, shakeIntensity, rgbShiftIntensity, pixelate, vignette, kaleidoscope, scanlines, noise, invert, textGlow, textOutline, textReact, textSensitivity, yoyoMode, bgType, bgUrl, bgZoom, bgOffsetX, bgOffsetY, isPlaying, fadeInType, fadeInDuration, fadeOutType, fadeOutDuration, audioElement, w, h]);

  return (
    <div style={{ width: '100%', height: '100%', aspectRatio, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
});
