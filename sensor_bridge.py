#!/usr/bin/env python3
"""
Sensor Bridge: Reads Arduino serial data and pushes it to the Express backend.
Run this when your Arduino is connected. It will feed live sensor data to the web UI.
"""

import serial
import time
import requests
import sys
import json

# ============== CONFIG ==============
SERIAL_PORT = 'COM5'      # Change if your Arduino is on a different port
BAUD_RATE = 9600
BACKEND_URL = 'http://localhost:3001/api/sensors'
POLL_INTERVAL = 3         # seconds between reads
# ====================================

def connect_arduino():
    """Try to connect to Arduino with retries."""
    while True:
        try:
            print(f"🔌 Connecting to Arduino on {SERIAL_PORT}...")
            arduino = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
            time.sleep(2)  # Wait for Arduino reset
            print("✅ Arduino connected!")
            return arduino
        except serial.SerialException as e:
            print(f"❌ Could not connect: {e}")
            print(f"⏳ Retrying in 5 seconds... (Is the Arduino plugged in?)")
            time.sleep(5)

def parse_sensor_line(line):
    """Parse a 'key: value' line from Arduino."""
    line = line.strip()
    if ':' not in line:
        return None, None
    parts = line.split(':', 1)
    key = parts[0].strip().lower().replace(' ', '_')
    value = parts[1].strip()
    return key, value

def push_to_backend(sensor_data):
    """POST sensor data to the Express backend."""
    try:
        resp = requests.post(BACKEND_URL, json=sensor_data, timeout=5)
        if resp.status_code == 200:
            print(f"📡 Sent sensors → Backend: {json.dumps(sensor_data, indent=2)}")
            return True
        else:
            print(f"⚠️ Backend returned {resp.status_code}: {resp.text}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend not running! Start it with: node backend/server.js")
        return False
    except Exception as e:
        print(f"❌ Error sending to backend: {e}")
        return False

def main():
    print("=" * 50)
    print("🌳  TreeTalk Sensor Bridge")
    print("=" * 50)
    print(f"Serial: {SERIAL_PORT} @ {BAUD_RATE} baud")
    print(f"Backend: {BACKEND_URL}")
    print("=" * 50)
    print()

    arduino = connect_arduino()
    print("🌿 Reading sensor data... Press Ctrl+C to stop.\n")

    # Flush any old data
    arduino.reset_input_buffer()

    try:
        while True:
            data_buffer = ""
            start_time = time.time()

            # Read all available lines for up to POLL_INTERVAL seconds
            while time.time() - start_time < POLL_INTERVAL:
                if arduino.in_waiting > 0:
                    try:
                        line = arduino.readline().decode('utf-8').strip()
                        if line:
                            data_buffer += line + "\n"
                    except UnicodeDecodeError:
                        continue
                else:
                    time.sleep(0.1)

            # Parse all collected lines
            if data_buffer:
                current_reading = {}
                for line in data_buffer.strip().split("\n"):
                    key, value = parse_sensor_line(line)
                    if key and value:
                        current_reading[key] = value
                        print(f"  📊 {key}: {value}")

                if current_reading:
                    push_to_backend(current_reading)
                    print()

    except KeyboardInterrupt:
        print("\n👋 Sensor bridge stopped by user.")
    finally:
        arduino.close()
        print("🔌 Arduino disconnected.")

if __name__ == "__main__":
    main()
