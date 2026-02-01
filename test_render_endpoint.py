#!/usr/bin/env python3
"""
Test script to check the backend render endpoint
"""
import requests
import tempfile
import os
from pathlib import Path

def test_render_endpoint():
    """Test the render endpoint directly"""
    print("Testing render endpoint...")
    
    # Create minimal test files
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as audio_file:
        audio_file.write(b'\x00' * 4096)  # Small dummy MP3 file
        audio_path = Path(audio_file.name)
    
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as bg_file:
        bg_file.write(b'\x00' * 4096)  # Small dummy image file
        bg_path = Path(bg_file.name)
    
    try:
        # Test data
        test_data = {
            'visualizer_type': 'spectrum',
            'text_color': 'white',
            'bar_color': 'white',
            'title': 'Test Title',
            'artist': 'Test Artist',
            'resolution': '1920x1080',
            'text_position': 'center',
            'preview_mode': 'false'
        }
        
        # Files to upload
        files = {
            'audio_file': open(audio_path, 'rb'),
            'background_file': open(bg_path, 'rb')
        }
        
        print("Making request to render endpoint...")
        response = requests.post('http://localhost:8000/render', data=test_data, files=files, timeout=30)
        
        print(f"Response status: {response.status_code}")
        print(f"Response content length: {len(response.content)}")
        
        if response.status_code == 200:
            print("✓ SUCCESS: Render endpoint is working!")
            return True
        else:
            print(f"✗ FAILED: Render endpoint returned status {response.status_code}")
            print(f"Response text: {response.text[:500]}")  # First 500 chars
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ FAILED: Cannot connect to backend server")
        return False
    except requests.exceptions.Timeout:
        print("✗ FAILED: Request timed out")
        return False
    except Exception as e:
        print(f"✗ FAILED: Error during request: {e}")
        return False
    finally:
        # Cleanup
        files['audio_file'].close()
        files['background_file'].close()
        os.unlink(audio_path)
        os.unlink(bg_path)

if __name__ == '__main__':
    success = test_render_endpoint()
    if success:
        print("\n✓ Backend render endpoint is working correctly!")
    else:
        print("\n✗ Backend render endpoint has issues to resolve")