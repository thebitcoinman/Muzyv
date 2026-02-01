# Muzyv Project State

## Overview
Muzyv is an audio visualization application. It was originally designed with a Python (FastAPI/FFmpeg) backend for rendering videos, but has been migrated to a fully client-side architecture using React, the Web Audio API, and the MediaRecorder API.

## Changelog

### [2024-05-23] - Migration to Client-Side Rendering
- **Refactor:** Removed dependency on Python backend for video generation.
- **Frontend:**
    - `Visualizer.tsx`: Updated to support `forwardRef` for canvas access and direct background rendering (image/video).
    - `useAudioAnalyzer.ts`: Enhanced to expose `audioContext` and `sourceNode` for `MediaStreamDestination` routing. Added `resetAudioForRecording` and `restoreAudioAfterRecording` for safe state management.
    - `App.tsx`: Implemented `MediaRecorder` logic to capture canvas and audio streams directly in the browser and export as `.webm`.
- **Git:** Initialized local git repository to track these changes.

## Rollback Information
The current state is committed to the `master` branch.
- **Commit:** Initial commit: Client-side visualization implementation

To roll back or experiment, create a new branch from this state:
```bash
git checkout -b experiment/feature-name
```

## Backup & Remote
This project is currently a local git repository. To push to a remote Gitea instance:
1.  Create a repository on Gitea.
2.  Run:
    ```bash
    git remote add origin <your-gitea-url>
    git push -u origin master
    ```
