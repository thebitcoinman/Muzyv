import os
import shutil
import subprocess
import json
import logging
from typing import Optional
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from mutagen.mp3 import MP3
from mutagen.id3 import ID3

# Configuration
BASE_DIR = Path(__file__).parent
BIN_DIR = BASE_DIR / "bin"
TEMP_DIR = BASE_DIR / "temp"
OUTPUT_DIR = BASE_DIR / "output"
FONT_PATH = BIN_DIR / "font.ttf"
FFMPEG_BINARY = BIN_DIR / "ffmpeg"

# Ensure directories exist
TEMP_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add a route to test connectivity
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

def get_audio_duration(file_path: Path) -> float:
    try:
        audio = MP3(file_path)
        return audio.info.length
    except Exception as e:
        logger.error(f"Error reading audio duration: {e}")
        # Fallback using ffprobe if mutagen fails or not MP3
        return 0.0

def get_metadata(file_path: Path):
    title = "Unknown Track"
    artist = "Never Ending Loop" # Default/Fixed as requested
    try:
        audio = ID3(file_path)
        if "TIT2" in audio:
            title = str(audio["TIT2"].text[0])
    except Exception:
        pass
    return title, artist

# In-memory store for tracking rendering progress
current_job_status = {"status": "idle", "progress": 0, "message": ""}

@app.get("/status")
async def get_status():
    return current_job_status

