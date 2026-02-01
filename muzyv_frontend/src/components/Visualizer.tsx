import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  bgUrl: string | null;
  bgType: 'image' | 'video' | 'none';
  vizType: string;
  barColor: string;
  textColor: string;
  title: string;
  artist: string;
  resolution: string; // "1920x1080"
  textPosition: string;
}

export const Visualizer = forwardRef<HTMLCanvasElement, VisualizerProps>(({
  analyser,
  bgUrl,
  bgType,
  vizType,
  barColor,
  textColor,
  title,
  artist,
  resolution,
  textPosition,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  // Calculate aspect ratio directly
  const [w, h] = resolution.split('x').map(Number);
  const aspectRatio = (w && h) ? w / h : 16/9;
  
  // Background Resources
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);

  // Expose canvas ref
  useImperativeHandle(ref, () => canvasRef.current!, []);

  // Load Background Resources
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
      vid.loop = true;
      vid.muted = true;
      vid.play().catch(e => console.warn("Auto-play blocked for bg video", e));
      bgVideoRef.current = vid;
      bgImageRef.current = null;
    }
  }, [bgUrl, bgType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency
    if (!ctx) return;

    // Set resolution from prop
    const [rw, rh] = resolution.split('x').map(Number);
    canvas.width = rw || 1920;
    canvas.height = rh || 1080;

    let bufferLength = 0;
    let dataArray: Uint8Array;

    if (analyser) {
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    const render = () => {
      // 1. Draw Background
      if (bgType === 'image' && bgImageRef.current) {
        // Draw Image (Cover)
        const img = bgImageRef.current;
        if (img.complete) {
           drawImageCover(ctx, img, canvas.width, canvas.height);
        } else {
           ctx.fillStyle = '#000';
           ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else if (bgType === 'video' && bgVideoRef.current) {
         // Draw Video Frame (Cover)
         const vid = bgVideoRef.current;
         if (vid.readyState >= 2) {
            drawImageCover(ctx, vid, canvas.width, canvas.height);
         } else {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
         }
      } else {
         ctx.fillStyle = '#000';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // 2. Get Audio Data
      if (analyser) {
        if (vizType === 'wave' || vizType === 'wave_center') {
          analyser.getByteTimeDomainData(dataArray);
        } else {
          analyser.getByteFrequencyData(dataArray);
        }
      }

      const width = canvas.width;
      const height = canvas.height;

      // 3. Draw Visualizer
      if (analyser) {
        ctx.fillStyle = barColor;
        ctx.strokeStyle = barColor;
        ctx.lineWidth = 2;

        if (vizType === 'wave') {
           // Relative sizing: 20% of height
           const vizH = height * 0.2;
           
          ctx.beginPath();
          const sliceWidth = width * 1.0 / bufferLength;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * vizH) + (height - vizH); 
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
          }
          ctx.stroke();
        } else if (vizType === 'wave_center') {
          // Centered Wave
           const vizH = height * 0.3;
           const centerY = height / 2;
           
          ctx.beginPath();
          const sliceWidth = width * 1.0 / bufferLength;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0; // 0 to 2 (1 is silence)
            const deviation = (v - 1) * vizH; 
            const y = centerY + deviation;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
          }
          ctx.stroke();
        } else if (vizType === 'circle') {
           const cx = width / 2;
           const cy = height / 2;
           const radius = Math.min(width, height) * 0.3; // 30% of smallest dimension
           
           for (let i = 0; i < bufferLength; i += 10) { 
             const barHeight = (dataArray[i] / 255) * (radius * 0.5);
             const rads = (Math.PI * 2) * (i / bufferLength);
             
             const x_end = cx + Math.cos(rads) * (radius + barHeight);
             const y_end = cy + Math.sin(rads) * (radius + barHeight);
             const x_start = cx + Math.cos(rads) * radius;
             const y_start = cy + Math.sin(rads) * radius;
             
             ctx.beginPath();
             ctx.moveTo(x_start, y_start);
             ctx.lineTo(x_end, y_end);
             ctx.stroke();
           }
        } else {
          // Spectrum (Default)
          const barWidth = (width / bufferLength) * 2.5;
          const maxH = height * 0.3; // 30% of height
          
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * maxH;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
          }
        }
      }

      // 4. Draw Text
      // Scale font relative to 1080p baseline
      const fontScale = canvas.height / 1080;
      const titleFont = `bold ${64 * fontScale}px Inter, sans-serif`;
      const artistFont = `${48 * fontScale}px Inter, sans-serif`;
      const margin = 50 * fontScale;

      ctx.fillStyle = textColor;
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      let tx = width / 2;
      let ty = height / 2;
      let align: CanvasTextAlign = 'center';

      // Parse Position
      if (textPosition === 'bottom') {
        ty = height - (height * 0.15);
      } else if (textPosition === 'top') {
        ty = height * 0.15;
      } else if (textPosition.includes('left')) {
        tx = width * 0.05;
        align = 'left';
        ty = textPosition.includes('top') ? height * 0.15 : height - (height * 0.15);
      } else if (textPosition.includes('right')) {
        tx = width * 0.95;
        align = 'right';
        ty = textPosition.includes('top') ? height * 0.15 : height - (height * 0.15);
      }

      ctx.textAlign = align;

      // Title
      ctx.font = titleFont;
      ctx.fillText(title, tx, ty - (margin / 2));

      // Artist
      ctx.font = artistFont;
      ctx.fillText(artist, tx, ty + (margin / 2));

      // Restore shadow
      ctx.shadowColor = 'transparent';

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, vizType, barColor, textColor, title, artist, resolution, textPosition, bgUrl, bgType]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      aspectRatio: aspectRatio,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain',
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
   }
   
   const r = Math.min(w / iw, h / ih);
   let nw = iw * r;   // new prop. width
   let nh = ih * r;   // new prop. height
   let ar = 1;

   // decide which gap to fill    
   if (nw < w) ar = w / nw;                             
   if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
   nw *= ar;
   nh *= ar;

   // calc source rectangle
   const cw = iw / (nw / w);
   const ch = ih / (nh / h);

   const cx = (iw - cw) * 0.5;
   const cy = (ih - ch) * 0.5;

   ctx.drawImage(img, cx, cy, cw, ch,  0, 0, w, h);
}