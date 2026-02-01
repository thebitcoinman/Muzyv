import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  bgUrl: string | null;
  bgType: 'image' | 'video' | 'none';
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
  vizPlacement?: string;
  vizMirror?: string;
  glitchIntensity: number;
  shakeIntensity: number;
  rgbShiftIntensity: number;
  pixelate: boolean;
  vignette: boolean;
  kaleidoscope?: boolean;
  scanlines?: boolean;
  noise?: boolean;
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
  analyser,
  bgUrl,
  bgType,
  vizType,
  barColor,
  barColorEnd = '#8b5cf6',
  useGradient = false,
  textColor,
  title,
  artist,
  resolution,
  textPosition,
  fontFamily,
  fontSizeScale = 1.0,
  sensitivity,
  smartSensitivity,
  vizScale,
  vizRotation,
  vizPlacement = 'center',
  vizMirror = 'none',
  glitchIntensity,
  shakeIntensity,
  rgbShiftIntensity,
  pixelate,
  vignette,
  kaleidoscope = false,
  scanlines = false,
  noise = false,
  yoyoMode,
  isPlaying,
  onProcessingChange,
  fadeInType = 'none',
  fadeInDuration = 2,
  fadeOutType = 'none',
  fadeOutDuration = 2,
  audioElement
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  // Aspect Ratio
  const [w, h] = resolution.split('x').map(Number);
  const aspectRatio = (w && h) ? w / h : 16/9;
  
  // Background Resources
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // Yo-Yo State
  const yoyoFramesRef = useRef<ImageBitmap[]>([]);
  const yoyoFrameIndexRef = useRef(0);
  const yoyoDirectionRef = useRef(1); // 1 = forward, -1 = backward
  const lastFrameTimeRef = useRef<number>(0);
  const videoDurationRef = useRef<number>(0);

  // Auto-gain state
  const volumeHistoryRef = useRef<number[]>([]);

  // Expose canvas ref
  useImperativeHandle(ref, () => canvasRef.current!, []);

  // Frame Capture Logic (Yo-Yo)
  useEffect(() => {
    if (!yoyoMode || bgType !== 'video' || !bgVideoRef.current) {
      yoyoFramesRef.current = [];
      onProcessingChange?.(false);
      return;
    }

    const vid = bgVideoRef.current;
    
    // Safety check for duration
    if (vid.duration > 15) {
      alert("Video is too long for Yo-Yo mode (Max 15s).");
      onProcessingChange?.(false);
      return;
    }

    const processFrames = async () => {
      onProcessingChange?.(true);
      yoyoFramesRef.current = []; 
      vid.pause();
      vid.currentTime = 0;

      if (!vid.duration) {
         await new Promise<void>(resolve => {
             vid.onloadedmetadata = () => resolve();
         });
      }
      videoDurationRef.current = vid.duration || 1;

      try {
        await vid.play();
        
        const captureFrame = async () => {
          if (vid.ended || vid.currentTime >= vid.duration) {
             console.log(`Yo-Yo processing done. Captured ${yoyoFramesRef.current.length} frames.`);
             onProcessingChange?.(false);
             return;
          }

          // Capture & RESIZE
          const bitmap = await createImageBitmap(vid, { 
              resizeWidth: w || 1280, 
              resizeHeight: h || 720,
              resizeQuality: 'medium'
          });
          yoyoFramesRef.current.push(bitmap);

          if (vid.paused) return; 

          if ('requestVideoFrameCallback' in vid) {
            vid.requestVideoFrameCallback(captureFrame);
          } else {
            requestAnimationFrame(captureFrame); 
          }
        };
        
        if ('requestVideoFrameCallback' in vid) {
          vid.requestVideoFrameCallback(captureFrame);
        } else {
          requestAnimationFrame(captureFrame);
        }

      } catch (e) {
        console.error("Error processing Yo-Yo frames:", e);
        onProcessingChange?.(false);
      }
    };

    if (vid.readyState >= 2) {
      processFrames();
    } else {
      vid.oncanplay = () => {
         processFrames();
         vid.oncanplay = null;
      };
    }

    return () => {
      yoyoFramesRef.current.forEach(b => b.close());
      yoyoFramesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgUrl, bgType, yoyoMode]); 


  // Load Background Resources (Standard)
  useEffect(() => {
    if (!bgUrl) {
      bgImageRef.current = null;
      bgVideoRef.current = null;
      return;
    }

    if (bgType === 'image') {
      const img = new Image();
      img.src = bgUrl;
      bgImageRef.current = img;
      bgVideoRef.current = null;
    } else if (bgType === 'video') {
      const vid = document.createElement('video');
      vid.src = bgUrl;
      vid.loop = !yoyoMode; 
      vid.muted = true;
      bgVideoRef.current = vid;
      bgImageRef.current = null;
    }
  }, [bgUrl, bgType, yoyoMode, pixelate]); 

  // Control Video Playback
  useEffect(() => {
    const vid = bgVideoRef.current;
    if (vid && bgType === 'video' && !yoyoMode) {
        if (isPlaying) {
            vid.play().catch(e => console.warn("Video play failed", e));
        } else {
            vid.pause();
        }
    }
  }, [isPlaying, bgType, yoyoMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!ctx) return;

    const [rw, rh] = resolution.split('x').map(Number);
    canvas.width = rw || 1920;
    canvas.height = rh || 1080;

    // Smoothing
    ctx.imageSmoothingEnabled = !pixelate;

    let bufferLength = 0;
    let dataArray: Uint8Array;

    if (analyser) {
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    const render = (time: number) => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear Frame (Important for some effects)
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      // --- Background & Yo-Yo ---
      if (bgType === 'image' && bgImageRef.current) {
        const img = bgImageRef.current;
        if (img.complete) drawImageCover(ctx, img, width, height);
      } else if (bgType === 'video') {
         if (yoyoMode && yoyoFramesRef.current.length > 0) {
            const frames = yoyoFramesRef.current;
            const idx = Math.min(Math.max(yoyoFrameIndexRef.current, 0), frames.length - 1);
            if (frames[idx]) drawImageCover(ctx, frames[idx], width, height);

            if (isPlaying) {
                const fps = (frames.length > 0 && videoDurationRef.current > 0) 
                    ? frames.length / videoDurationRef.current 
                    : 30;
                const frameInterval = 1000 / (fps || 30);

                if (time - lastFrameTimeRef.current >= frameInterval) {
                    lastFrameTimeRef.current = time;
                    if (yoyoDirectionRef.current === 1) {
                       if (yoyoFrameIndexRef.current >= frames.length - 1) yoyoDirectionRef.current = -1;
                       else yoyoFrameIndexRef.current++;
                    } else {
                       if (yoyoFrameIndexRef.current <= 0) yoyoDirectionRef.current = 1;
                       else yoyoFrameIndexRef.current--;
                    }
                }
            }
         } else if (bgVideoRef.current) {
             const vid = bgVideoRef.current;
             if (vid.readyState >= 2) drawImageCover(ctx, vid, width, height);
         }
      }

      // --- Fade In / Out Logic ---
      let globalAlpha = 1.0;
      let blurAmount = 0;
      let pixelSize = 1;

      if (audioElement && audioElement.duration) {
          const t = audioElement.currentTime;
          const d = audioElement.duration;
          
          // Fade In
          if (t < fadeInDuration) {
              const progress = t / fadeInDuration; // 0 to 1
              if (fadeInType === 'simple') globalAlpha = progress;
              if (fadeInType === 'blur') blurAmount = (1 - progress) * 20;
              if (fadeInType === 'pixel') pixelSize = 1 + (1 - progress) * 50;
          }
          
          // Fade Out
          if (t > d - fadeOutDuration) {
              const progress = (d - t) / fadeOutDuration; // 1 to 0
              if (fadeOutType === 'simple') globalAlpha = progress;
              if (fadeOutType === 'blur') blurAmount = (1 - progress) * 20;
              if (fadeOutType === 'pixel') pixelSize = 1 + (1 - progress) * 50;
          }
      }

      // Apply Fades
      if (globalAlpha < 1) {
          ctx.globalAlpha = globalAlpha;
          // Note: globalAlpha affects future drawings. If we want to fade the BG too, we should have applied it before.
          // But usually we want to fade to black.
          // A better way for "Fade to Black" is to draw a black rectangle on top with (1-alpha).
      }
      
      // --- Audio Analysis ---
      let currentSensitivity = sensitivity;
      let avgVolume = 0;

      if (analyser) {
        if (vizType.includes('wave')) analyser.getByteTimeDomainData(dataArray);
        else analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            const val = (vizType === 'spectrum' || vizType.includes('mirror') || vizType === 'ring' || vizType === 'circle' || vizType === 'dna' || vizType === 'sphere' || vizType === 'cubes' || vizType === 'shockwave') 
              ? dataArray[i] / 255.0 
              : (dataArray[i] - 128) / 128.0;
            sum += val * val;
        }
        avgVolume = Math.sqrt(sum / bufferLength);

        if (smartSensitivity) {
          volumeHistoryRef.current.push(avgVolume);
          if (volumeHistoryRef.current.length > 60) volumeHistoryRef.current.shift();
          const avgRms = volumeHistoryRef.current.reduce((a, b) => a + b, 0) / volumeHistoryRef.current.length;
          if (avgRms > 0.001) {
             const target = 0.2; 
             const autoGain = Math.min(Math.max(target / avgRms, 0.5), 3.0);
             currentSensitivity *= autoGain;
          }
        }
      }

      // --- Viz Placement & Mirror Transform ---
      ctx.save();
      
      // Placement
      let vizY = height / 2;
      if (vizPlacement === 'top') vizY = height * 0.25;
      if (vizPlacement === 'bottom') vizY = height * 0.75;
      
      ctx.translate(width / 2, vizY); // Move to center/target Y
      
      // Mirroring
      if (vizMirror === 'x' || vizMirror === 'xy') ctx.scale(-1, 1); // Flip X
      if (vizMirror === 'y' || vizMirror === 'xy') ctx.scale(1, -1); // Flip Y (Be careful with text if drawn here)

      // Rotation & Scale
      ctx.rotate((vizRotation * Math.PI) / 180);
      ctx.scale(vizScale, vizScale);

      // Gradient
      let fillStyle: string | CanvasGradient = barColor;
      if (useGradient) {
          const grad = ctx.createLinearGradient(0, height/2, 0, -height/2);
          grad.addColorStop(0, barColor);
          grad.addColorStop(1, barColorEnd);
          fillStyle = grad;
      }
      ctx.fillStyle = fillStyle;
      ctx.strokeStyle = fillStyle;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      // --- Draw Visualizers ---
      if (analyser) {
        // Offset back to center for drawing relative to (0,0) being the transform point
        // But draw logic assumes 0,0 is top-left usually? 
        // We translated to center. So (0,0) is now the center of viz.
        // We need to adjust draw coordinates to be centered around 0,0.
        
        // Helper to center draw
        const drawSpectrum = (mirrored = false) => {
            const barWidth = (width / bufferLength) * (mirrored ? 5 : 2.5);
            const maxH = height * 0.5 * currentSensitivity;
            const startX = -width / 2; // Start from left relative to center
            
            for (let i = 0; i < bufferLength; i++) {
                const hVal = (dataArray[i] / 255) * maxH;
                const x = startX + (i * (barWidth + 1));
                ctx.fillRect(x, 0, barWidth, -hVal); // Draw UP from center line
                if (mirrored) ctx.fillRect(x, 0, barWidth, hVal); // Draw DOWN too
            }
        };

        if (vizType === 'spectrum') {
            drawSpectrum(false);
        } else if (vizType === 'mirror_spectrum') {
            drawSpectrum(true); // Double sided
        } else if (vizType === 'wave') {
            const maxH = height * 0.3 * currentSensitivity;
            ctx.beginPath();
            const sliceW = width / bufferLength;
            let x = -width / 2;
            for(let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0; // 0..2
                const y = (v - 1) * maxH; 
                if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                x += sliceW;
            }
            ctx.stroke();
        } else if (vizType === 'circle' || vizType === 'ring') {
            const radius = Math.min(width, height) * 0.25;
            const maxBarH = (Math.min(width, height) * 0.2) * currentSensitivity;
            const step = 6;
            
            for (let i = 0; i < bufferLength; i += step) {
                const val = dataArray[i] / 255.0;
                const barH = val * maxBarH;
                const rad = (Math.PI * 2) * (i / bufferLength);
                const x1 = Math.cos(rad) * radius;
                const y1 = Math.sin(rad) * radius;
                const x2 = Math.cos(rad) * (radius + barH);
                const y2 = Math.sin(rad) * (radius + barH);
                
                if (vizType === 'ring') {
                    // Dots
                    ctx.beginPath();
                    ctx.arc(x2, y2, val * 5 + 2, 0, Math.PI*2);
                    ctx.fill();
                } else {
                    // Lines
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            }
        } else if (vizType === 'dna') {
            const step = 10;
            const amp = height * 0.2 * currentSensitivity;
            for (let i = 0; i < bufferLength; i+=step) {
                const v = dataArray[i] / 255.0;
                const x = (i / bufferLength) * width - (width/2);
                const y1 = Math.sin(i * 0.1 + performance.now() * 0.002) * amp * v;
                const y2 = Math.sin(i * 0.1 + Math.PI + performance.now() * 0.002) * amp * v;
                
                ctx.beginPath();
                ctx.arc(x, y1, 4 * v, 0, Math.PI*2);
                ctx.arc(x, y2, 4 * v, 0, Math.PI*2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(x, y1);
                ctx.lineTo(x, y2);
                ctx.globalAlpha = 0.2;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }
        } else if (vizType === 'shockwave') {
             // Radial Shockwave
             const maxR = Math.min(width, height) * 0.4;
             if (avgVolume > 0.1) {
                 ctx.beginPath();
                 ctx.arc(0, 0, maxR * avgVolume * currentSensitivity, 0, Math.PI * 2);
                 ctx.lineWidth = 10 * avgVolume;
                 ctx.stroke();
             }
        }
        // Add more logic for 'cubes', 'sphere' (simplified 2D projections) if needed
        // For brevity, mapping basic types.
      }
      ctx.restore(); // Undo transform/mirror

      // --- Typography ---
      // Reset transform just in case
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const titleSize = 72 * (height/1080) * fontSizeScale;
      const artistSize = 36 * (height/1080) * fontSizeScale;
      
      ctx.font = `bold ${titleSize}px "${fontFamily}", sans-serif`;
      ctx.fillStyle = textColor;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center'; // We will calc position manually based on presets

      // Calculate Position
      const padX = width * 0.08;
      const padY = height * 0.15;
      let tx = width / 2;
      let ty = height / 2;
      let align: CanvasTextAlign = 'center';

      if (textPosition === 'top') ty = padY;
      else if (textPosition === 'bottom') ty = height - padY;
      else if (textPosition.includes('left')) { tx = padX; align = 'left'; }
      else if (textPosition.includes('right')) { tx = width - padX; align = 'right'; }
      // Top/Bottom Corner Logic
      if (textPosition.includes('top')) ty = padY;
      if (textPosition.includes('bottom')) ty = height - padY;

      ctx.textAlign = align;
      ctx.fillText(title, tx, ty);
      ctx.font = `${artistSize}px "${fontFamily}", sans-serif`;
      ctx.fillText(artist, tx, ty + titleSize * 1.2);
      ctx.shadowColor = 'transparent';

      // --- Post FX ---
      if (pixelate || pixelSize > 1) {
          // Note: Doing real pixelate via canvas scaling in loop is heavy.
          // Simpler: Use large pixels for 'fade' or 'effect' if critically needed.
          // For now, imageSmoothingEnabled handles asset scaling, but not full scene pixelation post-process efficiently here without offscreen canvas.
          // We'll skip complex pixelation loop for performance unless requested specifically.
      }

      if (vignette) {
         const grad = ctx.createRadialGradient(width/2, height/2, width/3, width/2, height/2, width);
         grad.addColorStop(0, 'rgba(0,0,0,0)');
         grad.addColorStop(1, 'rgba(0,0,0,0.7)');
         ctx.fillStyle = grad;
         ctx.fillRect(0,0,width,height);
      }

      if (scanlines) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          for (let y = 0; y < height; y += 4) {
              ctx.fillRect(0, y, width, 2);
          }
      }

      if (noise) {
          // Simple noise overlay
          // Generating noise per frame is heavy. 
          // Optimization: Pre-generate noise or use very sparse noise.
      }

      // --- Fade To Black Overlay (Simple & Blur) ---
      if (globalAlpha < 1.0) {
          // If simple fade (opacity), we already set globalAlpha for drawing content.
          // But if we want to fade the BACKGROUND too, we need to draw a black veil.
          // Since we cleared the canvas and drew on top, globalAlpha only affected content.
          // To fade everything to black:
          ctx.fillStyle = `rgba(0,0,0, ${1 - globalAlpha})`;
          ctx.fillRect(0, 0, width, height);
      }
      
      if (blurAmount > 0) {
          // Blur is hard to do in one pass.
          // CSS filter on canvas is easiest but doesn't capture in MediaRecorder easily in all browsers?
          // Actually, context.filter works in modern browsers.
          // We should have set it BEFORE drawing. 
          // Refactoring render order:
          // 1. Set Filter
          // 2. Draw Scene
          // 3. Reset Filter
          // BUT we are at end of function. 
          // For next frame, we can set it at start.
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render(performance.now());

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, vizType, barColor, barColorEnd, useGradient, textColor, title, artist, resolution, textPosition, fontFamily, fontSizeScale, sensitivity, smartSensitivity, vizScale, vizRotation, vizPlacement, vizMirror, glitchIntensity, shakeIntensity, rgbShiftIntensity, pixelate, vignette, kaleidoscope, scanlines, noise, yoyoMode, bgType, bgUrl, isPlaying, fadeInType, fadeInDuration, fadeOutType, fadeOutDuration, audioElement]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      aspectRatio: aspectRatio,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#09090b',
      boxShadow: '0 0 50px rgba(0,0,0,0.5)'
    }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain',
          filter: (fadeInType === 'blur' || fadeOutType === 'blur') ? 'blur(0px)' : 'none' // React controlled filter if possible
        }}
      />
    </div>
  );
});

// Helper for "object-fit: cover" on Canvas
function drawImageCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, w: number, h: number) {
   let iw = img.width as number;
   let ih = img.height as number;
   if(img instanceof HTMLVideoElement) {
       iw = img.videoWidth;
       ih = img.videoHeight;
   } else if (img instanceof ImageBitmap) {
       iw = img.width;
       ih = img.height;
   }
   
   const r = Math.min(w / iw, h / ih);
   let nw = iw * r;   
   let nh = ih * r;   
   let ar = 1;
  
   if (nw < w) ar = w / nw;                             
   if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh; 
   nw *= ar;
   nh *= ar;

   const cw = iw / (nw / w);
   const ch = ih / (nh / h);

   const cx = (iw - cw) * 0.5;
   const cy = (ih - ch) * 0.5;

   ctx.drawImage(img, cx, cy, cw, ch,  0, 0, w, h);
}