@app.post("/render")
async def render_video(
    background_file: UploadFile = File(...),
    audio_file: UploadFile = File(...),
    visualizer_type: str = Form("spectrum"), # spectrum, wave, circle
    text_color: str = Form("white"),
    bar_color: str = Form("white"),
    title: str = Form(None),
    artist: str = Form(None),
    resolution: str = Form("1920x1080"),
    text_position: str = Form("center"), # center, top, bottom, top_left, top_right, bottom_left, bottom_right
    fade_in: float = Form(0.0), # seconds
    fade_out: float = Form(0.0), # seconds
    preview_mode: bool = Form(False)
):
    # Update status
    current_job_status.update({"status": "processing", "progress": 5, "message": "Received request, saving files..."})

    logger.info(f"Render request received: preview_mode={preview_mode}, audio_file={audio_file.filename}, bg_file={background_file.filename}")
    print(f"DEBUG: Render request received - audio: {audio_file.filename}, bg: {background_file.filename}, preview: {preview_mode}")

    # Validate file types before saving
    allowed_audio_types = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg']
    allowed_bg_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/mkv']

    # Check if file types are valid
    if audio_file.content_type not in allowed_audio_types:
        logger.error(f"Invalid audio file type: {audio_file.content_type}")
        raise HTTPException(status_code=400, detail=f"Invalid audio file type: {audio_file.content_type}. Allowed types: {allowed_audio_types}")

    if background_file.content_type not in allowed_bg_types:
        logger.error(f"Invalid background file type: {background_file.content_type}")
        raise HTTPException(status_code=400, detail=f"Invalid background file type: {background_file.content_type}. Allowed types: {allowed_bg_types}")

    # Save Uploaded Files
    audio_path = TEMP_DIR / audio_file.filename
    bg_path = TEMP_DIR / background_file.filename

    logger.info(f"Saving files: {audio_path}, {bg_path}")
    print(f"DEBUG: Saving files - audio: {audio_path}, bg: {bg_path}")

    with open(audio_path, "wb") as f:
        shutil.copyfileobj(audio_file.file, f)
    with open(bg_path, "wb") as f:
        shutil.copyfileobj(background_file.file, f)

    logger.info(f"Files saved successfully")
    print(f"DEBUG: Files saved successfully")

    # Verify that files were actually saved and have content
    if not audio_path.exists() or audio_path.stat().st_size == 0:
        logger.error("Audio file was not saved properly or is empty")
        raise HTTPException(status_code=400, detail="Audio file upload failed or file is empty")

    if not bg_path.exists() or bg_path.stat().st_size == 0:
        logger.error("Background file was not saved properly or is empty")
        raise HTTPException(status_code=400, detail="Background file upload failed or file is empty")

    # Update status
    current_job_status.update({"status": "processing", "progress": 10, "message": "Files saved, processing..."})
        
    # Metadata & Duration
    duration = get_audio_duration(audio_path)
    
    # Use provided title/artist or fallback to metadata
    meta_title, meta_artist = get_metadata(audio_path)
    final_title = title if title else meta_title
    final_artist = artist if artist else meta_artist
    
    # Parse Resolution
    try:
        w_str, h_str = resolution.lower().split("x")
        w = int(w_str)
        h = int(h_str)
    except ValueError:
        w, h = 1920, 1080
    
    # Update status
    current_job_status.update({"status": "processing", "progress": 15, "message": "Getting metadata..."})

    # Metadata & Duration
    duration = get_audio_duration(audio_path)

    # Use provided title/artist or fallback to metadata
    meta_title, meta_artist = get_metadata(audio_path)
    final_title = title if title else meta_title
    final_artist = artist if artist else meta_artist

    # Parse Resolution
    try:
        w_str, h_str = resolution.lower().split("x")
        w = int(w_str)
        h = int(h_str)
    except ValueError:
        w, h = 1920, 1080

    # Update status
    current_job_status.update({"status": "processing", "progress": 20, "message": "Setting up filters..."})

    # Output Filename
    output_filename = f"render_{audio_file.filename}_{'preview' if preview_mode else 'full'}.mp4"
    output_path = OUTPUT_DIR / output_filename

    # Text Draw (Title + Artist) - move color formatting earlier since it's needed in filters
    font_file = str(FONT_PATH).replace("\\", "/")

    def escape_text(text):
        if not text:
            return ""
        # Escape special characters that might be problematic for FFmpeg
        text = text.replace(":", "\\:").replace("'", "\\'").replace(",", "\\,")
        return text

    # Escape colors to ensure they're properly formatted for FFmpeg
    def format_color(color):
        # Remove hash if present and ensure it's properly formatted
        if color.startswith('#'):
            return color[1:]  # Remove the '#' prefix
        return color

    safe_title = escape_text(final_title)
    safe_artist = escape_text(final_artist)
    formatted_text_color = format_color(text_color)
    formatted_bar_color = format_color(bar_color)  # Move this earlier

    # FFmpeg Command Construction
    # We will use the static binary we downloaded
    ffmpeg_cmd = [str(FFMPEG_BINARY), "-y"]
    
    # Inputs
    ffmpeg_cmd.extend(["-stream_loop", "-1", "-i", str(bg_path)]) # Loop background
    ffmpeg_cmd.extend(["-i", str(audio_path)]) # Audio
    
    # Filter Complex
    # 1. Scale/Crop Background
    # 2. Visualizer generation
    # 3. Overlay visualizer on background
    # 4. Draw Text
    
    # Background Scaling
    bg_scale_filter = f"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}[bg_scaled]"

    # Define visualizer filter - using only simple filters to avoid 'cq' issues
    if visualizer_type in ["wave", "wave_center", "circle", "spectrum"]:  # All these use showwaves now
        viz_height = int(h * 0.3)
        viz_filter = f"[1:a]showwaves=s={w}x{viz_height}:mode=line:colors={formatted_bar_color}[viz]"
        overlay_cmd = f"[bg_scaled][viz]overlay=0:H-{viz_height}[bg_viz]"
    elif visualizer_type == "ave": # Lissajous (Keyed out black)
        viz_filter = f"[1:a]avectorscope=s={w}x{h}:m=lissajous:draw=line:rc=255:gc=255:bc=255:ac=255[viz_raw];[viz_raw]colorkey=0x000000:0.1:0.1[viz]"
        overlay_cmd = f"[bg_scaled][viz]overlay=0:0[bg_viz]"
    elif visualizer_type == "spectrogram": # Scrolling Fire
        viz_height = int(h * 0.4)
        viz_filter = f"[1:a]showspectrum=s={w}x{viz_height}:mode=combined:color=fire:slide=scroll:scale=log[viz_raw];[viz_raw]colorkey=0x000000:0.1:0.1[viz]"
        overlay_cmd = f"[bg_scaled][viz]overlay=0:H-{viz_height}[bg_viz]"
    else:  # Default to showwaves
        viz_height = int(h * 0.3)
        viz_filter = f"[1:a]showwaves=s={w}x{viz_height}:mode=line:colors={formatted_bar_color}[viz]"
        overlay_cmd = f"[bg_scaled][viz]overlay=0:H-{viz_height}[bg_viz]"



    # Scale font size relative to height (baseline 1080p)
    font_scale = h / 1080.0
    title_size = int(64 * font_scale)
    artist_size = int(48 * font_scale)

    # Calculate X/Y based on position preset (simplified)
    x_title = "(w-text_w)/2"
    y_title = f"h/2-{int(50*font_scale)}"
    x_artist = "(w-text_w)/2"
    y_artist = f"h/2+{int(30*font_scale)}"

    # Simplified text filter to avoid potential parsing issues
    text_filter = (
        f"[bg_viz]drawtext=fontfile='{font_file}':text='{safe_title}':fontsize={title_size}:fontcolor={formatted_text_color}:x={x_title}:y={y_title}:shadowcolor=black:shadowx=2:shadowy=2[txt1];"
        f"[txt1]drawtext=fontfile='{font_file}':text='{safe_artist}':fontsize={artist_size}:fontcolor={formatted_text_color}:x={x_artist}:y={y_artist}:shadowcolor=black:shadowx=2:shadowy=2[outv]"
    )

    full_filter = bg_scale_filter + ";" + viz_filter + ";" + overlay_cmd + ";" + text_filter
    
    ffmpeg_cmd.extend(["-filter_complex", full_filter])
    ffmpeg_cmd.extend(["-map", "[outv]", "-map", "1:a"])
    
    # Encoding Options
    # Use software encoding for reliability, GPU acceleration can be added later
    ffmpeg_cmd.extend(["-c:v", "libx264", "-preset", "medium", "-crf", "23"])

    ffmpeg_cmd.extend(["-c:a", "aac", "-b:a", "192k"])
    
    # Duration limit
    if preview_mode:
        ffmpeg_cmd.extend(["-t", "10"])
    else:
        ffmpeg_cmd.extend(["-shortest"])
        
    ffmpeg_cmd.append(str(output_path))
    
    # Log the command for debugging
    cmd_str = ' '.join(ffmpeg_cmd)
    logger.info(f"Running FFmpeg: {cmd_str}")
    print(f"DEBUG COMMAND: {cmd_str}") # Print to stdout for easier debugging
    print(f"DEBUG FILTER_COMPLEX: {full_filter}") # Print the filter complex separately
    print(f"DEBUG: Using GPU: {'h264_nvenc' in cmd_str}") # Print GPU usage info

    # Update status
    current_job_status.update({"status": "processing", "progress": 25, "message": "Starting FFmpeg encoding..."})

    logger.info(f"Executing FFmpeg command...")
    print(f"DEBUG: Executing FFmpeg command...")

    # Run with timeout to prevent hanging
    try:
        # For long-running processes, we'll update progress periodically
        process = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)

        # Monitor the process and update progress
        import threading
        import time

        def monitor_progress():
            while process.poll() is None:
                time.sleep(5)  # Update every 5 seconds
                current_progress = current_job_status["progress"]
                # Increment progress but cap at 95%
                new_progress = min(current_progress + 2, 95)
                current_job_status.update({
                    "status": "processing",
                    "progress": new_progress,
                    "message": f"Encoding video... ({new_progress}%)"
                })

        monitor_thread = threading.Thread(target=monitor_progress)
        monitor_thread.start()

        stdout, stderr = process.communicate()  # Wait for completion

        # Update to final status
        current_job_status.update({
            "status": "processing",
            "progress": 98,
            "message": "Finishing up..."
        })

        logger.info(f"FFmpeg command completed with return code: {process.returncode}")
        print(f"DEBUG: FFmpeg command completed with return code: {process.returncode}")

        # Wait for monitor thread to finish
        monitor_thread.join(timeout=1)

    except subprocess.TimeoutExpired:
        logger.error("FFmpeg process timed out after 5 minutes")
        print(f"DEBUG: FFmpeg process timed out after 5 minutes")
        current_job_status.update({"status": "error", "progress": 0, "message": "Rendering timed out"})
        raise HTTPException(status_code=500, detail="Rendering timed out after 5 minutes")

    if process.returncode != 0:
        logger.error(f"FFmpeg Error: {stderr}")
        print(f"DEBUG: FFmpeg Error - {stderr}")
        current_job_status.update({"status": "error", "progress": 0, "message": f"Rendering failed: {stderr[:100]}..."})
        raise HTTPException(status_code=500, detail=f"Rendering failed: {stderr}")

    logger.info(f"FFmpeg command succeeded")
    print(f"DEBUG: FFmpeg command succeeded")

    # Update final status
    current_job_status.update({"status": "completed", "progress": 100, "message": "Rendering complete!"})
        
    return FileResponse(output_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
