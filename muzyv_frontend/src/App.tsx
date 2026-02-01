import { useState, useRef, useEffect } from 'react';
import { Upload, Music, Image as ImageIcon, Play, Pause, Download, Type, Shuffle, Sliders, Zap, Wand2, Layers, Move, Loader2, Square, LayoutTemplate, Film } from 'lucide-react';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { Visualizer } from './components/Visualizer';
import './App.css';

// Massive Font List
const FONT_OPTIONS = [
  { label: 'Inter (Modern)', value: 'Inter' },
  { label: 'Roboto Mono (Tech)', value: 'Roboto Mono' },
  { label: 'Playfair (Classy)', value: 'Playfair Display' },
  { label: 'Montserrat (Bold)', value: 'Montserrat' },
  { label: 'Permanent Marker (Fun)', value: 'Permanent Marker' },
  { label: 'Audiowide (Future)', value: 'Audiowide' },
  { label: 'Bangers (Comic)', value: 'Bangers' },
  { label: 'Cinzel (Cinematic)', value: 'Cinzel' },
  { label: 'Comfortaa (Rounded)', value: 'Comfortaa' },
  { label: 'Creepster (Horror)', value: 'Creepster' },
  { label: 'Dancing Script (Hand)', value: 'Dancing Script' },
  { label: 'Eczar (Sharp)', value: 'Eczar' },
  { label: 'Fugaz One (Italic)', value: 'Fugaz One' },
  { label: 'Gloria Hallelujah', value: 'Gloria Hallelujah' },
  { label: 'Great Vibes', value: 'Great Vibes' },
  { label: 'Lobster (Retro)', value: 'Lobster' },
  { label: 'Monoton (Disco)', value: 'Monoton' },
  { label: 'Orbitron (SciFi)', value: 'Orbitron' },
  { label: 'Oswald (Tall)', value: 'Oswald' },
  { label: 'Pacifico (Brush)', value: 'Pacifico' },
  { label: 'Press Start 2P (Pixel)', value: 'Press Start 2P' },
  { label: 'Righteous', value: 'Righteous' },
  { label: 'Russo One (Strong)', value: 'Russo One' },
  { label: 'Sacramento', value: 'Sacramento' },
  { label: 'Shadows Into Light', value: 'Shadows Into Light' },
  { label: 'Special Elite (Type)', value: 'Special Elite' },
  { label: 'Syncopate', value: 'Syncopate' },
  { label: 'Ultra (Heavy)', value: 'Ultra' },
  { label: 'VT323 (Terminal)', value: 'VT323' },
  { label: 'Abril Fatface', value: 'Abril Fatface' },
  { label: 'Alfa Slab One', value: 'Alfa Slab One' },
  { label: 'Amatic SC', value: 'Amatic SC' },
  { label: 'Anton', value: 'Anton' },
  { label: 'Bebas Neue', value: 'Bebas Neue' },
  { label: 'Black Ops One', value: 'Black Ops One' },
  { label: 'Bowlby One SC', value: 'Bowlby One SC' },
  { label: 'Bungee Shade', value: 'Bungee Shade' },
  { label: 'Cabin Sketch', value: 'Cabin Sketch' },
  { label: 'Carter One', value: 'Carter One' },
  { label: 'Caveat', value: 'Caveat' },
  { label: 'Chewy', value: 'Chewy' },
  { label: 'Contrail One', value: 'Contrail One' },
  { label: 'Cookie', value: 'Cookie' },
  { label: 'Courgette', value: 'Courgette' },
  { label: 'Covered By Your Grace', value: 'Covered By Your Grace' },
  { label: 'Electrolize', value: 'Electrolize' },
  { label: 'Exo 2', value: 'Exo 2' },
  { label: 'Faster One', value: 'Faster One' },
  { label: 'Finger Paint', value: 'Finger Paint' },
  { label: 'Fjalla One', value: 'Fjalla One' },
  { label: 'Grand Hotel', value: 'Grand Hotel' },
  { label: 'Gruppo', value: 'Gruppo' },
  { label: 'Handlee', value: 'Handlee' },
  { label: 'Indie Flower', value: 'Indie Flower' },
  { label: 'Josefin Sans', value: 'Josefin Sans' },
  { label: 'Kaushan Script', value: 'Kaushan Script' },
  { label: 'Lobster Two', value: 'Lobster Two' },
  { label: 'Luckiest Guy', value: 'Luckiest Guy' },
  { label: 'Megrim', value: 'Megrim' },
  { label: 'New Rocker', value: 'New Rocker' },
  { label: 'Patrick Hand', value: 'Patrick Hand' },
  { label: 'Poiret One', value: 'Poiret One' },
  { label: 'Quicksand', value: 'Quicksand' },
  { label: 'Racing Sans One', value: 'Racing Sans One' },
  { label: 'Rajdhani', value: 'Rajdhani' },
  { label: 'Reenie Beanie', value: 'Reenie Beanie' },
  { label: 'Rock Salt', value: 'Rock Salt' },
  { label: 'Satisfy', value: 'Satisfy' },
  { label: 'Sigmar One', value: 'Sigmar One' },
  { label: 'Teko', value: 'Teko' },
  { label: 'Titan One', value: 'Titan One' },
  { label: 'Unica One', value: 'Unica One' },
  { label: 'Wallpoet', value: 'Wallpoet' },
  { label: 'Yellowtail', value: 'Yellowtail' },
].sort((a, b) => a.label.localeCompare(b.label));

