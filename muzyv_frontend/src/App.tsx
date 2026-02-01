import { useState, useRef, useEffect } from 'react';
import { Upload, Music, Image as ImageIcon, Play, Pause, Settings, Download, Monitor } from 'lucide-react';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { Visualizer } from './components/Visualizer';
import './App.css';

function App() {
  // State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgType, setBgType] = useState<'image' | 'video' | 'none'>('none');
  
  // Customization
  const [title, setTitle] = useState('Unknown Track');
  const [artist, setArtist] = useState('Never Ending Loop');
  const [vizType, setVizType] = useState('spectrum');
  const [textColor, setTextColor] = useState('#ffffff');
  const [barColor, setBarColor] = useState('#ffffff');
  const [resolution, setResolution] = useState('1920x1080');
  const [textPosition, setTextPosition] = useState('center');

  // App State
  const [rendering, setRendering] = useState(false);
  const [status, setStatus] = useState('');

  // Audio Hook
  const { 
    analyser, 
    togglePlay, 
    isPlaying, 
    audioElement, 
    audioContext, 
    sourceNode,
    resetAudioForRecording,
    restoreAudioAfterRecording
  } = useAudioAnalyzer(audioFile);

  // File Inputs
  const audioInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle Background Upload
  useEffect(() => {
    if (bgFile) {
      const url = URL.createObjectURL(bgFile);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBgUrl(url);
      
      // Determine type
      if (bgFile.type.startsWith('video')) {
        setBgType('video');
      } else {
        setBgType('image');
      }

      return () => URL.revokeObjectURL(url);
    }
    setBgUrl(null);
    setBgType('none');
  }, [bgFile]);

  const handleStartRecording = async () => {
    if (!audioFile || !audioElement || !canvasRef.current || !audioContext || !sourceNode) {
      alert('Please select audio and ensure it is loaded.');
      return;
    }

    setRendering(true);
    setStatus('Recording in progress... Do not switch tabs!');

    try {
      // 1. Setup Audio Routing for Recording
      const dest = audioContext.createMediaStreamDestination();
      sourceNode.connect(dest);
      
      // 2. Get Canvas Stream
      const canvasStream = canvasRef.current.captureStream(30); // 30 FPS
      
      // 3. Combine Streams
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      // 4. Setup Recorder
      const options = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm'; // Fallback
      }
      
      const recorder = new MediaRecorder(combinedStream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Download
        const a = document.createElement('a');
        a.href = url;
        a.download = `render_${audioFile.name}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setRendering(false);
        setStatus('Export complete!');
        
        // Restore Loop
        restoreAudioAfterRecording();
      };

      // 5. Start Recording Logic
      resetAudioForRecording();
      
      recorder.start();
      
      // We must resume context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      await audioElement.play();

      // Stop when audio ends
      audioElement.addEventListener('ended', () => {
        recorder.stop();
      }, { once: true });

    } catch (e: unknown) {
      console.error(e);
      setStatus('Error: ' + (e instanceof Error ? e.message : String(e)));
      setRendering(false);
    }
  };

  const resolutionOptions = [
    { label: '16:9 Landscape (1920x1080)', value: '1920x1080' },
    { label: '9:16 Portrait (1080x1920)', value: '1080x1920' },
    { label: '1:1 Square (1080x1080)', value: '1080x1080' },
    { label: '4:5 Social (1080x1350)', value: '1080x1350' },
  ];

  const positionOptions = [
    { label: 'Center', value: 'center' },
    { label: 'Top Center', value: 'top' },
    { label: 'Bottom Center', value: 'bottom' },
    { label: 'Top Left', value: 'top_left' },
    { label: 'Top Right', value: 'top_right' },
    { label: 'Bottom Left', value: 'bottom_left' },
    { label: 'Bottom Right', value: 'bottom_right' },
  ];

  const vizOptions = [
    { label: 'Spectrum Bars', value: 'spectrum' },
    { label: 'Line Wave', value: 'wave' },
    { label: 'Centered Wave', value: 'wave_center' },
    { label: 'Circular', value: 'circle' },
    { label: 'Lissajous (Ave)', value: 'ave' },
    { label: 'Spectrogram', value: 'spectrogram' },
  ];

  return (
    <div className="app-container">
      {/* Sidebar Controls */}
      <aside className="sidebar">
        <div className="logo">
          <Music className="icon" />
          <h1>Muzyv</h1>
        </div>

        <div className="scroll-content">
          {/* Section 1: Assets */}
          <section className="control-group">
            <h3><Upload size={16} /> Assets</h3>
            
            <div className="upload-box" onClick={() => audioInputRef.current?.click()}>
              <input 
                type="file" 
                accept="audio/*" 
                hidden 
                ref={audioInputRef} 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAudioFile(file);
                    setTitle(file.name.replace(/\.[^/.]+$/, ""));
                  }
                }}
              />
              <div className="upload-label">
                <Music size={20} />
                <span>{audioFile ? audioFile.name : 'Upload Audio (MP3)'}</span>
              </div>
            </div>

            <div className="upload-box" onClick={() => bgInputRef.current?.click()}>
              <input 
                type="file" 
                accept="image/*,video/*" 
                hidden 
                ref={bgInputRef}
                onChange={(e) => setBgFile(e.target.files?.[0] || null)}
              />
              <div className="upload-label">
                <ImageIcon size={20} />
                <span>{bgFile ? bgFile.name : 'Upload Background (Img/Vid)'}</span>
              </div>
            </div>
          </section>

          {/* Section 2: Layout */}
          <section className="control-group">
            <h3><Monitor size={16} /> Layout</h3>
            
            <label>Resolution / Aspect Ratio</label>
            <select 
              value={resolution} 
              onChange={(e) => setResolution(e.target.value)}
              className="select-input"
            >
              {resolutionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <label>Visualizer Style</label>
            <div className="viz-options-grid">
              {vizOptions.map((opt) => (
                <button 
                  key={opt.value}
                  className={`viz-btn ${vizType === opt.value ? 'active' : ''}`}
                  onClick={() => setVizType(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label style={{marginTop: '1rem'}}>Bar Color</label>
            <input type="color" value={barColor} onChange={(e) => setBarColor(e.target.value)} />
          </section>

          {/* Section 3: Text & Overlays */}
          <section className="control-group">
            <h3><Settings size={16} /> Text & Overlays</h3>
            
            <label>Title Text</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />

            <label>Artist Text</label>
            <input 
              type="text" 
              value={artist} 
              onChange={(e) => setArtist(e.target.value)} 
            />

            <div className="row-2-col">
              <div>
                <label>Position</label>
                <select 
                  value={textPosition} 
                  onChange={(e) => setTextPosition(e.target.value)}
                  className="select-input"
                >
                  {positionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Text Color</label>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
              </div>
            </div>
          </section>
        </div>

        <div className="footer-actions">
          <button
            className="btn-primary"
            onClick={handleStartRecording}
            disabled={rendering || !audioFile}
          >
            {rendering ? 'Recording...' : (
              <>
                <Download size={18} /> Export Video
              </>
            )}
          </button>
          {status && <p className="status-text">{status}</p>}
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="main-preview">
        <div className="canvas-wrapper">
          <Visualizer 
            ref={canvasRef}
            analyser={analyser} 
            bgUrl={bgUrl} 
            bgType={bgType}
            vizType={vizType}
            barColor={barColor}
            textColor={textColor}
            title={title}
            artist={artist}
            resolution={resolution}
            textPosition={textPosition}
          />
          
          {/* Playback Overlay - Hidden during recording/rendering logic is automatic */}
          <div className="playback-controls">
            {!rendering && (
              <button 
                className="play-btn" 
                onClick={togglePlay}
                disabled={!audioFile}
              >
                {isPlaying ? <Pause fill="white" /> : <Play fill="white" />}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
