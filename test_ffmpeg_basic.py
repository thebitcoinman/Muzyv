#!/usr/bin/env python3
"""
Test basic FFmpeg functionality
"""
import subprocess
import tempfile
import os
from pathlib import Path

def test_basic_ffmpeg():
    """Test basic FFmpeg functionality with our binary"""
    print("Testing basic FFmpeg functionality...")
    
    # Path to our FFmpeg binary
    ffmpeg_path = Path("/home/aiserver/dev/muzyv/muzyv_backend/bin/ffmpeg")
    
    # Test basic functionality
    try:
        result = subprocess.run([str(ffmpeg_path), "-version"], 
                              capture_output=True, text=True, timeout=10)
        print(f"FFmpeg version check: {result.returncode}")
        if result.returncode == 0:
            print("✓ FFmpeg binary is accessible and working")
            print(f"Version info (first 200 chars): {result.stdout[:200]}")
        else:
            print(f"✗ FFmpeg version check failed: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("✗ FFmpeg command timed out")
        return False
    except Exception as e:
        print(f"✗ Error running FFmpeg: {e}")
        return False
    
    # Test with a simple filter to see if filters work
    try:
        # Create a minimal test
        result = subprocess.run([
            str(ffmpeg_path), "-y", 
            "-f", "lavfi", "-i", "testsrc=size=1920x1080:rate=1", 
            "-vf", "hue=s=0",  # Simple filter
            "-t", "1", 
            "-f", "null", "-"
        ], capture_output=True, text=True, timeout=30)
        
        print(f"\nSimple filter test: {result.returncode}")
        if result.returncode == 0:
            print("✓ Simple filter works")
        else:
            print(f"✗ Simple filter failed: {result.stderr[:200]}")
            return False
    except Exception as e:
        print(f"✗ Error with simple filter: {e}")
        return False
    
    print("\n✓ Basic FFmpeg functionality is working")
    return True

if __name__ == '__main__':
    success = test_basic_ffmpeg()
    if not success:
        print("\n✗ Basic FFmpeg functionality has issues")