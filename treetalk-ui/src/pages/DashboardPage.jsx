import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Send, User, TreePine, Thermometer, Droplets, Wind,
  Cloud, Sun, CloudRain, Volume2, VolumeX, Wifi, WifiOff, Loader2
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const sensorConfig = [
  { key: 'temperature', name: 'Temperature', unit: '°C', icon: Thermometer, color: '#ef4444', bg: '#fef2f2' },
  { key: 'humidity', name: 'Humidity', unit: '%', icon: Droplets, color: '#3b82f6', bg: '#eff6ff' },
  { key: 'co', name: 'CO Level', unit: 'ppm', icon: Wind, color: '#f59e0b', bg: '#fffbeb' },
  { key: 'air_quality', name: 'Air Quality', unit: 'AQI', icon: Cloud, color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'light', name: 'Light', unit: 'lux', icon: Sun, color: '#eab308', bg: '#fefce8' },
  { key: 'rain', name: 'Rain', unit: '', icon: CloudRain, color: '#06b6d4', bg: '#ecfeff' },
]

const suggestedQuestions = [
  "How are you feeling today?",
  "Do you need water?",
  "What's the air quality?",
  "Tell me a tree joke!",
  "Are you getting enough light?",
  "What's your favorite season?",
]

export default function DashboardPage() {
  const {
    messages, sendMessage, sensorData, apiStatus,
    isListening, isSpeaking, isTyping, voiceEnabled,
    setVoiceEnabled, startListening, stopListening
  } = useApp()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  const handleSend = (text) => {
    if (!text.trim()) return
    sendMessage(text)
    setInput('')
  }

  const toggleVoice = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const getApiBadge = () => {
    if (apiStatus === 'connected') return { text: 'AI Online', color: '#22c55e', icon: Wifi }
    if (apiStatus === 'no_key') return { text: 'No API Key', color: '#f59e0b', icon: WifiOff }
    return { text: 'Offline', color: '#ef4444', icon: WifiOff }
  }

  const apiBadge = getApiBadge()

  return (
    <div className="dashboard-container">

      {/* Minimal API Status + Voice Toggle */}
      <div className="api-status-bar">
        <div className="api-status-pill" style={{ color: apiBadge.color }}>
          <span className="status-dot" style={{ background: apiBadge.color }} />
          <span className="status-text">{apiBadge.text}</span>
        </div>
        <button
          className="voice-toggle-btn"
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          title={voiceEnabled ? 'Voice ON' : 'Voice OFF'}
        >
          {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </div>

      {/* Quick Sensor Cards */}
      <div className="quick-sensors">
        {sensorConfig.map((s, i) => {
          const value = sensorData[s.key] || '--'
          const isRain = s.key === 'rain'
          const status = isRain
            ? (value === 'No Rain' ? 'Dry' : 'Raining')
            : (parseFloat(value) ? 'Normal' : 'OK')
          const statusColor = isRain
            ? (value === 'No Rain' ? '#22c55e' : '#3b82f6')
            : '#22c55e'

          return (
            <motion.div
              key={s.key}
              className="qs-card glass"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <div className="qs-header">
                <div className="qs-icon" style={{ background: s.bg, color: s.color }}>
                  <s.icon size={18} />
                </div>
                <span className="qs-name">{s.name}</span>
              </div>
              <div className="qs-value">
                {value}
                {s.unit && <span className="qs-unit">{s.unit}</span>}
              </div>
              <span className="qs-status" style={{ background: statusColor + '18', color: statusColor }}>
                {status}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-hero">
        {/* Tree Avatar / Voice Card */}
        <motion.div
          className="tree-avatar-card glass"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="tree-glow" />
          <div className={`tree-avatar ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''}`}>
            <TreePine size={64} />
            {(isSpeaking || isListening) && (
              <div className="tree-ring ring-1" />
            )}
            {(isSpeaking || isListening) && (
              <div className="tree-ring ring-2" />
            )}
          </div>

          <div className="tree-name">Talkative Tree</div>
          <div className="tree-status-text">
            {isListening ? 'Listening... Speak now!' : isSpeaking ? 'Speaking...' : isTyping ? 'Thinking...' : 'Ready to chat'}
          </div>

          <div className="voice-status">
            <motion.button
              className={`voice-btn-main ${isListening ? 'listening' : ''}`}
              onClick={toggleVoice}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.08 }}
            >
              {isListening ? <Loader2 size={28} className="spin" /> : <Mic size={28} />}
            </motion.button>

            <div className={`voice-waves ${isListening || isSpeaking ? 'active' : ''}`}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="voice-wave" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>

            <span className="voice-hint">
              {isListening ? 'Say something...' : 'Tap mic to talk'}
            </span>
          </div>

          {/* Live transcript when listening */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                className="live-transcript"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="transcript-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span>Listening...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Chat Panel */}
        <motion.div
          className="chat-section glass"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="chat-header-bar">
            <div className="chat-header-left">
              <TreePine size={18} color="#22c55e" />
              <h3>Chat with Talkative Tree</h3>
            </div>
            <div className="chat-header-right">
              {isTyping && (
                <span className="typing-label">
                  <Loader2 size={12} className="spin" />
                  Thinking
                </span>
              )}
            </div>
          </div>

          <div className="chat-messages-area">
            {messages.length === 0 && (
              <div className="chat-empty">
                <TreePine size={48} color="#22c55e" opacity={0.3} />
                <p>Say hello to your tree friend!</p>
                <span>Tap the mic or type a message</span>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`chat-msg ${msg.sender}`}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="chat-msg-avatar">
                    {msg.sender === 'user' ? <User size={14} /> : <TreePine size={14} />}
                  </div>
                  <div className="chat-msg-content">
                    <div className="chat-msg-body">{msg.text}</div>
                    <div className="chat-msg-time">{msg.time}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                className="chat-typing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="typing-dots">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
                <span>Tree is thinking...</span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-bar">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask the tree anything..."
              disabled={isTyping}
            />
            <motion.button
              onClick={() => handleSend(input)}
              whileTap={{ scale: 0.9 }}
              disabled={isTyping || !input.trim()}
            >
              <Send size={18} />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Suggested Questions */}
      <motion.div
        className="suggested-wrap glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h4>Try Asking</h4>
        <div className="suggested-chips">
          {suggestedQuestions.map((q, i) => (
            <motion.button
              key={i}
              className="schip"
              onClick={() => handleSend(q)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {q}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

