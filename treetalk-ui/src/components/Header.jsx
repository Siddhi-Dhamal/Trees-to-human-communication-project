import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wifi, Clock } from 'lucide-react'

export default function Header() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })

  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  return (
    <header className="header">
      <div className="header-left">
        <h1>TreeTalk</h1>
        <span className="tagline">Always Listening</span>
      </div>
      <div className="header-right">
        <motion.div
          className="status-badge"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Wifi size={14} />
          <span>Live</span>
        </motion.div>
        <div className="time-display">
          <Clock size={14} />
          <span>{timeStr}</span>
          <span className="date">{dateStr}</span>
        </div>
      </div>
    </header>
  )
}

