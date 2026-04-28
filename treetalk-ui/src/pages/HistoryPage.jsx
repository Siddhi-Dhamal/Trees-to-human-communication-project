import { motion } from 'framer-motion'
import { MessageCircle, Reply, BarChart3, Clock, User, Sprout, Trash2, Download } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useState } from 'react'

export default function HistoryPage() {
  const { messages, sensorData } = useApp()
  const [filter, setFilter] = useState('all')

  const userMessages = messages.filter(m => m.sender === 'user')
  const treeMessages = messages.filter(m => m.sender === 'tree')

  const filteredMessages = filter === 'all' ? messages :
    filter === 'user' ? userMessages :
    treeMessages

  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      chatHistory: messages,
      latestSensors: sensorData
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `treetalk-history-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="history-page">
      <motion.h2
        className="page-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        📜 Conversation History
      </motion.h2>

      <div className="history-toolbar">
        <div className="history-filters">
          {['all', 'user', 'tree'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' && <>All ({messages.length})</>}
              {f === 'user' && <>Questions ({userMessages.length})</>}
              {f === 'tree' && <>Replies ({treeMessages.length})</>}
            </button>
          ))}
        </div>
        <motion.button
          className="export-btn"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleExport}
          disabled={messages.length === 0}
        >
          <Download size={16} />
          <span>Export</span>
        </motion.button>
      </div>

      <div className="history-grid">
        {/* Stats Cards */}
        <motion.div className="history-stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stat-card">
            <MessageCircle size={24} />
            <div>
              <span className="stat-number">{messages.length}</span>
              <span className="stat-label">Total Messages</span>
            </div>
          </div>
          <div className="stat-card">
            <User size={24} />
            <div>
              <span className="stat-number">{userMessages.length}</span>
              <span className="stat-label">Your Questions</span>
            </div>
          </div>
          <div className="stat-card">
            <Sprout size={24} />
            <div>
              <span className="stat-number">{treeMessages.length}</span>
              <span className="stat-label">Tree Replies</span>
            </div>
          </div>
        </motion.div>

        {/* Chat Timeline */}
        <motion.div
          className="history-card wide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="history-card-header">
            <Clock size={18} />
            <h3>Chat Timeline</h3>
            <span className="history-badge">{filteredMessages.length}</span>
          </div>

          {filteredMessages.length === 0 ? (
            <div className="history-empty">
              <MessageCircle size={48} />
              <p>No messages yet. Start chatting with your tree! 🌳</p>
            </div>
          ) : (
            <div className="chat-timeline">
              {filteredMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`timeline-item ${msg.sender}`}
                  initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="timeline-avatar">
                    {msg.sender === 'user' ? <User size={14} /> : <Sprout size={14} />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-sender">
                        {msg.sender === 'user' ? 'You' : 'Talkative Tree'}
                      </span>
                      <span className="timeline-time">{msg.time}</span>
                    </div>
                    <p className="timeline-text">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sensor Snapshot */}
        <motion.div
          className="history-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="history-card-header">
            <BarChart3 size={18} />
            <h3>Latest Sensor Readings</h3>
          </div>
          <div className="sensor-snapshot">
            {Object.entries(sensorData).filter(([k]) => !k.startsWith('_')).map(([key, value], i) => (
              <motion.div
                key={key}
                className="snapshot-item"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="snapshot-key">{key.replace(/_/g, ' ').toUpperCase()}</span>
                <span className="snapshot-value">{value}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

