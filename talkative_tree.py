import serial
import time
import speech_recognition as sr
import pyttsx3
import cv2
import numpy as np
from collections import deque, namedtuple
import tensorflow as tf
from groq import Groq
import os
from dotenv import load_dotenv

# =====================================================
# LOAD ENV & SETUP GEMINI
# =====================================================
load_dotenv()
<<<<<<< HEAD
groq_client = Groq(api_key=os.getenv(""))
=======
groq_client = Groq(api_key=os.getenv("GROQ_KEY"))
>>>>>>> 28a33072ec3449956f7b9712b2069be3cc6f307c
# =====================================================
# BST Node (for labels)
# =====================================================
class LabelNode:
    def __init__(self, label):
        self.label = label
        self.left = None
        self.right = None

# =====================================================
# SETUP
# =====================================================
arduino = serial.Serial('COM5', 9600, timeout=1)
time.sleep(2)

engine = pyttsx3.init()
engine.setProperty('rate', 180)
engine.setProperty('volume', 1.0)

# Set cute voice
voices = engine.getProperty('voices')
try:
    engine.setProperty('voice', voices[1].id)
except:
    pass

command_queue = deque(maxlen=5)
reply_stack = []
sensor_dict = {}

SensorReading = namedtuple("SensorReading", ["time", "data"])
sensor_history = []

VALID_INFO_COMMANDS = {"show last reply", "show recent questions", "tell me your species"}

label_bst_root = None

# =====================================================
# LOAD TFLITE MODEL
# =====================================================
model_path = "model_new.tflite"
label_path = "labels.txt"

interpreter = tf.lite.Interpreter(model_path=model_path)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# =====================================================
# BST FUNCTIONS
# =====================================================
def insert_label_bst(root, label):
    if root is None:
        return LabelNode(label)
    if label < root.label:
        root.left = insert_label_bst(root.left, label)
    else:
        root.right = insert_label_bst(root.right, label)
    return root

def find_label_bst(root, label):
    if root is None:
        return None
    if root.label == label:
        return root
    if label < root.label:
        return find_label_bst(root.left, label)
    return find_label_bst(root.right, label)

# Load labels + populate BST
with open(label_path, "r") as f:
    labels = [line.strip() for line in f.readlines()]
    for lbl in labels:
        label_bst_root = insert_label_bst(label_bst_root, lbl)

# =====================================================
# CLASSIFICATION FUNCTION
# =====================================================
def classify_frame(frame):
    img = cv2.resize(frame, (224, 224))
    img = img.astype(np.float32) / 255.0
    img = np.expand_dims(img, axis=0)

    interpreter.set_tensor(input_details[0]['index'], img)
    interpreter.invoke()

    output = interpreter.get_tensor(output_details[0]['index'])[0]

    index = int(np.argmax(output))
    confidence = float(output[index])

    plant_name = labels[index]
    return (plant_name, confidence)

# =====================================================
# READ SENSOR DATA
# =====================================================
def get_sensor_data():
    time.sleep(3)
    data = ""
    while arduino.in_waiting > 0:
        line = arduino.readline().decode('utf-8').strip()
        if line:
            data += line + "\n"

    lines = data.strip().split("\n")
    current_sensor_data = {}

    for line in lines:
        parts = line.split(":")
        if len(parts) >= 2:
            key = parts[0].strip().lower()
            value = parts[1].strip()
            current_sensor_data[key] = value
            sensor_dict[key] = value

    if current_sensor_data:
        sensor_history.append(SensorReading(time=time.time(), data=current_sensor_data.copy()))

    return data.strip()

# =====================================================
# LISTEN TO USER
# =====================================================
def listen_to_user():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("\n🎤 Listening...")
        audio = r.listen(source)

    try:
        text = r.recognize_google(audio)
        print("You said:", text)
        command_queue.append(text)
        return text
    except:
        print("❌ Could not understand.")
        return None

def ask_gemini(sensor_info, user_query):
    # Shorten sensor info to avoid token limit
    short_sensor = {k: v for k, v in list(sensor_info.items())[:4]}
    
    prompt = f"""You are a cute cartoon tree. Sensors: {short_sensor}. User said: '{user_query}'. Reply in 1-2 funny cute sentences."""

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=80,
        temperature=0.8,
    )

    reply = response.choices[0].message.content.strip()
    reply_stack.append(reply)
    return reply

# =====================================================
# SPEAK
# =====================================================
def speak(text):
    engine.say(text)
    engine.runAndWait()

# =====================================================
# MAIN PROGRAM
# =====================================================
print("\nReading sensor data...")
get_sensor_data()

print("====================================")
print(" 🌳 Sensor Readings ")
print("====================================")
for key, value in sensor_dict.items():
    print(f"{key.capitalize():<10}: {value}")
print("====================================\n")

speak("Hii, I am your talking tree! I am ready to help you!")

cap = cv2.VideoCapture(0)

# MAIN LOOP
while True:
    print("\n🌿 Tell me something... (say 'tell me your species')")
    user_input = listen_to_user()

    if not user_input:
        continue

    text = user_input.lower()

    # -------------------------------------------------
    # HANDLE SPECIAL COMMANDS
    # -------------------------------------------------
    if text in VALID_INFO_COMMANDS:

        if text == "show last reply":
            if reply_stack:
                speak(reply_stack[-1])
            else:
                speak("I don't remember anything yet!")
            continue

        if text == "show recent questions":
            speak("Here are your recent questions!")
            print(list(command_queue))
            continue

        # ========== SPECIES IDENTIFICATION ==========
        if text == "tell me your species":
            speak("Okay! Hold the leaf in front of the camera.")
            time.sleep(2)

            ret, frame = cap.read()
            if not ret:
                speak("Oops! I cannot see anything.")
                continue

            plant_name, conf = classify_frame(frame)

            if find_label_bst(label_bst_root, plant_name):
                print(f"I am '{plant_name}' tree.")

            speak(f"Yay! I am a {plant_name} tree!")
            continue

    # -------------------------------------------------
    # NORMAL CHAT MODE
    # -------------------------------------------------
    ai_reply = ask_gemini(sensor_dict, user_input)
    print("Tree:", ai_reply)
    speak(ai_reply)