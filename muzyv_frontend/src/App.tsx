import { useState, useRef, useEffect } from 'react';
import { Music, Image as ImageIcon, Play, Pause, Shuffle, Loader2, Square, Zap, Type, Film, Sliders, Maximize, Move, Volume2, VolumeX, RefreshCw, Shield, List } from 'lucide-react';
import JSZip from 'jszip';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { Visualizer } from './components/Visualizer';
import { AudioTrimWaveform } from './components/AudioTrimWaveform';
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
  { label: 'Lexend', value: 'Lexend' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Raleway', value: 'Raleway' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Lato', value: 'Lato' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Noto Sans', value: 'Noto Sans' },
  { label: 'Stardos Stencil', value: 'Stardos Stencil' },
  { label: 'UnifrakturMaguntia', value: 'UnifrakturMaguntia' },
  { label: 'Metal Mania', value: 'Metal Mania' },
  { label: 'Nosifer', value: 'Nosifer' },
  { label: 'Frijole', value: 'Frijole' },
  { label: 'Rye', value: 'Rye' },
  { label: 'Sancreek', value: 'Sancreek' },
  { label: 'Bungee', value: 'Bungee' },
  { label: 'Bungee Outline', value: 'Bungee Outline' },
  { label: 'Codystar', value: 'Codystar' },
  { label: 'Monoton', value: 'Monoton' },
  { label: 'Special Elite', value: 'Special Elite' },
  { label: 'Ultra', value: 'Ultra' },
  { label: 'Nabla', value: 'Nabla' },
  { label: 'Honk', value: 'Honk' },
  { label: 'Bungee Spice', value: 'Bungee Spice' },
  { label: 'Rubik Glitch', value: 'Rubik Glitch' },
  { label: 'Eater', value: 'Eater' },
  { label: 'Butcherman', value: 'Butcherman' },
  { label: 'Creepster', value: 'Creepster' },
  { label: 'Flavors', value: 'Flavors' },
  { label: 'Shojumaru', value: 'Shojumaru' },
  { label: 'MedievalSharp', value: 'MedievalSharp' },
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

const VIZ_CATEGORIES = [
  {
    name: 'Bars & Spectrum',
    options: [
      { label: 'Spectrum Bars', value: 'spectrum' },
      { label: 'Mirror Spectrum', value: 'mirror_spectrum' },
      { label: 'Bar Rain', value: 'bar_rain' },
      { label: 'Cyber City', value: 'cyber_city' },
      { label: 'Pixel Blocks', value: 'pixel_blocks' },
      { label: 'LED Wall', value: 'led_wall' },
      { label: 'Segmented Bar', value: 'segmented_bar' },
    ]
  },
  {
    name: 'Waves & Lines',
    options: [
      { label: 'Classic Wave', value: 'wave' },
      { label: 'Dual Wave', value: 'dual_wave' },
      { label: 'Wave Ribbon', value: 'ribbon' },
      { label: 'Spectrum Wave', value: 'spectrum_wave' },
      { label: 'Lightning', value: 'lightning' },
      { label: 'Glitch Vines', value: 'glitch_vines' },
      { label: 'Heartbeat (EKG)', value: 'heartbeat' },
      { label: 'Cosmic Strings', value: 'cosmic_strings' },
      { label: 'Seismic', value: 'seismic' },
      { label: 'Liquid Flow', value: 'liquid_flow' },
      { label: 'Aurora', value: 'aurora' },
      { label: 'Deep Sea', value: 'deep_sea' },
      { label: 'Techno Wires', value: 'techno_wires' },
    ]
  },
  {
    name: 'Circular & Radial',
    options: [
      { label: 'Circular Spectrum', value: 'circle' },
      { label: 'Concentric Rings', value: 'ring' },
      { label: 'Pulse Circle', value: 'pulse' },
      { label: 'Radial Iris', value: 'radial_spectrum' },
      { label: 'Audio Rings', value: 'audio_rings' },
      { label: 'Cyber Rings', value: 'rings_cyber' },
      { label: 'Spiral Galaxy', value: 'spiral' },
      { label: 'Orbitals', value: 'orbitals' },
      { label: 'Radar Scan', value: 'radar' },
      { label: 'Mandala', value: 'mandala' },
      { label: 'Vortex', value: 'vortex' },
    ]
  },
  {
    name: '3D & Geometric',
    options: [
      { label: '3D Floor Bars', value: 'bars_3d' },
      { label: '3D Cubes', value: 'cubes_3d' },
      { label: '3D Sphere', value: 'sphere_3d' },
      { label: '3D Tunnel', value: 'tunnel_3d' },
      { label: 'Neon Grid', value: 'neon_grid' },
      { label: 'Hexagon Grid', value: 'hexagon' },
      { label: 'Polygon World', value: 'poly_world' },
      { label: 'Pyramids', value: 'pyramids' },
      { label: 'Crystal', value: 'crystal' },
      { label: 'Isometric Grid', value: 'isometric_grid' },
      { label: 'Torus 3D', value: 'torus_3d' },
      { label: '3D DNA Helix', value: 'dna' },
      { label: '3D Wave Floor', value: '3d_wave_floor' },
    ]
  },
  {
    name: 'Particles & Physics',
    options: [
      { label: 'Starfield', value: 'starfield' },
      { label: 'Floating Particles', value: 'particles' },
      { label: 'Particle Mesh', value: 'particle_mesh' },
      { label: 'Fireflies', value: 'fireflies' },
      { label: 'Snowfall', value: 'snowfall' },
      { label: 'Confetti', value: 'confetti' },
      { label: 'Shockwave', value: 'shockwave' },
      { label: 'Gravity Well', value: 'gravity_well' },
      { label: 'Star Burst', value: 'star_burst' },
      { label: 'Vector Field', value: 'vector_field' },
      { label: 'Particle Swarm', value: 'swarm' },
      { label: 'Particle Attractor', value: 'attractor' },
      { label: 'Flow Field', value: 'flow_field' },
      { label: 'Particle Orbit', value: 'particle_orbit' },
    ]
  },
  {
    name: 'Abstract & Effects',
    options: [
      { label: 'Lava Lamp', value: 'lava' },
      { label: 'Plasma Ball', value: 'plasma' },
      { label: 'Fractal Tree', value: 'fractal_tree' },
      { label: 'Floating Orbs', value: 'floating_orbs' },
      { label: 'Abstract Clouds', value: 'abstract_clouds' },
      { label: 'Solar Flare', value: 'solar_flare' },
      { label: 'Kaleido Mesh', value: 'kaleido_mesh' },
      { label: 'Neural Net', value: 'neural_net' },
      { label: 'Digital Rain', value: 'digital_rain' },
      { label: 'Matrix Rain', value: 'matrix' },
      { label: 'Fire', value: 'fire' },
      { label: 'Nebula Cloud', value: 'nebula_cloud' },
    ]
  },
  {
    name: 'Creative & Experimental',
    options: [
      { label: 'Vaporwave Grid', value: 'vaporwave_grid' },
      { label: 'Geometric Bloom', value: 'geometric_bloom' },
      { label: 'Neural Pulse', value: 'neural_pulse' },
      { label: 'Quantum Foam', value: 'quantum_foam' },
      { label: 'Data Stream', value: 'data_stream' },
      { label: 'Infinite Zoom', value: 'infinite_zoom' },
      { label: 'Reactive Smoke', value: 'reactive_smoke' },
      { label: 'Cyber Shield', value: 'cyber_shield' },
      { label: 'Audio Origami', value: 'audio_origami' },
      { label: 'Stellar Core', value: 'stellar_core' },
      { label: 'Cyber City Flyover', value: 'cyber_city_flyover' },
      { label: 'Kaleido Tunnel', value: 'kaleido_tunnel' },
      { label: 'VHS Glitch Field', value: 'vhs_glitch_field' },
      { label: 'Celestial Clock', value: 'celestial_clock' },
      { label: 'Liquid Metal Blob', value: 'liquid_metal_blob' },
      { label: 'Neural Storm', value: 'neural_storm' },
      { label: 'Particle Shatter', value: 'particle_shatter' },
      { label: 'Circuit Board', value: 'circuit_board' },
      { label: 'Geometric Kaleidoscope', value: 'geometric_kaleidoscope' },
      { label: 'Matrix Tunnel', value: 'matrix_tunnel' },
      { label: 'Neon Butterfly', value: 'neon_butterfly' },
      { label: 'Voxel Terrain', value: 'voxel_terrain' },
      { label: 'Glitch Portraits', value: 'glitch_portraits' },
      { label: 'Poly Pulse', value: 'poly_pulse' },
      { label: 'Retro Wave Sun', value: 'retro_wave_sun' },
      { label: 'Energy Orb', value: 'energy_orb' },
      { label: 'Strings of Fate', value: 'strings_of_fate' },
    ]
  }
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
  
  // Batch Mode States
  const [batchQueue, setBatchQueue] = useState<File[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchRandomize, setBatchRandomize] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(-1);
  const [zipProgress, setZipStatus] = useState<string | null>(null);
  const [batchDownloadMode, setBatchDownloadMode] = useState<'zip' | 'individual'>('individual');
  
  // High-performance non-reactive storage for batch results
  const batchBlobsRef = useRef<{name: string, blob: Blob}[]>([]);
  const [zoomMode, setZoomMode] = useState<'start' | 'end' | 'full'>('full');
  const zoomTimerRef = useRef<number | null>(null);

  const setTemporaryZoom = (mode: 'start' | 'end') => {
    setZoomMode(mode);
    if (zoomTimerRef.current) window.clearTimeout(zoomTimerRef.current);
    zoomTimerRef.current = window.setTimeout(() => setZoomMode('full'), 3000);
  };

  const { 
    togglePlay, toggleMute, stop, isPlaying, isMuted, audioElement, audioContext, sourceNode, analyser,
    currentTime, duration, seek,
    resetAudioForRecording,
    startTime, endTime, setStartTime, setEndTime, audioBuffer,
    audioFadeIn, setAudioFadeIn, audioFadeOut, setAudioFadeOut, fadeDuration, setFadeDuration,
    setIsRendering, fadeGainNode, isReady
  } = useAudioAnalyzer(audioFile);

  // Auto-revoke audio blobs to save RAM
  useEffect(() => {
    if (audioFile && isReady) {
      // Small delay to ensure browser finished initial read
      const t = setTimeout(() => {
        if (audioElement?.src?.startsWith('blob:')) {
          // We don't revoke here because useAudioAnalyzer needs it for seek/play
          // but we will ensure it's revoked on UNMOUNT in the hook itself.
        }
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [audioFile, isReady]);

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
      'abstract_clouds', 'led_wall', 'segmented_bar', 'seismic', 'fire', 'isometric_grid',
      'vaporwave_grid', 'data_stream', 'reactive_smoke', 'cyber_city_flyover', 'voxel_terrain', 'strings_of_fate'
    ];
    if (bottomTypes.includes(type)) def.y = 95;
    if (['starfield', 'neon_grid', 'star_burst', 'solar_flare', 'flow_field', 'attractor', 'infinite_zoom', 'stellar_core', 'kaleido_tunnel', 'particle_shatter', 'matrix_tunnel', 'retro_wave_sun'].includes(type)) def.scale = 1.5;
    if (['particles', 'plasma', 'floating_orbs', 'gravity_well', 'techno_wires', 'neural_net', 'vector_field', 'swarm', 'torus_3d', 'neural_pulse', 'cyber_shield', 'audio_origami', 'geometric_bloom', 'quantum_foam', 'celestial_clock', 'liquid_metal_blob', 'neural_storm', 'vhs_glitch_field', 'circuit_board', 'geometric_kaleidoscope', 'neon_butterfly', 'poly_pulse', 'glitch_portraits', 'energy_orb'].includes(type)) def.scale = 1.2;
    if (['fractal_tree', 'mountain_view', 'abstract_clouds', 'vaporwave_grid', 'cyber_city_flyover', 'retro_wave_sun'].includes(type)) def.y = 85;
    return def;  };

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
    
    const allOptions = VIZ_CATEGORIES.flatMap(c => c.options);
    const randomType = allOptions[Math.floor(Math.random() * allOptions.length)].value;
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

  // Handle Batch final ZIP download
  useEffect(() => {
    // If batch mode was turned off but we have blobs, trigger the download
    if (!isBatchMode && batchBlobsRef.current.length > 0) {
      const finishBatch = async () => {
        setZipStatus('Packaging ZIP...');
        try {
          await downloadZip(batchBlobsRef.current);
        } catch (err) {
          console.error("ZIP packaging failed:", err);
          alert("ZIP packaging failed. This usually happens when the combined video files exceed browser memory limits. Your renders have been cleared to save RAM. Please use 'Individual' download mode for large batches.");
        } finally {
          // ALWAYS clear blobs and status even on failure to prevent "stuck" state
          batchBlobsRef.current = [];
          setCurrentBatchIndex(-1);
          setZipStatus(null);
          setRendering(false);
          setIsRendering(false);
        }
      };
      finishBatch();
    }
  }, [isBatchMode]);

  // Handle Batch Auto-Start when audio ready
  useEffect(() => {
    if (isBatchMode && currentBatchIndex >= 0 && isReady && audioFile && audioElement && !rendering) {
      const timer = setTimeout(() => {
        // Re-verify conditions after delay
        if (!isBatchMode || currentBatchIndex < 0 || !audioElement) return;
        
        const newDuration = audioElement.duration;
        
        // Update states explicitly so the Visualizer component is aware of the new length
        setStartTime(0);
        setEndTime(newDuration);
        
        handleStartRecording(0, newDuration);
      }, 3500); // Slightly longer delay for stability
      
      return () => clearTimeout(timer);
    }
  }, [currentBatchIndex, isBatchMode, isReady, !!audioFile, !!audioElement, rendering]);

  const [lowResourceExport, setLowResourceExport] = useState(false);
  const [safeRender, setSafeRender] = useState(false);

  const softReset = () => {
    // Stop any active rendering/batching without reloading
    setRendering(false);
    setIsRendering(false);
    setIsBatchMode(false);
    setCurrentBatchIndex(-1);
    setZipStatus(null);
    batchBlobsRef.current = [];
    stop(); // Stop audio playback
    
    // Brief delay to allow garbage collection
    setTimeout(() => {
      console.log("App soft-reset complete.");
    }, 100);
  };

  const handleStopBatch = () => {
    if (!isBatchMode) return;
    setIsBatchMode(false);
    setZipStatus('Stopping batch...');
    
    // The useEffect above will handle the ZIP if we aren't rendering
    // If we are rendering, the onstop handler will trigger the final state change
    if (!rendering) {
      setCurrentBatchIndex(-1);
      setZipStatus(null);
      batchBlobsRef.current = [];
    }
  };

  const downloadZip = async (blobs: {name: string, blob: Blob}[]) => {
    if (blobs.length === 0) return;
    const zip = new JSZip();
    blobs.forEach(({ name, blob }) => {
      zip.file(`${name}.webm`, blob);
    });
    // Use STORE compression (0) to avoid massive RAM spikes during packaging
    // Also use stream if possible (JSZip handles this internally with generateAsync)
    const content = await zip.generateAsync({ 
      type: 'blob', 
      compression: 'STORE',
      streamFiles: true 
    });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muzyv_batch_${new Date().getTime()}.zip`;
    a.click();
    // Use a longer timeout for revocation to ensure the browser has started the download
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleStartRecording = async (overrideStart?: number, overrideEnd?: number) => {
    if (!audioFile || !audioElement || !canvasRef.current || !audioContext || !sourceNode) return;
    
    const finalStart = typeof overrideStart === 'number' ? overrideStart : startTime;
    const finalEnd = typeof overrideEnd === 'number' ? overrideEnd : endTime;

    setRendering(true);
    setIsRendering(true);
    let canvasStream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;
    let dest: MediaStreamAudioDestinationNode | null = null;

    try {
      audioElement.pause();
      audioElement.currentTime = finalStart;
      
      if (audioContext.state === 'suspended') await audioContext.resume();
      
      dest = audioContext.createMediaStreamDestination();
      if (fadeGainNode) {
        fadeGainNode.connect(dest);
      } else {
        sourceNode.connect(dest);
      }
      
      const types = (lowResourceExport || safeRender)
        ? ['video/webm;codecs=vp8,opus', 'video/webm']
        : ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
        
      const mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
      canvasStream = canvasRef.current.captureStream(30); 
      
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(), 
        ...dest.stream.getAudioTracks()
      ]);

      recorder = new MediaRecorder(combinedStream, { 
        mimeType,
        videoBitsPerSecond: safeRender ? 2000000 : (lowResourceExport ? 4000000 : 8000000)
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { 
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        alert("Recording error occurred. Attempting to recover...");
        setRendering(false);
        setIsRendering(false);
      };
      
      recorder.onstop = async () => {
        setIsRendering(false);
        
        // Explicitly stop all tracks to free hardware resources (GPU/Camera/Display)
        if (canvasStream) canvasStream.getTracks().forEach(track => { track.stop(); track.enabled = false; });
        if (dest) dest.stream.getTracks().forEach(track => { track.stop(); track.enabled = false; });
        combinedStream.getTracks().forEach(track => { track.stop(); track.enabled = false; });

        if (chunks.length === 0) {
          console.error("No chunks collected during recording");
          setRendering(false);
          return;
        }
        
        const blob = new Blob(chunks, { type: mimeType });
        chunks.length = 0; // Clear memory immediately
        const fileName = audioFile.name.replace(/\.[^/.]+$/, "");

        if (!isBatchMode || batchDownloadMode === 'individual') {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); 
          a.href = url; 
          a.download = `muzyv_${fileName}.webm`; 
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        } else {
          batchBlobsRef.current.push({ name: fileName, blob });
        }
        
        // Clean up audio connections
        try {
          if (dest) {
            if (fadeGainNode) fadeGainNode.disconnect(dest);
            else if (sourceNode) sourceNode.disconnect(dest);
          }
        } catch (err) { console.warn("Cleanup disconnect failed:", err); }
        
        stop();
        setRendering(false); 

        if (isBatchMode) {
          if (currentBatchIndex < batchQueue.length - 1) {
            const nextIndex = currentBatchIndex + 1;
            setCurrentBatchIndex(nextIndex);
            const nextFile = batchQueue[nextIndex];
            setAudioFile(nextFile);
            setTitle(nextFile.name.replace(/\.[^/.]+$/, ""));
            if (batchRandomize) handleRandomize();
          } else {
            // End of batch
            setIsBatchMode(false);
          }
        }
      };

      resetAudioForRecording(); 
      recorder.start(1000); // Collect chunks every second to keep memory usage predictable
      
      setTimeout(async () => {
        try {
          if (!audioElement || !recorder || recorder.state !== 'recording') return;
          audioElement.currentTime = finalStart;
          await audioElement.play();
          
          let stopped = false;
          const stopRecording = () => {
            if (stopped) return;
            stopped = true;
            setTimeout(() => {
              if (recorder && recorder.state === 'recording') recorder.stop();
            }, 500); // Slightly more buffer at the end
            audioElement.removeEventListener('timeupdate', checkEnd);
            audioElement.removeEventListener('ended', checkEnd);
            audioElement.removeEventListener('pause', checkEnd);
          };

          const checkEnd = () => {
            if (audioElement.currentTime >= finalEnd || audioElement.ended) {
              stopRecording();
            }
          };

          audioElement.addEventListener('timeupdate', checkEnd);
          audioElement.addEventListener('ended', checkEnd);
          audioElement.addEventListener('pause', () => {
            if (audioElement.currentTime < finalEnd - 0.2) {
              console.warn("Audio paused unexpectedly, resuming for render...");
              audioElement.play().catch(() => stopRecording());
            } else {
              checkEnd();
            }
          });

        } catch (playErr) {
          console.error("Playback failed:", playErr);
          if (recorder && recorder.state === 'recording') recorder.stop();
        }
      }, 800);

    } catch (e: unknown) { 
      console.error("Recording setup error:", e); 
      setRendering(false); 
      setIsRendering(false);
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
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
            <button className="btn-secondary" onClick={softReset} style={{ fontSize: '0.6rem', padding: '4px 8px', flex: 1 }}>Soft Reset (Safe)</button>
            <button className="btn-secondary" onClick={handleHardReset} style={{ fontSize: '0.6rem', padding: '4px 8px', flex: 1, borderColor: '#ef4444' }}>Hard Reset</button>
          </div>
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
          <input type="range" className="progress-slider" min={startTime} max={endTime || duration || 0} step="0.1" value={currentTime} onChange={(e) => seek(parseFloat(e.target.value))} disabled={!audioFile} />
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

              {audioFile && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3>Track Trim</h3>
                  <AudioTrimWaveform 
                    buffer={audioBuffer} 
                    startTime={startTime} 
                    endTime={endTime} 
                    currentTime={currentTime} 
                    onSeek={seek} 
                    zoomMode={zoomMode}
                  />
                  <div className="flex-col" style={{ gap: '1rem' }}>
                    <div className="flex-col">
                      <label className="label-row"><span>Start Time</span> <span className="value">{formatTime(startTime)}</span></label>
                      <input type="range" min="0" max={duration} step="0.1" value={startTime} 
                        onMouseDown={() => setTemporaryZoom('start')}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setStartTime(val);
                          if (val >= endTime) setEndTime(Math.min(val + 1, duration));
                          setTemporaryZoom('start');
                        }} />
                    </div>
                    <div className="flex-col">
                      <label className="label-row"><span>End Time</span> <span className="value">{formatTime(endTime)}</span></label>
                      <input type="range" min="0" max={duration} step="0.1" value={endTime} 
                        onMouseDown={() => setTemporaryZoom('end')}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setEndTime(val);
                          if (val <= startTime) setStartTime(Math.max(val - 1, 0));
                          setTemporaryZoom('end');
                        }} />
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <label className="label-row"><span>Audio Fade In</span><input type="checkbox" checked={audioFadeIn} onChange={(e) => setAudioFadeIn(e.target.checked)} /></label>
                    <label className="label-row"><span>Audio Fade Out</span><input type="checkbox" checked={audioFadeOut} onChange={(e) => setAudioFadeOut(e.target.checked)} /></label>
                  </div>
                  {(audioFadeIn || audioFadeOut) && (
                    <div className="flex-col" style={{ marginTop: '0.5rem' }}>
                      <label className="label-row"><span>Audio Fade Duration</span> <span className="value">{fadeDuration}s</span></label>
                      <input type="range" min="0.1" max="10" step="0.1" value={fadeDuration} onChange={(e) => setFadeDuration(parseFloat(e.target.value))} />
                    </div>
                  )}
                </div>
              )}

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
                 <div className="viz-categories-container">
                  {VIZ_CATEGORIES.map((cat) => (
                    <div key={cat.name} className="viz-category-section">
                      <h4 className="viz-category-title">{cat.name}</h4>
                      <div className="viz-options-grid">
                        {cat.options.map((opt) => (
                          <button key={opt.value} className={`viz-btn ${vizType === opt.value ? 'active' : ''}`} onClick={() => handleSetVizType(opt.value)}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
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
                {/* ... keep Low Resource and Safe Render toggles ... */}
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

              <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><List size={16} /> Batch Processing</h3>
                <div className="flex-col" style={{ gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn-secondary" onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = 'audio/*';
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      if (files.length > 0) setBatchQueue(prev => [...prev, ...files]);
                    };
                    input.click();
                  }}>
                    {batchQueue.length > 0 ? `Queue: ${batchQueue.length} Tracks (Add More)` : 'Upload Multiple Tracks'}
                  </button>
                  
                  {batchQueue.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem' }} onClick={() => setBatchQueue([])}>Clear Queue</button>
                    </div>
                  )}
                  
                  {batchQueue.length > 0 && (
                    <>
                      <div className="flex-col" style={{ gap: '0.5rem' }}>
                        <label className="label-row">
                          <span>Download Mode</span>
                          <select value={batchDownloadMode} onChange={(e) => setBatchDownloadMode(e.target.value as 'zip' | 'individual')}>
                            <option value="individual">Individual (Safest - Downloads as it finishes)</option>
                            <option value="zip">ZIP at End (High RAM usage)</option>
                          </select>
                        </label>
                        <label className="label-row">
                          <span>Randomize Style per Track</span>
                          <input type="checkbox" checked={batchRandomize} onChange={(e) => setBatchRandomize(e.target.checked)} />
                        </label>
                      </div>
                      
                      <button className="btn-primary" onClick={() => {
                        batchBlobsRef.current = []; // Clear previous results
                        setIsBatchMode(true);
                        setCurrentBatchIndex(0);
                        const firstFile = batchQueue[0];
                        setAudioFile(firstFile);
                        setTitle(firstFile.name.replace(/\.[^/.]+$/, ""));
                        if (batchRandomize) handleRandomize();
                      }} disabled={rendering || isProcessing}>
                        Start Batch Export
                      </button>
                      <span className="helper-text">
                        {batchDownloadMode === 'zip' 
                          ? 'Videos will be collected in RAM and zipped at the end.' 
                          : 'Each video will download automatically as soon as it finishes.'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {!isBatchMode && (
                <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={() => handleStartRecording()} disabled={rendering || !audioFile || isProcessing}>
                  {rendering ? 'Exporting...' : 'Export Final Video'}
                </button>
              )}

              {isBatchMode && (
                <div className="flex-col" style={{ gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ textAlign: 'center', color: 'var(--text-accent)', fontSize: '0.8rem' }}>
                    Processing {currentBatchIndex + 1} of {batchQueue.length}...
                  </div>
                  <button className="btn-secondary" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={handleStopBatch}>
                    Stop & Export Current Batch
                  </button>
                </div>
              )}
              {zipProgress && (
                <div style={{ marginTop: '1rem', textAlign: 'center', color: '#10b981', fontSize: '0.8rem' }}>
                  {zipProgress}
                </div>
              )}
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
            audioElement={audioElement}
            startTime={startTime} endTime={endTime} />
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