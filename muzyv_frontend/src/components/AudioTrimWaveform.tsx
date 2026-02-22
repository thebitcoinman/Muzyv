import { useEffect, useRef, useMemo, memo } from 'react';

interface AudioTrimWaveformProps {
  buffer: AudioBuffer | null;
  startTime: number;
  endTime: number;
  currentTime: number;
  onSeek: (time: number) => void;
  zoomMode?: 'start' | 'end' | 'full';
}

export const AudioTrimWaveform = memo(({ 
  buffer, 
  startTime, 
  endTime, 
  currentTime, 
  onSeek,
  zoomMode = 'full'
}: AudioTrimWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Pre-calculate peaks for the waveform (High res for zooming support)
  // We'll calculate 2000 points to ensure it stays sharp when zoomed
  const allPeaks = useMemo(() => {
    if (!buffer) return null;
    const width = 2000; 
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const result = [];
    
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      const startIdx = i * step;
      for (let j = 0; j < step; j++) {
        const datum = data[startIdx + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      result.push({ min, max });
    }
    return result;
  }, [buffer]);

  // 2. Draw logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !buffer || !allPeaks) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const amp = height / 2;

    // Clear background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Zoom Calculation
    // Default: full track (0 to duration)
    let viewStart = 0;
    let viewEnd = buffer.duration;

    if (zoomMode === 'start') {
      // Zoom into first 20% or a window around start
      viewEnd = Math.min(buffer.duration, Math.max(10, startTime + 10));
      viewStart = Math.max(0, startTime - 5);
    } else if (zoomMode === 'end') {
      // Zoom into last 20% or window around end
      viewStart = Math.max(0, Math.min(endTime - 10, buffer.duration - 10));
      viewEnd = Math.min(buffer.duration, endTime + 5);
    }

    const viewDuration = viewEnd - viewStart;

    // Helper to convert time to pixel X
    const timeToX = (t: number) => ((t - viewStart) / viewDuration) * width;

    // Draw the waveform
    ctx.lineWidth = 1;
    
    for (let i = 0; i < width; i++) {
      const timeAtPixel = viewStart + (i / width) * viewDuration;
      const peakIdx = Math.floor((timeAtPixel / buffer.duration) * (allPeaks.length - 1));
      const peak = allPeaks[peakIdx];
      if (!peak) continue;

      const x = i;
      const isActive = timeAtPixel >= startTime && timeAtPixel <= endTime;

      if (isActive) {
        ctx.strokeStyle = '#a78bfa'; // violet-400 (Kept)
      } else {
        ctx.strokeStyle = '#450a0a'; // dark red (Cut)
      }

      ctx.beginPath();
      ctx.moveTo(x, (1 + peak.min) * amp);
      ctx.lineTo(x, (1 + peak.max) * amp);
      ctx.stroke();
    }

    // Draw Trim Indicators (Overlays)
    const startX = timeToX(startTime);
    const endX = timeToX(endTime);

    // Left Cut Overlay (Reddish)
    if (startX > 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; 
      ctx.fillRect(0, 0, startX, height);
      // Edge line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(startX, 0); ctx.lineTo(startX, height); ctx.stroke();
    }

    // Right Cut Overlay (Reddish)
    if (endX < width) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(endX, 0, width - endX, height);
      // Edge line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(endX, 0); ctx.lineTo(endX, height); ctx.stroke();
    }

    // Draw the playhead (only if in view)
    const currentX = timeToX(currentTime);
    if (currentX >= 0 && currentX <= width) {
      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, height);
      ctx.stroke();
      
      // Playhead head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(currentX, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Zoom Label
    if (zoomMode !== 'full') {
      ctx.fillStyle = '#a78bfa';
      ctx.font = '10px sans-serif';
      ctx.fillText(`Zoomed: ${zoomMode.toUpperCase()}`, 5, 12);
    }

  }, [buffer, allPeaks, startTime, endTime, currentTime, zoomMode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !buffer) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    let viewStart = 0;
    let viewEnd = buffer.duration;
    if (zoomMode === 'start') {
      viewEnd = Math.min(buffer.duration, Math.max(10, startTime + 10));
      viewStart = Math.max(0, startTime - 5);
    } else if (zoomMode === 'end') {
      viewStart = Math.max(0, Math.min(endTime - 10, buffer.duration - 10));
      viewEnd = Math.min(buffer.duration, endTime + 5);
    }
    
    const time = viewStart + (x / rect.width) * (viewEnd - viewStart);
    onSeek(time);
  };

  return (
    <div className="waveform-container" style={{ width: '100%', height: '100px', background: '#000', borderRadius: '6px', border: '1px solid #333', overflow: 'hidden', cursor: 'crosshair', marginBottom: '1rem', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={100} 
        style={{ width: '100%', height: '100%' }}
        onClick={handleCanvasClick}
      />
    </div>
  );
});