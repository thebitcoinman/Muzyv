import { useState, useRef, useEffect } from 'react';
import { Music, Image as ImageIcon, Play, Pause, Shuffle, Loader2, Square, Zap, Type, Film, Sliders, Maximize, Move, Volume2, VolumeX, RefreshCw, Shield } from 'lucide-react';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { Visualizer } from './components/Visualizer';
import './App.css';

const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Roboto Mono', value: 'Roboto Mono' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Permanent Marker', value: 'Permanent Marker' },
  { label: 'Audiowide', value: 'Audiowide' },
  { label: 'Bangers', value: 'Bangers' },
  { label: 'Cinzel', value: 'Cinzel' },
  { label: 'Comfortaa', value: 'Comfortaa' },
  { label: 'Creepster', value: 'Creepster' },
  { label: 'Dancing Script', value: 'Dancing Script' },
  { label: 'Eczar', value: 'Eczar' },
  { label: 'Fugaz One', value: 'Fugaz One' },
  { label: 'Gloria Hallelujah', value: 'Gloria Hallelujah' },
  { label: 'Great Vibes', value: 'Great Vibes' },
  { label: 'Lobster', value: 'Lobster' },
  { label: 'Monoton', value: 'Monoton' },
  { label: 'Orbitron', value: 'Orbitron' },
  { label: 'Oswald', value: 'Oswald' },
  { label: 'Pacifico', value: 'Pacifico' },
  { label: 'Press Start 2P', value: 'Press Start 2P' },
  { label: 'Righteous', value: 'Righteous' },
  { label: 'Russo One', value: 'Russo One' },
  { label: 'Sacramento', value: 'Sacramento' },
  { label: 'Shadows Into Light', value: 'Shadows Into Light' },
  { label: 'Special Elite', value: 'Special Elite' },
  { label: 'Syncopate', value: 'Syncopate' },
  { label: 'Ultra', value: 'Ultra' },
  { label: 'VT323', value: 'VT323' },
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
  { label: 'DotGothic16', value: 'DotGothic16' },
  { label: 'Major Mono Display', value: 'Major Mono Display' },
  { label: 'Michroma', value: 'Michroma' },
  { label: 'Monofett', value: 'Monofett' },
  { label: 'Nabla', value: 'Nabla' },
  { label: 'Notable', value: 'Notable' },
  { label: 'Nova Mono', value: 'Nova Mono' },
  { label: 'Pixelify Sans', value: 'Pixelify Sans' },
  { label: 'Platypi', value: 'Platypi' },
  { label: 'Silkscreen', value: 'Silkscreen' },
  { label: 'Stalinist One', value: 'Stalinist One' },
  { label: 'Syne Mono', value: 'Syne Mono' },
  { label: 'Zain', value: 'Zain' },
].sort((a, b) => a.label.localeCompare(b.label));

const PRESET_POSITIONS = [
  { label: 'Center', value: 'center' },
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'T-Left', value: 'top_left' },
  { label: 'T-Right', value: 'top_right' },
  { label: 'B-Left', value: 'bottom_left' },
  { label: 'B-Right', value: 'bottom_right' },
];

const VIZ_OPTIONS = [
  { label: '1. Spectrum Bars', value: 'spectrum' },
  { label: '2. Mirror Spectrum', value: 'mirror_spectrum' },
  { label: '3. 3D Floor Bars', value: 'bars_3d' },
  { label: '4. Bar Rain', value: 'bar_rain' },
  { label: '5. Cyber City', value: 'cyber_city' },
  { label: '6. Pixel Blocks', value: 'pixel_blocks' },
  { label: '7. Digital Rain', value: 'digital_rain' },
  { label: '8. LED Wall', value: 'led_wall' },
  { label: '9. Segmented Bar', value: 'segmented_bar' },
  { label: '10. Classic Wave', value: 'wave' },
  { label: '11. Dual Wave', value: 'dual_wave' },
  { label: '12. Wave Ribbon', value: 'ribbon' },
  { label: '13. Spectrum Wave', value: 'spectrum_wave' },
  { label: '14. Lightning', value: 'lightning' },
  { label: '15. Glitch Vines', value: 'glitch_vines' },
  { label: '16. Heartbeat (EKG)', value: 'heartbeat' },
  { label: '17. Cosmic Strings', value: 'cosmic_strings' },
  { label: '18. Seismic', value: 'seismic' },
  { label: '19. Circular Spectrum', value: 'circle' },
  { label: '20. Concentric Rings', value: 'ring' },
  { label: '21. Pulse Circle', value: 'pulse' },
  { label: '22. Radial Iris', value: 'radial_spectrum' },
  { label: '23. Audio Rings', value: 'audio_rings' },
  { label: '24. Cyber Rings', value: 'rings_cyber' },
  { label: '25. Spiral Galaxy', value: 'spiral' },
  { label: '26. Orbitals', value: 'orbitals' },
  { label: '27. Radar Scan', value: 'radar' },
  { label: '28. Mandala', value: 'mandala' },
  { label: '29. 3D Cubes', value: 'cubes_3d' },
  { label: '30. 3D Sphere', value: 'sphere_3d' },
  { label: '31. 3D Tunnel', value: 'tunnel_3d' },
  { label: '32. Neon Grid', value: 'neon_grid' },
  { label: '33. Hexagon Grid', value: 'hexagon' },
  { label: '34. Polygon World', value: 'poly_world' },
  { label: '35. Pyramids', value: 'pyramids' },
  { label: '36. Crystal', value: 'crystal' },
  { label: '37. Starfield', value: 'starfield' },
  { label: '38. Particles', value: 'particles' },
  { label: '39. Shockwave', value: 'shockwave' },
  { label: '40. Gravity Well', value: 'gravity_well' },
  { label: '41. Star Burst', value: 'star_burst' },
  { label: '42. Vortex', value: 'vortex' },
  { label: '43. Vector Field', value: 'vector_field' },
  { label: '44. Swarm', value: 'swarm' },
  { label: '45. DNA Helix', value: 'dna' },
  { label: '46. Lava Lamp', value: 'lava' },
  { label: '47. Plasma Ball', value: 'plasma' },
  { label: '48. Fractal Tree', value: 'fractal_tree' },
  { label: '49. Floating Orbs', value: 'floating_orbs' },
  { label: '50. Liquid Flow', value: 'liquid_flow' },
  { label: '51. Aurora', value: 'aurora' },
  { label: '52. Deep Sea', value: 'deep_sea' },
  { label: '53. Abstract Clouds', value: 'abstract_clouds' },
  { label: '54. Solar Flare', value: 'solar_flare' },
  { label: '55. Kaleido Mesh', value: 'kaleido_mesh' },
  { label: '56. Techno Wires', value: 'techno_wires' },
  { label: '57. Neural Net', value: 'neural_net' },
  { label: '58. Matrix Rain', value: 'matrix' },
  { label: '59. Fire', value: 'fire' },
];

