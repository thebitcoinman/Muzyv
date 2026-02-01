#!/usr/bin/env python3
"""
Test script to verify backend functionality
"""

import requests
import tempfile
import os
from pathlib import Path

def create_test_files():
    """Create temporary test files for audio and background"""
    # Create a simple test audio file using a system utility if available
    import subprocess
    
    # Create a temporary silent audio file
    audio_path = Path(tempfile.mktemp(suffix='.mp3'))
    try:
        # Generate a 3-second silent MP3 file
        subprocess.run([
            'ffmpeg', '-y', '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=3', 
            '-c:a', 'mp3', '-b:a', '64k', str(audio_path)
        ], capture_output=True, check=False)  # Using check=False to avoid exception if ffmpeg isn't available
        
        # If ffmpeg failed or doesn't exist, try to create a minimal file
        if not audio_path.exists():
            # Create a dummy file for testing purposes
            with open(audio_path, 'wb') as f:
                f.write(b'\x00' * 1024)  # Just some bytes to represent a file
    except:
        # If all else fails, create a dummy file
        with open(audio_path, 'wb') as f:
            f.write(b'\x00' * 1024)
    
    # Create a simple test image file
    bg_path = Path(tempfile.mktemp(suffix='.jpg'))
    try:
        # Generate a simple test image
        subprocess.run([
            'ffmpeg', '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=1920x1080:d=1', 
            '-c:v', 'mjpeg', '-q:v', '2', str(bg_path)
        ], capture_output=True, check=False)
        
        # If ffmpeg failed, create a dummy file
        if not bg_path.exists():
            with open(bg_path, 'wb') as f:
                f.write(b'\x00' * 1024)
    except:
        # If all else fails, create a dummy file
        with open(bg_path, 'wb') as f:
            f.write(b'\x00' * 1024)
    
    return audio_path, bg_path

def test_backend():
    """Test the backend render endpoint"""
    print("Testing backend functionality...")
    
    # Create test files
    audio_path, bg_path = create_test_files()
    
    print(f"Created test files: {audio_path}, {bg_path}")
    
    # Test data
    test_data = {
        'visualizer_type': 'spectrum',
        'text_color': '#FFFFFF',
        'bar_color': '#FFFFFF',
        'title': 'Test Title',
        'artist': 'Test Artist',
        'resolution': '1920x1080',
        'text_position': 'center',
        'preview_mode': 'false'  # Test full render
    }
    
    # Files to upload
    files = {
        'audio_file': open(audio_path, 'rb'),
        'background_file': open(bg_path, 'rb')
    }
    
    try:
        print("Making request to backend...")
        response = requests.post('http://localhost:8000/render', data=test_data, files=files)
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✓ SUCCESS: Backend processed the request successfully!")
            print(f"✓ Content type: {response.headers.get('content-type')}")
            print(f"✓ Content length: {len(response.content)} bytes")
            
            # Save the response to a file to verify it's a valid video
            output_path = Path('/tmp/test_output.mp4')
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"✓ Response saved to {output_path}")
            
            return True
        else:
            print(f"✗ FAILED: Backend returned status {response.status_code}")
            print(f"✗ Response text: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ FAILED: Cannot connect to backend server")
        return False
    except Exception as e:
        print(f"✗ FAILED: Error during request: {e}")
        return False
    finally:
        # Cleanup
        files['audio_file'].close()
        files['background_file'].close()
        try:
            os.unlink(audio_path)
            os.unlink(bg_path)
        except:
            pass

if __name__ == '__main__':
    success = test_backend()
    if success:
        print("\n✓ Backend test PASSED - rendering should work now!")
    else:
        print("\n✗ Backend test FAILED - there are still issues to resolve")