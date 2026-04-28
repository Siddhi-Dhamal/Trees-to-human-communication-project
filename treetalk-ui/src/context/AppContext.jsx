import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const AppContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function AppProvider({ children }) {
  const [messages, setMessages] = useState([])
  const [sensorData, setSensorData] = useState({
    temperature: '28.5°C',
    humidity: '62%',
    co: '145 ppm',
    air_quality: '180 AQI',
    light: '750 lux',
    rain: 'No Rain',
  })
  const [apiStatus, setApiStatus] = useState('checking')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [currentPlant, setCurrentPlant] = useState(() => {
    try {
      const saved = localStorage.getItem('lastIdentifiedPlant')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognitionRef.current = recognition
    }
  }, [])

  // Check API health
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.json())
      .then(d => {
        if (d.groq_connected) setApiStatus('connected')
        else if (d.mode === 'demo') setApiStatus('demo')
        else setApiStatus('offline')
      })
      .catch(() => setApiStatus('offline'))
  }, [])

  // Fetch sensors periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API_BASE}/api/sensors`)
        .then(r => r.json())
        .then(setSensorData)
        .catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const speak = useCallback((text) => {
    if (!voiceEnabled || !synthRef.current) return
    synthRef.current.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1.05
    utter.pitch = 1.15
    utter.onstart = () => setIsSpeaking(true)
    utter.onend = () => setIsSpeaking(false)
    utter.onerror = () => setIsSpeaking(false)
    const voices = synthRef.current.getVoices()
    const preferred = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English'))
    if (preferred) utter.voice = preferred
    synthRef.current.speak(utter)
  }, [voiceEnabled])

  const updateCurrentPlant = useCallback((plant) => {
    setCurrentPlant(plant)
    if (plant) localStorage.setItem('lastIdentifiedPlant', JSON.stringify(plant))
    else localStorage.removeItem('lastIdentifiedPlant')
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Voice recognition not supported in this browser. Try Chrome/Edge!')
      return
    }
    setIsListening(true)
    let finalTranscript = ''

    recognitionRef.current.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        }
      }
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
      if (finalTranscript.trim()) {
        sendMessage(finalTranscript.trim())
      }
    }

    recognitionRef.current.onerror = (e) => {
      console.error('Speech error:', e.error)
      setIsListening(false)
    }

    recognitionRef.current.start()
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }, [])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    setMessages(prev => [...prev, { sender: 'user', text, time: now }])
    setIsTyping(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, sensorData, currentPlant }),
      })
      const data = await res.json()

      setIsTyping(false)
      const reply = data.reply || data.fallbackReply || "Oh no, my leaves are confused! 🍃"
      const rTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      setMessages(prev => [...prev, { sender: 'tree', text: reply, time: rTime }])
      speak(reply)
    } catch (err) {
      setIsTyping(false)
      const fallback = "My roots can't reach the internet right now! 🌱"
      const rTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setMessages(prev => [...prev, { sender: 'tree', text: fallback, time: rTime }])
      speak(fallback)
    }
  }, [sensorData, currentPlant, speak])

  return (
    <AppContext.Provider value={{
      messages, sendMessage, sensorData,
      apiStatus, isListening, isSpeaking, isTyping,
      voiceEnabled, setVoiceEnabled,
      startListening, stopListening, speak,
      currentPlant, updateCurrentPlant,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)

