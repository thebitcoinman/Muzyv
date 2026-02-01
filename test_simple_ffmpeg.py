#!/usr/bin/env python3
"""
Simple test to isolate the FFmpeg command issue
"""
import subprocess
import tempfile
import os
from pathlib import Path

def test_simple_ffmpeg_command():
    """Test a simplified version of our FFmpeg command"""
    print("Testing simplified FFmpeg command...")
    
    # Create simple test files
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as audio_file:
        audio_file.write(b'\x00' * 4096)  # Small dummy MP3 file
        audio_path = Path(audio_file.name)
    
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as bg_file:
        bg_file.write(b'\x00' * 4096)  # Small dummy image file
        bg_path = Path(bg_file.name)
    
    output_path = Path(tempfile.mktemp(suffix='.mp4'))
    
    try:
        # Simplified FFmpeg command similar to what our app would use
        ffmpeg_path = Path("/home/aiserver/dev/muzyv/muzyv_backend/bin/ffmpeg")
        
        # Basic command without complex filters
        cmd = [
            str(ffmpeg_path),
            "-y",  # Overwrite output
            "-stream_loop", "-1",  # Loop background
            "-i", str(bg_path),  # Background input
            "-i", str(audio_path),  # Audio input
            "-c:v", "libx264",  # Video codec
            "-preset", "medium",
            "-crf", "23",
            "-c:a", "aac",  # Audio codec
            "-b:a", "192k",  # Audio bitrate
            "-t", "5",  # Duration
            "-shortest",  # Stop at shortest input
            str(output_path)
        ]
        
        print(f"Running simplified command: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        print(f"Return code: {result.returncode}")
        if result.returncode != 0:
            print(f"STDERR: {result.stderr}")
            print(f"STDOUT: {result.stdout}")
            return False
        else:
            print("✓ Simplified command worked!")
            return True
            
    except subprocess.TimeoutExpired:
        print("✗ Command timed out")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False
    finally:
        # Cleanup
        try:
            os.unlink(audio_path)
            os.unlink(bg_path)
            if output_path.exists():
                os.unlink(output_path)
        except:
            pass

if __name__ == '__main__':
    success = test_simple_ffmpeg_command()
    if success:
        print("\n✓ Simplified FFmpeg command works - the issue is in the filters")
    else:
        print("\n✗ Even simplified command fails - there's a deeper issue")