const PRESET_POSITIONS = [
  { label: 'Center', value: 'center' },
  { label: 'Center Top', value: 'top' },
  { label: 'Center Bottom', value: 'bottom' },
  { label: 'Top Left', value: 'top_left' },
  { label: 'Top Right', value: 'top_right' },
  { label: 'Bottom Left', value: 'bottom_left' },
  { label: 'Bottom Right', value: 'bottom_right' },
];

function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'media' | 'viz' | 'text' | 'effects' | 'render'>('media');

  // State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgType, setBgType] = useState<'image' | 'video' | 'none'>('none');
  
  // Customization
  const [title, setTitle] = useState('Unknown Track');
  const [artist, setArtist] = useState('Never Ending Loop');
  const [vizType, setVizType] = useState('spectrum');
  const [barColor, setBarColor] = useState('#ffffff');
  const [barColorEnd, setBarColorEnd] = useState('#8b5cf6');
  const [useGradient, setUseGradient] = useState(false);
  const [textColor, setTextColor] = useState('#ffffff');
  const [resolution, setResolution] = useState('1920x1080');
  
  // Advanced Viz Settings
  const [sensitivity, setSensitivity] = useState(1.0);
  const [smartSensitivity, setSmartSensitivity] = useState(true);
  const [vizScale, setVizScale] = useState(1.0);
  const [vizRotation, setVizRotation] = useState(0);
  const [vizPlacement, setVizPlacement] = useState('center'); // center, bottom, top
  const [vizMirror, setVizMirror] = useState('none'); // none, x, y, xy

  // Effects
  const [yoyoMode, setYoyoMode] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [rgbShiftIntensity, setRgbShiftIntensity] = useState(0);
  const [pixelate, setPixelate] = useState(false);
  const [vignette, setVignette] = useState(false);
  const [kaleidoscope, setKaleidoscope] = useState(false);
  const [scanlines, setScanlines] = useState(false);
  const [noise, setNoise] = useState(false);

  // Typography
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSizeScale, setFontSizeScale] = useState(1.0);
  const [textPosition, setTextPosition] = useState('center');

  // Render / Fades
  const [fadeInType, setFadeInType] = useState('none');
  const [fadeInDuration, setFadeInDuration] = useState(2);
  const [fadeOutType, setFadeOutType] = useState('none');
  const [fadeOutDuration, setFadeOutDuration] = useState(2);

  // App State
  const [rendering, setRendering] = useState(false);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Audio Hook
  const { 
    analyser, 
    togglePlay, 
    stop,
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

  // Randomize Function
  const handleRandomize = () => {
    // Random Font
    const randomFont = FONT_OPTIONS[Math.floor(Math.random() * FONT_OPTIONS.length)].value;
    setFontFamily(randomFont);
    setFontSizeScale(0.8 + Math.random() * 0.7);

    // Random Text Position
    const randomPreset = PRESET_POSITIONS[Math.floor(Math.random() * PRESET_POSITIONS.length)].value;
    setTextPosition(randomPreset);

    // Random Viz
    const vizOptions = ['spectrum', 'wave', 'wave_center', 'circle', 'mirror_spectrum', 'ring', 'bar_wave', 'dna', 'sphere', 'cubes', 'shockwave'];
    setVizType(vizOptions[Math.floor(Math.random() * vizOptions.length)]);
    
    // Viz Placement
    const vizPlaces = ['center', 'bottom', 'top'];
    setVizPlacement(vizPlaces[Math.floor(Math.random() * vizPlaces.length)]);

    // Mirror
    const mirrors = ['none', 'none', 'none', 'x', 'y', 'xy']; // bias towards none
    setVizMirror(mirrors[Math.floor(Math.random() * mirrors.length)]);

    // Random Colors
    const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setBarColor(randomColor());
    setBarColorEnd(randomColor());
    setUseGradient(Math.random() > 0.5);
    
    // Random Effects
    setGlitchIntensity(Math.random() > 0.9 ? Math.random() * 0.5 : 0);
    setRgbShiftIntensity(Math.random() > 0.9 ? Math.random() * 0.5 : 0);
    setPixelate(Math.random() > 0.95);
    setVignette(Math.random() > 0.5);
    setKaleidoscope(Math.random() > 0.95);
    setScanlines(Math.random() > 0.8);
    setNoise(Math.random() > 0.8);
  };

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

      // Randomize setup when new BG is loaded (and Audio exists)
      if (audioFile) {
        handleRandomize();
      }

      return () => URL.revokeObjectURL(url);
    }
    setBgUrl(null);
    setBgType('none');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgFile]);

  // Handle Audio Upload
  useEffect(() => {
    if (audioFile && bgFile) {
      handleRandomize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFile]);


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
        a.download = `muzyv_${audioFile.name}.webm`;
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
      const audioEl = audioElement;
      resetAudioForRecording();
      
      recorder.start();
      
      // We must resume context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      await audioEl.play();

      // Stop when audio ends
      audioEl.addEventListener('ended', () => {
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
  ];

  const vizOptions = [
    { label: 'Spectrum', value: 'spectrum' },
    { label: 'Wave', value: 'wave' },
    { label: 'Center Wave', value: 'wave_center' },
    { label: 'Circular', value: 'circle' },
    { label: 'Mirror Spec', value: 'mirror_spectrum' },
    { label: 'Particle Ring', value: 'ring' },
    { label: 'Bar Wave', value: 'bar_wave' },
    { label: 'DNA', value: 'dna' },
    { label: 'Sphere', value: 'sphere' },
    { label: 'Cubes', value: 'cubes' },
    { label: 'Shockwave', value: 'shockwave' },
  ];

  const fadeOptions = [
    { label: 'None', value: 'none' },
    { label: 'Simple (Opacity)', value: 'simple' },
    { label: 'Pixel Dissolve', value: 'pixel' },
    { label: 'Blur Fade', value: 'blur' },
  ];

  return (
    <div className="app-container">
      {/* Sidebar Controls */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-text">
            <Music size={20} />
            <h1>Muzyv</h1>
          </div>
          <button className="btn-secondary" onClick={handleRandomize} style={{ width: 'auto', padding: '0.4rem 0.8rem' }} title="Surprise Me">
            <Shuffle size={14} /> Randomize
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="sidebar-tabs">
          <button className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>
            <Upload size={18} /> Media
          </button>
          <button className={`tab-btn ${activeTab === 'viz' ? 'active' : ''}`} onClick={() => setActiveTab('viz')}>
            <Sliders size={18} /> Viz
          </button>
          <button className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>
            <Type size={18} /> Text
          </button>
          <button className={`tab-btn ${activeTab === 'effects' ? 'active' : ''}`} onClick={() => setActiveTab('effects')}>
            <Wand2 size={18} /> FX
          </button>
          <button className={`tab-btn ${activeTab === 'render' ? 'active' : ''}`} onClick={() => setActiveTab('render')}>
            <Film size={18} /> Render
          </button>
        </div>

        <div className="scroll-content">
          {activeTab === 'media' && (
            <div className="control-section-content">
              <h3>Assets</h3>
              <div className="upload-grid">
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
                  <Music size={24} className="text-accent" />
                  <div className="upload-label">
                    <span>{audioFile ? 'Change Audio' : 'Upload Audio'}</span>
                    {audioFile && <span className="text-xs text-muted truncate max-w-full">{audioFile.name}</span>}
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
                  <ImageIcon size={24} className="text-accent" />
                  <div className="upload-label">
                    <span>{bgFile ? 'Change BG' : 'Upload BG'}</span>
                    {bgFile && <span className="text-xs text-muted truncate max-w-full">{bgFile.name}</span>}
                  </div>
                </div>
              </div>

              {/* Playback Controls in Menu */}
              <div style={{ marginTop: '1.5rem' }}>
                <h3>Playback Control</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button 
                    className={`btn-secondary ${isPlaying ? 'active' : ''}`}
                    onClick={togglePlay}
                    disabled={!audioFile}
                    style={{ backgroundColor: isPlaying ? 'var(--accent)' : 'var(--bg-input)', color: isPlaying ? 'white' : 'var(--text-main)' }}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />} 
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={stop}
                    disabled={!audioFile}
                  >
                    <Square size={16} fill="currentColor" /> Stop
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h3>Resolution</h3>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
                  {resolutionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {bgType === 'video' && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3>Video Playback</h3>
                   <label>
                     <span>Yo-Yo Loop (Ping Pong)</span>
                     <input 
                       type="checkbox" 
                       checked={yoyoMode} 
                       onChange={(e) => setYoyoMode(e.target.checked)} 
                     />
                   </label>
                   <div className="helper-text">
                     <Move size={12} style={{ display: 'inline', marginRight: 4 }} />
                     Processing required. Takes over UI.
                   </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'viz' && (
            <div className="control-section-content">
               <h3>Visualizer Style</h3>
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

              <div style={{ marginTop: '1.5rem' }}>
                <h3>Layout & Colors</h3>
                <label>
                  <span>Use Gradient</span>
                  <input type="checkbox" checked={useGradient} onChange={(e) => setUseGradient(e.target.checked)} />
                </label>
                
                <div className="row-2-col">
                   <div>
                     <label>Start Color</label>
                     <div className="color-picker-wrapper">
                       <input type="color" value={barColor} onChange={(e) => setBarColor(e.target.value)} />
                     </div>
                   </div>
                   {useGradient && (
                     <div>
                       <label>End Color</label>
                       <div className="color-picker-wrapper">
                         <input type="color" value={barColorEnd} onChange={(e) => setBarColorEnd(e.target.value)} />
                       </div>
                     </div>
                   )}
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label>Placement</label>
                  <select value={vizPlacement} onChange={(e) => setVizPlacement(e.target.value)}>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                    <option value="top">Top</option>
                  </select>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label>Mirror Effect</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem' }}>
                    {['none', 'x', 'y', 'xy'].map(m => (
                      <button 
                        key={m}
                        className={`btn-secondary ${vizMirror === m ? 'active' : ''}`}
                        onClick={() => setVizMirror(m)}
                        style={{ fontSize: '0.7rem', padding: '0.25rem' }}
                      >
                        {m.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h3>Transform</h3>
                <div className="row-2-col">
                  <div>
                    <label>Scale <span className="value">{vizScale.toFixed(1)}x</span></label>
                    <input type="range" min="0.1" max="2.0" step="0.1" value={vizScale} onChange={(e) => setVizScale(parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <label>Rotation <span className="value">{vizRotation}°</span></label>
                    <input type="range" min="0" max="360" value={vizRotation} onChange={(e) => setVizRotation(parseInt(e.target.value))} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h3>Sensitivity</h3>
                 <div className="row-2-col">
                  <div>
                    <label>Gain <span className="value">{sensitivity}x</span></label>
                    <input type="range" min="0.5" max="3.0" step="0.1" value={sensitivity} onChange={(e) => setSensitivity(parseFloat(e.target.value))} />
                  </div>
                 </div>
                 <div style={{ marginTop: '0.5rem' }}>
                    <label>
                      <span>Smart Sensitivity</span>
                      <input 
                        type="checkbox" 
                        checked={smartSensitivity} 
                        onChange={(e) => setSmartSensitivity(e.target.checked)} 
                      />
                    </label>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="control-section-content">
              <h3>Content</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  placeholder="Song Title"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
                <input 
                  type="text" 
                  placeholder="Artist Name"
                  value={artist} 
                  onChange={(e) => setArtist(e.target.value)} 
                />
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                 <h3>Typography</h3>
                 <label>Font Family</label>
                 <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                   {FONT_OPTIONS.map(f => (
                     <option key={f.value} value={f.value}>{f.label}</option>
                   ))}
                 </select>
                 
                 <div className="row-2-col" style={{ marginTop: '1rem' }}>
                   <div>
                     <label>Size <span className="value">{Math.round(fontSizeScale * 100)}%</span></label>
                     <input type="range" min="0.5" max="2.0" step="0.1" value={fontSizeScale} onChange={(e) => setFontSizeScale(parseFloat(e.target.value))} />
                   </div>
                   <div>
                     <label>Color</label>
                     <div className="color-picker-wrapper">
                        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                     </div>
                   </div>
                 </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h3>Placement</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {PRESET_POSITIONS.map(p => (
                    <button 
                      key={p.value} 
                      className={`btn-secondary ${textPosition === p.value ? 'active' : ''}`}
                      style={{ 
                        backgroundColor: textPosition === p.value ? 'var(--accent)' : '', 
                        color: textPosition === p.value ? 'white' : '',
                        borderColor: textPosition === p.value ? 'var(--accent)' : '',
                        fontSize: '0.7rem'
                      }}
                      onClick={() => setTextPosition(p.value)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="control-section-content">
               <h3><Layers size={16} /> Post-Processing</h3>
               <p className="helper-text">Effects react to music intensity.</p>
               
               <div style={{ marginTop: '1rem' }}>
                 <label>Glitch Intensity <span className="value">{Math.round(glitchIntensity * 100)}%</span></label>
                 <input type="range" min="0" max="1" step="0.01" value={glitchIntensity} onChange={(e) => setGlitchIntensity(parseFloat(e.target.value))} />
               </div>

               <div style={{ marginTop: '1rem' }}>
                 <label>Shake Intensity <span className="value">{Math.round(shakeIntensity * 100)}%</span></label>
                 <input type="range" min="0" max="1" step="0.01" value={shakeIntensity} onChange={(e) => setShakeIntensity(parseFloat(e.target.value))} />
               </div>

               <div style={{ marginTop: '1rem' }}>
                 <label>RGB Shift <span className="value">{Math.round(rgbShiftIntensity * 100)}%</span></label>
                 <input type="range" min="0" max="1" step="0.01" value={rgbShiftIntensity} onChange={(e) => setRgbShiftIntensity(parseFloat(e.target.value))} />
               </div>

               <div style={{ marginTop: '1.5rem' }}>
                 <h3>Filters</h3>
                 <div className="row-2-col">
                   <label>
                     <span>Pixelate</span>
                     <input type="checkbox" checked={pixelate} onChange={(e) => setPixelate(e.target.checked)} />
                   </label>
                   <label>
                     <span>Vignette</span>
                     <input type="checkbox" checked={vignette} onChange={(e) => setVignette(e.target.checked)} />
                   </label>
                 </div>
                 <div className="row-2-col">
                   <label>
                     <span>Kaleidoscope</span>
                     <input type="checkbox" checked={kaleidoscope} onChange={(e) => setKaleidoscope(e.target.checked)} />
                   </label>
                   <label>
                     <span>Scanlines</span>
                     <input type="checkbox" checked={scanlines} onChange={(e) => setScanlines(e.target.checked)} />
                   </label>
                 </div>
                 <div className="row-2-col">
                   <label>
                     <span>Noise</span>
                     <input type="checkbox" checked={noise} onChange={(e) => setNoise(e.target.checked)} />
                   </label>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'render' && (
            <div className="control-section-content">
              <h3><LayoutTemplate size={16} /> Fades & Transitions</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h4>Fade In (Start)</h4>
                <div className="row-2-col">
                  <div>
                    <label>Type</label>
                    <select value={fadeInType} onChange={(e) => setFadeInType(e.target.value)}>
                      {fadeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Duration <span className="value">{fadeInDuration}s</span></label>
                    <input type="range" min="0.5" max="5" step="0.5" value={fadeInDuration} onChange={(e) => setFadeInDuration(parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>

              <div>
                <h4>Fade Out (End)</h4>
                <div className="row-2-col">
                  <div>
                    <label>Type</label>
                    <select value={fadeOutType} onChange={(e) => setFadeOutType(e.target.value)}>
                      {fadeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Duration <span className="value">{fadeOutDuration}s</span></label>
                    <input type="range" min="0.5" max="5" step="0.5" value={fadeOutDuration} onChange={(e) => setFadeOutDuration(parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <h3>Output</h3>
                <button
                  className="btn-primary"
                  onClick={handleStartRecording}
                  disabled={rendering || !audioFile || isProcessing}
                >
                  {rendering ? 'Processing...' : (
                    <>
                      <Download size={18} /> Export Video
                    </>
                  )}
                </button>
                {status && <p className="status-text">{status}</p>}
              </div>
            </div>
          )}
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
            barColorEnd={barColorEnd}
            useGradient={useGradient}
            textColor={textColor}
            title={title}
            artist={artist}
            resolution={resolution}
            textPosition={textPosition}
            fontFamily={fontFamily}
            fontSizeScale={fontSizeScale}
            sensitivity={sensitivity}
            smartSensitivity={smartSensitivity}
            vizScale={vizScale}
            vizRotation={vizRotation}
            vizPlacement={vizPlacement}
            vizMirror={vizMirror}
            glitchIntensity={glitchIntensity}
            shakeIntensity={shakeIntensity}
            rgbShiftIntensity={rgbShiftIntensity}
            pixelate={pixelate}
            vignette={vignette}
            kaleidoscope={kaleidoscope}
            scanlines={scanlines}
            noise={noise}
            yoyoMode={yoyoMode}
            isPlaying={isPlaying}
            onProcessingChange={setIsProcessing}
            fadeInType={fadeInType}
            fadeInDuration={fadeInDuration}
            fadeOutType={fadeOutType}
            fadeOutDuration={fadeOutDuration}
            audioElement={audioElement}
          />
          
          <div className="playback-controls">
            {/* Controls hidden in preview to not obstruct, only show simple state */}
          </div>

          {/* Processing Overlay - Global */}
          {isProcessing && (
            <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[100] backdrop-blur-md" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
              <Loader2 className="animate-spin text-accent mb-6" size={64} />
              <h3 className="text-2xl font-bold mb-2 text-white">Processing Media</h3>
              <p className="text-muted text-lg">Creating seamless loop... Please wait.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;