# Muzyv - Professional Audio Visualizer

Muzyv is a high-performance, client-side audio visualization application built with React, the Web Audio API, and the Canvas API. It allows users to create stunning, high-resolution music videos directly in their browser with no backend processing required.

## 🚀 Key Features
- **Client-Side Rendering:** Uses `MediaRecorder` and `Canvas.captureStream()` to export high-quality `.webm` videos.
- **31+ Advanced Visualizers:** From classic spectrum bars to complex fractal trees and 3D-simulated environments.
- **Dynamic Yo-Yo Looping:** Automatically captures and creates seamless back-and-forth loops for background videos.
- **70+ Typography Options:** Extensive Google Fonts integration with audio-reactive text effects (Pulse, Jitter, Bounce).
- **Master FX Suite:** Real-time glitch, RGB shift, shake, kaleidoscope, and vignette post-processing.
- **Responsive Navigation:** Interactive progress bar and time-scrubbing for precise visualization control.

## 🎨 Visualizer Library
1.  **Spectrum:** Classic frequency bar visualization.
2.  **Wave/Dual Wave:** Time-domain oscilloscopes.
3.  **DNA Helix:** Reactive double-helix structure.
4.  **3D Geometry:** Cubes, spheres, and bars with depth simulation.
5.  **Nature-Inspired:** Fractal trees and floating orbs.
6.  **Cyber-Aesthetic:** Matrix rain, neon grids, and cyber rings.
7.  **Particle Systems:** Audio-reactive particle storms and starfields.

## 🛠 Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Audio:** Web Audio API (AnalyserNode, MediaElementSource)
- **Graphics:** HTML5 Canvas (2D Context)
- **Export:** MediaRecorder API with VP9 encoding
- **Icons:** Lucide React

## 📖 Core Functions
### `useAudioAnalyzer` (Hook)
Manages the `AudioContext`, frequency analysis, and state synchronization.
- `togglePlay/stop`: Controls playback.
- `seek(time)`: Navigates the audio track.
- `muteOutput/unmuteOutput`: Routes audio between speakers and the recording destination.

### `Visualizer` (Component)
The core rendering engine using `requestAnimationFrame`.
- **Yo-Yo Logic:** Captures `ImageBitmap` frames from video backgrounds to create seamless, frame-perfect loops synchronized to the original video FPS.
- **Render Loop:** Composites background, audio-reactive layers, typography, and post-FX in a single pass.

### `handleStartRecording`
Orchestrates the export process by connecting the audio source to a `MediaStreamDestination` and capturing the canvas stream at a fixed bitrate (8Mbps) for high-quality output.

## 🐳 Docker Deployment

### Quick Start with Docker Desktop (Recommended)

1. **Prerequisites:**
   - Docker Desktop installed on your system
   - Git installed

2. **Clone and run:**
   ```bash
   git clone https://github.com/thebitcoinman/Muzyv.git
   cd Muzyv
   docker-compose up -d
   ```
   
3. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

4. **To stop the application:**
   ```bash
   docker-compose down
   ```

### DIY Route - Manual Docker Build

1. **Prerequisites:**
   - Docker Engine installed
   - Git installed
   - Node.js 18+ (for development only)

2. **Clone the repository:**
   ```bash
   git clone https://github.com/thebitcoinman/Muzyv.git
   cd Muzyv
   ```

3. **Build the Docker image:**
   ```bash
   docker build -t muzyv-frontend .
   ```

4. **Run the container:**
   ```bash
   docker run -d -p 3000:80 --name muzyv-frontend muzyv-frontend
   ```

5. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

6. **To stop and remove the container:**
   ```bash
   docker stop muzyv-frontend
   docker rm muzyv-frontend
   ```

### Dependencies & Requirements

**For Docker Deployment:**
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Minimum 2GB RAM
- 500MB disk space

**For Development/Manual Build:**
- Node.js 18+ LTS
- npm 8+
- Git

**Browser Requirements:**
- Modern browser with Web Audio API support
- Chrome/Edge 88+, Firefox 85+, Safari 14+

### Production Notes

- The Docker container uses Nginx to serve static files efficiently
- Built-in security headers for production deployment
- Optimized caching for static assets
- Single-page application with proper routing fallbacks

### Troubleshooting

**Port already in use?**
```bash
# Use a different port
docker run -d -p 3001:80 --name muzyv-frontend muzyv-frontend
```

**Build fails with TypeScript errors?**
The Docker build skips TypeScript checking for production builds. If you want to develop locally:
```bash
cd muzyv_frontend
npm install
npm run dev
```

---
Built with 💜 by Muzyv.