const FADE_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Opacity', value: 'simple' },
  { label: 'To Black', value: 'black' },
  { label: 'To White', value: 'white' },
  { label: 'Pixel Dissolve', value: 'pixel' },
  { label: 'Blur Fade', value: 'blur' },
];

const RESOLUTION_OPTIONS = [
  { label: '16:9 Landscape', value: '1920x1080' },
  { label: '9:16 Portrait', value: '1080x1920' },
  { label: '1:1 Square', value: '1080x1080' },
];

function App() {
  const [activeTab, setActiveTab] = useState<'media' | 'viz' | 'text' | 'effects' | 'render'>('media');

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgType, setBgType] = useState<'image' | 'video' | 'none'>('none');
  
  const [bgZoom, setBgZoom] = useState(1.0);
  const [bgOffsetX, setBgOffsetX] = useState(50);
  const [bgOffsetY, setBgOffsetY] = useState(50);
  const [bgRotation, setBgRotation] = useState(0);
  const [bgSpeed, setBgSpeed] = useState(1.0);
  const [bgBeatResponse, setBgBeatResponse] = useState(0.8);
  const [bgLoopMode, setBgLoopMode] = useState('cut');
  const [bgLoopDuration, setBgLoopDuration] = useState(1.0);

  const [defaultArtist, setDefaultArtist] = useState('Never Ending Loop');
  const [title, setTitle] = useState('Unknown Track');
  const [artist, setArtist] = useState('Never Ending Loop');
  const [vizType, setVizType] = useState('spectrum');
  const [barColor, setBarColor] = useState('#ffffff');
  const [barColorEnd, setBarColorEnd] = useState('#8b5cf6');
  const [useGradient, setUseGradient] = useState(false);
  const [vizGradientMotion, setVizGradientMotion] = useState(false);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textColorEnd, setTextColorEnd] = useState('#8b5cf6');
  const [useTextGradient, setUseTextGradient] = useState(false);
  const [textGradientMotion, setTextGradientMotion] = useState(false);
  const [resolution, setResolution] = useState('1920x1080');
  
  const [vizScale, setVizScale] = useState(1.0);
  const [vizRotation, setVizRotation] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [vizOffsetX, setVizOffsetX] = useState(50); 
  const [vizOffsetY, setVizOffsetY] = useState(95); 
  const [mirrorX, setMirrorX] = useState(false);
  const [mirrorY, setMirrorY] = useState(false);
  const [vizThickness, setVizThickness] = useState(2);
  const [vizOpacity, setVizOpacity] = useState(1.0);

  const [sensitivity, setSensitivity] = useState(1.0);
  const [smartSensitivity, setSmartSensitivity] = useState(true);

  const [lowCut, setLowCut] = useState(0);
  const [highCut, setHighCut] = useState(100);
  const [smartCut, setSmartCut] = useState(true);

  const [yoyoMode, setYoyoMode] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [rgbShiftIntensity, setRgbShiftIntensity] = useState(0);
  const [pixelate, setPixelate] = useState(false);
  const [vignette, setVignette] = useState(false);
  const [kaleidoscope, setKaleidoscope] = useState(false);
  const [scanlines, setScanlines] = useState(false);
  const [noise, setNoise] = useState(false);
  const [invert, setInvert] = useState(false);

  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSizeScale, setFontSizeScale] = useState(1.0);
  const [textPosition, setTextPosition] = useState('center');
  const [textOffsetX, setTextOffsetX] = useState(0);
  const [textOffsetY, setTextOffsetY] = useState(0);
  const [textMargin, setTextMargin] = useState(5);
  const [textGlow, setTextGlow] = useState(false);
  const [textOutline, setTextOutline] = useState(false);
  const [textReact, setTextReact] = useState('pulse'); 
  const [textSensitivity, setTextSensitivity] = useState(1.0);

  const [fadeInType, setFadeInType] = useState('none');
  const [fadeInDuration, setFadeInDuration] = useState(2);
  const [fadeOutType, setFadeOutType] = useState('none');
  const [fadeOutDuration, setFadeOutDuration] = useState(2);

  const [rendering, setRendering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [vizCollapsed, setVizCollapsed] = useState(false);

  const { 
    togglePlay, toggleMute, stop, isPlaying, isMuted, audioElement, audioContext, sourceNode, analyser,
    currentTime, duration, seek,
    resetAudioForRecording, restoreAudioAfterRecording
  } = useAudioAnalyzer(audioFile);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const getVizDefaults = (type: string) => {
    const def = { x: 50, y: 50, rot: 0, scale: 1.0, auto: false };
    const bottomTypes = [
      'spectrum', 'bars_3d', 'matrix', 'ribbon', 'bar_rain', 'spectrum_wave', 
      'cyber_city', 'mountain_view', 'pixel_blocks', 'aurora', 'deep_sea', 
      'abstract_clouds', 'led_wall', 'segmented_bar', 'seismic', 'fire'
    ];
    if (bottomTypes.includes(type)) def.y = 95;
    if (['starfield', 'neon_grid', 'star_burst', 'solar_flare'].includes(type)) def.scale = 1.5;
    if (['particles', 'plasma', 'floating_orbs', 'gravity_well', 'techno_wires', 'neural_net', 'vector_field', 'swarm'].includes(type)) def.scale = 1.2;
    if (['fractal_tree', 'mountain_view', 'abstract_clouds'].includes(type)) def.y = 85; 
    return def;
  };

  const handleSetVizType = (type: string) => {
    setVizType(type);
    const defaults = getVizDefaults(type);
    setVizOffsetX(defaults.x);
    setVizOffsetY(defaults.y);
    setVizRotation(defaults.rot);
    setVizScale(defaults.scale);
    setAutoRotate(false);
  };

  const handleRandomize = () => {
    const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setFontFamily(FONT_OPTIONS[Math.floor(Math.random() * FONT_OPTIONS.length)].value);
    setTextColor(randomColor());
    setTextColorEnd(randomColor());
    setUseTextGradient(Math.random() > 0.5);
    setTextGradientMotion(Math.random() > 0.7);
    setTextGlow(Math.random() > 0.7);
    setTextReact(['pulse', 'jitter', 'bounce', 'flash', 'glow', 'none'][Math.floor(Math.random() * 6)]);
    const randomType = VIZ_OPTIONS[Math.floor(Math.random() * VIZ_OPTIONS.length)].value;
    const defaults = getVizDefaults(randomType);
    setVizType(randomType);
    setBarColor(randomColor());
    setBarColorEnd(randomColor());
    setUseGradient(Math.random() > 0.5);
    setVizGradientMotion(Math.random() > 0.7);
    setVizThickness(1 + Math.random() * 6);
    setVizOpacity(0.6 + Math.random() * 0.4);
    setVizOffsetX(defaults.x);
    setVizOffsetY(defaults.y);
    setVizRotation(defaults.rot);
    setVizScale(defaults.scale);
    setAutoRotate(defaults.auto);
    setMirrorX(Math.random() > 0.8);
    setMirrorY(Math.random() > 0.9);
    const randomPos = PRESET_POSITIONS[Math.floor(Math.random() * PRESET_POSITIONS.length)].value;
    setTextPosition(randomPos);
    setFontSizeScale(0.8 + Math.random() * 0.5);
    setTextSensitivity(0.5 + Math.random() * 1.5);
    setVignette(Math.random() > 0.5);
    setGlitchIntensity(Math.random() > 0.9 ? 0.1 : 0);
    setShakeIntensity(Math.random() > 0.9 ? 0.1 : 0);
    setRgbShiftIntensity(Math.random() > 0.9 ? 0.1 : 0);
    setBgZoom(1.0);
    setBgRotation(0);
  };

  useEffect(() => {
    if (bgFile) {
      const url = URL.createObjectURL(bgFile);
      setBgUrl(url);
      setBgType(bgFile.type.startsWith('video') ? 'video' : 'image');
      return () => URL.revokeObjectURL(url);
    }
    setBgUrl(null); setBgType('none');
  }, [bgFile]);

  const [lowResourceExport, setLowResourceExport] = useState(false);
  const [safeRender, setSafeRender] = useState(false);

  const handleStartRecording = async () => {
    if (!audioFile || !audioElement || !canvasRef.current || !audioContext || !sourceNode) return;
    setRendering(true);
    try {
      audioElement.pause();
      audioElement.currentTime = 0;
      
      const dest = audioContext.createMediaStreamDestination();
      sourceNode.connect(dest);
      
      // If safeRender is on, we force a more compatible profile
      const types = (lowResourceExport || safeRender)
        ? ['video/webm;codecs=vp8,opus', 'video/webm']
        : ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
        
      const mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
      
      // Use natural capture stream without forced FPS for better hardware sync
      const canvasStream = canvasRef.current.captureStream(); 
      
      const recorder = new MediaRecorder(new MediaStream([
        ...canvasStream.getVideoTracks(), 
        ...dest.stream.getAudioTracks()
      ]), { 
        mimeType: mimeType || 'video/webm',
        videoBitsPerSecond: safeRender ? 2000000 : (lowResourceExport ? 4000000 : 8000000)
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { 
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        handleHardReset();
      };
      
      recorder.onstop = () => {
        if (chunks.length === 0) {
          setRendering(false);
          restoreAudioAfterRecording();
          return;
        }
        const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = `muzyv_${audioFile.name.replace(/\.[^/.]+$/, "")}.webm`; 
        a.click();
        
        sourceNode.disconnect(dest);
        stop();
        setRendering(false); 
        restoreAudioAfterRecording();
      };

      resetAudioForRecording(); 
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Start recorder without timeslice for maximum stability
      recorder.start(); 
      
      // Ensure audio is primed and ready
      audioElement.load();
      setTimeout(async () => {
        try {
          await audioElement.play();
          const onEnded = () => {
            audioElement.removeEventListener('ended', onEnded);
            if (recorder.state === 'recording') {
              setTimeout(() => recorder.stop(), 1000); 
            }
          };
          audioElement.addEventListener('ended', onEnded);
        } catch (playErr) {
          console.error("Playback failed during recording:", playErr);
          recorder.stop();
        }
      }, 500);

    } catch (e: unknown) { 
      console.error("Recording error:", e); 
      setRendering(false); 
      restoreAudioAfterRecording();
    }
  };

  const handleReset = () => {
    setVizType('spectrum');
    setBarColor('#ffffff');
    setBarColorEnd('#8b5cf6');
    setUseGradient(false);
    setVizGradientMotion(false);
    setTextColor('#ffffff');
    setTextColorEnd('#8b5cf6');
    setUseTextGradient(false);
    setTextGradientMotion(false);
    setVizScale(1.0);
    setVizRotation(0);
    setAutoRotate(false);
    setVizOffsetX(50);
    setVizOffsetY(95);
    setMirrorX(false);
    setMirrorY(false);
    setVizThickness(2);
    setVizOpacity(1.0);
    setSensitivity(1.0);
    setSmartSensitivity(true);
    setLowCut(0);
    setHighCut(100);
    setSmartCut(true);
    setGlitchIntensity(0);
    setShakeIntensity(0);
    setRgbShiftIntensity(0);
    setPixelate(false);
    setVignette(false);
    setKaleidoscope(false);
    setScanlines(false);
    setNoise(false);
    setInvert(false);
    setFontFamily('Inter');
    setFontSizeScale(1.0);
    setTextPosition('center');
    setTextOffsetX(0);
    setTextOffsetY(0);
    setTextMargin(5);
    setTextGlow(false);
    setTextOutline(false);
    setTextReact('pulse');
    setTextSensitivity(1.0);
    setFadeInType('none');
    setFadeOutType('none');
    setBgZoom(1.0);
    setBgRotation(0);
    setBgSpeed(1.0);
    setBgBeatResponse(0.8);
  };

  const handleHardReset = () => {
    stop();
    setAudioFile(null);
    setBgFile(null);
    setBgUrl(null);
    setBgType('none');
    setTitle('Unknown Track');
    setArtist('Never Ending Loop');
    setRendering(false);
    setIsProcessing(false);
    handleReset(); // Call existing reset for all other states
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (bgInputRef.current) bgInputRef.current.value = '';
    window.location.reload(); // Force a clean reload
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-text" onClick={handleReset} style={{ cursor: 'pointer' }} title="Click to Reset Defaults">
            <Music size={24} stroke="currentColor" />
            <h1>Muzyv</h1>
            <RefreshCw size={14} style={{ marginLeft: 4, opacity: 0.5 }} />
          </div>
          <button className="btn-secondary" onClick={handleHardReset} style={{ fontSize: '0.6rem', padding: '4px 8px', marginTop: '4px' }}>Hard Reset App</button>
          <div className="header-controls">
            <button className="btn-icon" onClick={togglePlay} disabled={!audioFile} title="Play/Pause">
              {isPlaying ? <Pause className="lucide-icon" size={20} stroke="white" strokeWidth={2.5} /> : <Play className="lucide-icon" size={20} stroke="white" strokeWidth={2.5} />}
            </button>
            <button className="btn-icon" onClick={toggleMute} disabled={!audioFile} title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <VolumeX className="lucide-icon" size={20} stroke="white" strokeWidth={2.5} /> : <Volume2 className="lucide-icon" size={20} stroke="white" strokeWidth={2.5} />}
            </button>
            <button className="btn-icon" onClick={stop} disabled={!audioFile} title="Stop">
              <Square className="lucide-icon" size={16} stroke="white" strokeWidth={2.5} />
            </button>
            <button className="btn-icon" onClick={handleRandomize} title="Randomize">
              <Shuffle className="lucide-icon" size={20} stroke="white" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="playback-bar-container">
          <div className="time-info">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input type="range" className="progress-slider" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={(e) => seek(parseFloat(e.target.value))} disabled={!audioFile} />
        </div>

        <div className="sidebar-tabs">
          <button className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}><ImageIcon size={14} /> Media</button>
          <button className={`tab-btn ${activeTab === 'viz' ? 'active' : ''}`} onClick={() => setActiveTab('viz')}><Sliders size={14} /> Viz</button>
          <button className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}><Type size={14} /> Text</button>
          <button className={`tab-btn ${activeTab === 'effects' ? 'active' : ''}`} onClick={() => setActiveTab('effects')}><Zap size={14} /> FX</button>
          <button className={`tab-btn ${activeTab === 'render' ? 'active' : ''}`} onClick={() => setActiveTab('render')}><Film size={14} /> Render</button>
        </div>

        <div className="scroll-content">
          {activeTab === 'media' && (
            <div className="control-section-content">
              <h3>Assets</h3>
              <div className="upload-grid">
                <div className="upload-box" onClick={() => audioInputRef.current?.click()}>
                  <input type="file" accept="audio/*" hidden ref={audioInputRef} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { 
                      setAudioFile(file); 
                      setTitle(file.name.replace(/\.[^/.]+$/, "")); 
                      handleRandomize();
                    }
                  }} />
                  <Music size={24} className="text-accent" />
                  <div className="upload-label"><span>{audioFile ? 'Change' : 'Audio'}</span></div>
                </div>
                <div className="upload-box" onClick={() => bgInputRef.current?.click()}>
                  <input type="file" accept="image/*,video/*" hidden ref={bgInputRef} onChange={(e) => setBgFile(e.target.files?.[0] || null)} />
                  <ImageIcon size={24} className="text-accent" />
                  <div className="upload-label"><span>{bgFile ? 'Change' : 'BG'}</span></div>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <h3><Maximize size={14} style={{marginRight: 8}}/> Background Control</h3>
                <div className="flex-col" style={{ gap: '1rem' }}>
                  <div className="flex-col">
                    <label className="label-row"><span>Zoom</span> <span className="value">{bgZoom.toFixed(2)}x</span></label>
                    <input type="range" min="1.0" max="3.0" step="0.05" value={bgZoom} onChange={(e) => setBgZoom(parseFloat(e.target.value))} />
                  </div>
                  <div className="row-2-col">
                    <div className="flex-col">
                      <label className="label-row"><span>X-Offset</span> <span className="value">{bgOffsetX}%</span></label>
                      <input type="range" min="0" max="100" value={bgOffsetX} onChange={(e) => setBgOffsetX(parseInt(e.target.value))} />
                    </div>
                    <div className="flex-col">
                      <label className="label-row"><span>Y-Offset</span> <span className="value">{bgOffsetY}%</span></label>
                      <input type="range" min="0" max="100" value={bgOffsetY} onChange={(e) => setBgOffsetY(parseInt(e.target.value))} />
                    </div>
                  </div>
                  <div className="flex-col">
                    <label className="label-row"><span>BG Rotation</span> <span className="value">{bgRotation}°</span></label>
                    <input type="range" min="0" max="360" value={bgRotation} onChange={(e) => setBgRotation(parseInt(e.target.value))} />
                  </div>
                  {(bgType === 'video') && (
                    <>
                      <div className="flex-col">
                        <label className="label-row"><span>BG Speed</span> <span className="value">{bgSpeed.toFixed(2)}x</span></label>
                        <input type="range" min="0.1" max="4.0" step="0.05" value={bgSpeed} onChange={(e) => setBgSpeed(parseFloat(e.target.value))} />
                      </div>
                      <div className="flex-col">
                        <label className="label-row"><span>Beat Response</span> <span className="value">{Math.round(bgBeatResponse * 100)}%</span></label>
                        <input type="range" min="0" max="1" step="0.01" value={bgBeatResponse} onChange={(e) => setBgBeatResponse(parseFloat(e.target.value))} />
                      </div>
                      <div className="flex-col">
                        <label className="label-row"><span>Loop Transition</span></label>
                        <select value={bgLoopMode} onChange={(e) => setBgLoopMode(e.target.value)}>
                          <option value="cut">Hard Cut</option>
                          <option value="fade">Cross-Fade (Dip)</option>
                          <option value="blur">Blur Seam</option>
                          <option value="zoom">Zoom Loop</option>
                          <option value="slide">Slide Transition</option>
                          <option value="ghost">Ghost Overlay</option>
                          <option value="glitch">Glitch Cut</option>
                          <option value="wash_black">Wash to Black</option>
                          <option value="wash_white">Wash to White</option>
                        </select>
                      </div>
                      {bgLoopMode !== 'cut' && (
                        <div className="flex-col">
                          <label className="label-row"><span>Transition Duration</span> <span className="value">{bgLoopDuration.toFixed(1)}s</span></label>
                          <input type="range" min="0.1" max="5.0" step="0.1" value={bgLoopDuration} onChange={(e) => setBgLoopDuration(parseFloat(e.target.value))} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              {bgType === 'video' && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div className="label-row">
                    <label>Seamless Loop (Yo-Yo)</label>
                    <input type="checkbox" checked={yoyoMode} onChange={(e) => setYoyoMode(e.target.checked)} />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'viz' && (
            <div className="control-section-content">
               <div className="section-header-toggle" onClick={() => setVizCollapsed(!vizCollapsed)}>
                 <h3>Visualizer Type</h3>
                 <span className="toggle-indicator">{vizCollapsed ? '+' : '−'}</span>
               </div>
               {!vizCollapsed && (
                 <div className="viz-options-grid">
                  {VIZ_OPTIONS.map((opt) => (
                    <button key={opt.value} className={`viz-btn ${vizType === opt.value ? 'active' : ''}`} onClick={() => handleSetVizType(opt.value)}>{opt.label}</button>
                  ))}
                </div>
               )}
              <div style={{ marginTop: '1.5rem' }}>
                <h3>EQ & Sensitivity</h3>
                <div className="row-2-col">
                   <div className="flex-col">
                     <label className="label-row"><span>Low Cut</span> <span className="value">{lowCut}%</span></label>
                     <input type="range" min="0" max="50" value={lowCut} onChange={(e) => setLowCut(parseInt(e.target.value))} />
                   </div>
                   <div className="flex-col">
                     <label className="label-row"><span>High Cut</span> <span className="value">{highCut}%</span></label>
                     <input type="range" min="50" max="100" value={highCut} onChange={(e) => setHighCut(parseInt(e.target.value))} />
                   </div>
                </div>
                <div className="row-2-col" style={{ marginTop: '1rem' }}>
                  <div className="flex-col">
                    <label className="label-row"><span>Gain</span> <span className="value">{sensitivity.toFixed(1)}x</span></label>
                    <input type="range" min="0.5" max="5.0" step="0.1" value={sensitivity} onChange={(e) => setSensitivity(parseFloat(e.target.value))} />
                  </div>
                  <div className="flex-col" style={{ justifyContent: 'flex-end' }}>
                    <label className="label-row"><span>Auto</span><input type="checkbox" checked={smartSensitivity} onChange={(e) => setSmartSensitivity(e.target.checked)} /></label>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <h3>Appearance</h3>
                <div className="row-2-col">
                   <div><label>Start</label><div className="color-picker-wrapper"><input type="color" value={barColor} onChange={(e) => setBarColor(e.target.value)} /></div></div>
                   {(useGradient || vizGradientMotion) && <div><label>End</label><div className="color-picker-wrapper"><input type="color" value={barColorEnd} onChange={(e) => setBarColorEnd(e.target.value)} /></div></div>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <label className="label-row"><span>Gradient</span><input type="checkbox" checked={useGradient} onChange={(e) => setUseGradient(e.target.checked)} /></label>
                  <label className="label-row"><span>Motion</span><input type="checkbox" checked={vizGradientMotion} onChange={(e) => setVizGradientMotion(e.target.checked)} /></label>
                </div>
                <div className="row-2-col" style={{ marginTop: '1rem' }}>
                   <div className="flex-col">
                     <label className="label-row"><span>Weight</span> <span className="value">{vizThickness}px</span></label>
                     <input type="range" min="1" max="20" value={vizThickness} onChange={(e) => setVizThickness(parseInt(e.target.value))} />
                   </div>
                   <div className="flex-col">
                     <label className="label-row"><span>Alpha</span> <span className="value">{Math.round(vizOpacity * 100)}%</span></label>
                     <input type="range" min="0.1" max="1.0" step="0.1" value={vizOpacity} onChange={(e) => setVizOpacity(parseFloat(e.target.value))} />
                   </div>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <h3><Move size={14} style={{marginRight: 8}}/> Transform</h3>
                <div className="row-2-col">
                  <div className="flex-col">
                    <label className="label-row"><span>Offset X</span> <span className="value">{vizOffsetX}%</span></label>
                    <input type="range" min="0" max="100" value={vizOffsetX} onChange={(e) => setVizOffsetX(parseInt(e.target.value))} />
                  </div>
                  <div className="flex-col">
                    <label className="label-row"><span>Offset Y</span> <span className="value">{vizOffsetY}%</span></label>
                    <input type="range" min="0" max="100" value={vizOffsetY} onChange={(e) => setVizOffsetY(parseInt(e.target.value))} />
                  </div>
                </div>
                <div className="flex-col" style={{ marginTop: '1rem' }}>
                  <div className="label-row">
                    <span>Rotation</span>
                    <label style={{display:'flex',alignItems:'center',gap:4,fontSize:'0.7em'}}>
                      Auto <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
                    </label>
                  </div>
                  <input type="range" min="0" max="360" value={vizRotation} onChange={(e) => setVizRotation(parseInt(e.target.value))} />
                </div>
                <div className="row-2-col" style={{ marginTop: '1rem' }}>
                  <div className="flex-col">
                    <label className="label-row"><span>Scale</span> <span className="value">{vizScale.toFixed(1)}x</span></label>
                    <input type="range" min="0.1" max="3.0" step="0.1" value={vizScale} onChange={(e) => setVizScale(parseFloat(e.target.value))} />
                  </div>
                  <div className="flex-col">
                    <label>Mirror</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '100%' }}>
                      <label style={{ margin: 0, gap: 4 }}>X <input type="checkbox" checked={mirrorX} onChange={(e) => setMirrorX(e.target.checked)} /></label>
                      <label style={{ margin: 0, gap: 4 }}>Y <input type="checkbox" checked={mirrorY} onChange={(e) => setMirrorY(e.target.checked)} /></label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="control-section-content">
              <h3>Content</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="flex-col">
                  <label className="label-row"><span>Title</span></label>
                  <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="flex-col">
                  <label className="label-row"><span>Artist</span></label>
                  <input type="text" placeholder="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
                </div>
                <div className="flex-col" style={{marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem'}}>
                  <label className="label-row"><span>Default Artist Name</span></label>
                  <input type="text" placeholder="e.g. Never Ending Loop" value={defaultArtist} 
                    onChange={(e) => {
                      setDefaultArtist(e.target.value);
                      if (artist === defaultArtist) setArtist(e.target.value);
                    }} />
                  <span className="helper-text">This will be used for all future tracks.</span>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                 <h3>Typography</h3>
                 <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="font-dropdown">
                   {FONT_OPTIONS.map(f => (
                     <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                   ))}
                 </select>
                 <div className="row-2-col" style={{ marginTop: '1rem' }}>
                   <div className="flex-col">
                     <label className="label-row"><span>Size</span> <span className="value">{Math.round(fontSizeScale * 100)}%</span></label>
                     <input type="range" min="0.2" max="4.0" step="0.1" value={fontSizeScale} onChange={(e) => setFontSizeScale(parseFloat(e.target.value))} />
                   </div>
                   <div className="flex-col">
                     <label className="label-row"><span>Safe Margin</span> <span className="value">{textMargin}%</span></label>
                     <input type="range" min="0" max="30" step="1" value={textMargin} onChange={(e) => setTextMargin(parseInt(e.target.value))} />
                   </div>
                 </div>
                 <div className="row-2-col" style={{ marginTop: '1rem' }}>
                   <div><label>Start Color</label><div className="color-picker-wrapper"><input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} /></div></div>
                   {(useTextGradient || textGradientMotion) && <div><label>End Color</label><div className="color-picker-wrapper"><input type="color" value={textColorEnd} onChange={(e) => setTextColorEnd(e.target.value)} /></div></div>}
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                   <label className="label-row"><span>Gradient</span><input type="checkbox" checked={useTextGradient} onChange={(e) => setUseTextGradient(e.target.checked)} /></label>
                   <label className="label-row"><span>Motion</span><input type="checkbox" checked={textGradientMotion} onChange={(e) => setTextGradientMotion(e.target.checked)} /></label>
                 </div>
                 <div className="row-2-col" style={{ marginTop: '1rem' }}>
                   <div>
                     <label>Offset X <span className="value">{textOffsetX}%</span></label>
                     <input type="range" min="-50" max="50" value={textOffsetX} onChange={(e) => setTextOffsetX(parseInt(e.target.value))} />
                   </div>
                   <div>
                     <label>Offset Y <span className="value">{textOffsetY}%</span></label>
                     <input type="range" min="-50" max="50" value={textOffsetY} onChange={(e) => setTextOffsetY(parseInt(e.target.value))} />
                   </div>
                 </div>
                 <div style={{ marginTop: '1rem' }}>
                    <label>Reactive Mode</label>
                    <select value={textReact} onChange={(e) => setTextReact(e.target.value)}>
                      <option value="none">Static</option>
                      <option value="pulse">Pulse (Scale)</option>
                      <option value="bounce">Bounce (Jump)</option>
                      <option value="jitter">Jitter (Shake)</option>
                      <option value="flash">Flash (Opacity)</option>
                      <option value="glow">Glow (Light)</option>
                    </select>
                 </div>
                 <div style={{ marginTop: '1rem' }}>
                    <label className="label-row"><span>FX Sensitivity</span> <span className="value">{textSensitivity.toFixed(1)}x</span></label>
                    <input type="range" min="0.1" max="3.0" step="0.1" value={textSensitivity} onChange={(e) => setTextSensitivity(parseFloat(e.target.value))} />
                 </div>
                 <div className="label-row" style={{ marginTop: '1rem' }}>
                    <label>Glow</label><input type="checkbox" checked={textGlow} onChange={(e) => setTextGlow(e.target.checked)} />
                 </div>
                 <div className="label-row" style={{ marginTop: '0.5rem' }}>
                    <label>Outline</label><input type="checkbox" checked={textOutline} onChange={(e) => setTextOutline(e.target.checked)} />
                 </div>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <h3>Position</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {PRESET_POSITIONS.map(p => (
                    <button key={p.value} className={`btn-secondary ${textPosition === p.value ? 'active' : ''}`}
                      onClick={() => setTextPosition(p.value)} style={{ fontSize: '0.65rem' }}>{p.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="control-section-content">
               <h3>Master Effects</h3>
               <div className="flex-col" style={{ gap: '1rem' }}>
                 <div className="flex-col">
                   <label className="label-row"><span>Glitch Intensity</span> <span className="value">{Math.round(glitchIntensity*100)}%</span></label>
                   <input type="range" min="0" max="1" step="0.01" value={glitchIntensity} onChange={(e) => setGlitchIntensity(parseFloat(e.target.value))} />
                 </div>
                 <div className="flex-col">
                   <label className="label-row"><span>Shake Intensity</span> <span className="value">{Math.round(shakeIntensity*100)}%</span></label>
                   <input type="range" min="0" max="1" step="0.01" value={shakeIntensity} onChange={(e) => setShakeIntensity(parseFloat(e.target.value))} />
                 </div>
                 <div className="flex-col">
                   <label className="label-row"><span>RGB Shift</span> <span className="value">{Math.round(rgbShiftIntensity*100)}%</span></label>
                   <input type="range" min="0" max="1" step="0.01" value={rgbShiftIntensity} onChange={(e) => setRgbShiftIntensity(parseFloat(e.target.value))} />
                 </div>
               </div>
               
               <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                   <label className="label-row"><span>Pixelate</span><input type="checkbox" checked={pixelate} onChange={(e) => setPixelate(e.target.checked)} /></label>
                   <label className="label-row"><span>Vignette</span><input type="checkbox" checked={vignette} onChange={(e) => setVignette(e.target.checked)} /></label>
                   <label className="label-row"><span>Kaleido</span><input type="checkbox" checked={kaleidoscope} onChange={(e) => setKaleidoscope(e.target.checked)} /></label>
                   <label className="label-row"><span>Scanlines</span><input type="checkbox" checked={scanlines} onChange={(e) => setScanlines(e.target.checked)} /></label>
                   <label className="label-row"><span>Noise</span><input type="checkbox" checked={noise} onChange={(e) => setNoise(e.target.checked)} /></label>
                   <label className="label-row"><span>Invert</span><input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} /></label>
               </div>
            </div>
          )}

          {activeTab === 'render' && (
            <div className="control-section-content">
              <h3>Transitions & Render</h3>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label-row"><span>Output Resolution</span></label>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
                  {RESOLUTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="flex-col" style={{ gap: '1.5rem' }}>
                <div className="label-row">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-accent)' }}>
                    <Zap size={14} /> Low Resource Mode
                  </label>
                  <input type="checkbox" checked={lowResourceExport} onChange={(e) => setLowResourceExport(e.target.checked)} />
                </div>
                
                <div className="label-row" style={{ marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                    <Shield size={14} /> Safe Render (Ultra Stable)
                  </label>
                  <input type="checkbox" checked={safeRender} onChange={(e) => setSafeRender(e.target.checked)} />
                </div>
                <span className="helper-text" style={{ marginTop: '-0.5rem' }}>Bypasses heavy effects and reduces bitrate to prevent terminal/tensor crashes.</span>

                <div className="flex-col">
                  <div className="label-row">
                    <label>Fade In</label>
                    <select style={{ width: '120px' }} value={fadeInType} onChange={(e) => setFadeInType(e.target.value)}>{FADE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                  </div>
                  <label className="label-row"><span>Duration</span> <span className="value">{fadeInDuration}s</span></label>
                  <input type="range" min="0.5" max="10" step="0.5" value={fadeInDuration} onChange={(e) => setFadeInDuration(parseFloat(e.target.value))} />
                </div>
                
                <div className="flex-col">
                  <div className="label-row">
                    <label>Fade Out</label>
                    <select style={{ width: '120px' }} value={fadeOutType} onChange={(e) => setFadeOutType(e.target.value)}>{FADE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                  </div>
                  <label className="label-row"><span>Duration</span> <span className="value">{fadeOutDuration}s</span></label>
                  <input type="range" min="0.5" max="10" step="0.5" value={fadeOutDuration} onChange={(e) => setFadeOutDuration(parseFloat(e.target.value))} />
                </div>
              </div>
              
              <button className="btn-primary" style={{ marginTop: '2.5rem' }} onClick={handleStartRecording} disabled={rendering || !audioFile || isProcessing}>
                {rendering ? 'Exporting...' : 'Export Final Video'}
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-preview">
        <div className="canvas-wrapper">
                    <Visualizer ref={canvasRef} analyser={analyser} bgUrl={bgUrl} bgType={bgType} vizType={vizType}
                      bgZoom={bgZoom} bgOffsetX={bgOffsetX} bgOffsetY={bgOffsetY} bgRotation={bgRotation}
                      bgSpeed={bgSpeed} bgBeatResponse={bgBeatResponse} bgLoopMode={bgLoopMode} bgLoopDuration={bgLoopDuration}
                      barColor={barColor} barColorEnd={barColorEnd} useGradient={useGradient} vizGradientMotion={vizGradientMotion}
            textColor={textColor} textColorEnd={textColorEnd} useTextGradient={useTextGradient}
            textGradientMotion={textGradientMotion}
            title={title} artist={artist} resolution={resolution} textPosition={textPosition}
            textOffsetX={textOffsetX} textOffsetY={textOffsetY}
            fontFamily={fontFamily} fontSizeScale={fontSizeScale} sensitivity={sensitivity}
            smartSensitivity={smartSensitivity} vizScale={vizScale} vizRotation={vizRotation} autoRotate={autoRotate}
            vizOffsetX={vizOffsetX} vizOffsetY={vizOffsetY} mirrorX={mirrorX} mirrorY={mirrorY} vizThickness={vizThickness} vizOpacity={vizOpacity}
            lowCut={lowCut} highCut={highCut} smartCut={smartCut}
            glitchIntensity={glitchIntensity} shakeIntensity={shakeIntensity} rgbShiftIntensity={rgbShiftIntensity}
            pixelate={pixelate} vignette={vignette} kaleidoscope={kaleidoscope} scanlines={scanlines}
            noise={noise} invert={invert}
            textGlow={textGlow} textOutline={textOutline} textReact={textReact} textSensitivity={textSensitivity}
            textMargin={textMargin}
            yoyoMode={yoyoMode} isPlaying={isPlaying} rendering={rendering} safeRender={safeRender} onProcessingChange={setIsProcessing}
            fadeInType={fadeInType} fadeInDuration={fadeInDuration} fadeOutType={fadeOutType} fadeOutDuration={fadeOutDuration}
            audioElement={audioElement} />
        </div>
      </main>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[100] backdrop-blur-xl" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', zIndex: 1000 }}>
          <Loader2 className="animate-spin text-accent mb-6" size={64} />
          <h3 className="text-2xl font-bold mb-2 text-white text-center">Analyzing Media</h3>
          <p className="text-muted text-lg text-center px-8">Preparing seamless loop...<br/>Please wait.</p>
        </div>
      )}
    </div>
  );
}

export default App;