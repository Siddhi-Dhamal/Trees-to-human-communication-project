import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Thermometer, Droplets, Wind, Cloud, Sun, CloudRain, Activity } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

const sensorConfig = [
  { key: 'temperature', name: 'Temperature', unit: '°C', icon: Thermometer, color: '#ef4444', bg: '#fef2f2', max: 50, parse: v => parseFloat(v) },
  { key: 'humidity', name: 'Humidity', unit: '%', icon: Droplets, color: '#3b82f6', bg: '#eff6ff', max: 100, parse: v => parseFloat(v) },
  { key: 'co', name: 'Carbon Monoxide', unit: 'ppm', icon: Wind, color: '#f59e0b', bg: '#fffbeb', max: 1000, parse: v => parseFloat(v) },
  { key: 'air_quality', name: 'Air Quality', unit: 'AQI', icon: Cloud, color: '#8b5cf6', bg: '#f5f3ff', max: 1000, parse: v => parseFloat(v) },
  { key: 'light', name: 'Light Level', unit: 'lux', icon: Sun, color: '#eab308', bg: '#fefce8', max: 1023, parse: v => parseFloat(v) },
  { key: 'rain', name: 'Rain Sensor', unit: '', icon: CloudRain, color: '#06b6d4', bg: '#ecfeff', max: 1023, parse: v => parseFloat(v) || 0 },
]

function getStatus(key, value, parsed) {
  if (key === 'rain') {
    return value === 'No Rain' ? { text: 'Dry', color: '#22c55e' } : { text: 'Raining', color: '#3b82f6' }
  }
  if (key === 'temperature') {
    if (parsed > 35) return { text: 'Hot!', color: '#ef4444' }
    if (parsed < 15) return { text: 'Cold', color: '#3b82f6' }
    return { text: 'Normal', color: '#22c55e' }
  }
  if (key === 'humidity') {
    if (parsed > 80) return { text: 'High', color: '#f59e0b' }
    if (parsed < 30) return { text: 'Low', color: '#f59e0b' }
    return { text: 'Good', color: '#22c55e' }
  }
  if (key === 'co') {
    if (parsed > 400) return { text: 'High CO', color: '#ef4444' }
    if (parsed > 200) return { text: 'Moderate', color: '#f59e0b' }
    return { text: 'Clean', color: '#22c55e' }
  }
  if (key === 'air_quality') {
    if (parsed > 400) return { text: 'Polluted', color: '#ef4444' }
    if (parsed > 200) return { text: 'Fair', color: '#f59e0b' }
    return { text: 'Fresh', color: '#22c55e' }
  }
  if (key === 'light') {
    if (parsed > 800) return { text: 'Bright', color: '#eab308' }
    if (parsed < 300) return { text: 'Dim', color: '#8b5cf6' }
    return { text: 'Good', color: '#22c55e' }
  }
  return { text: 'OK', color: '#22c55e' }
}

function SensorCard({ config, value, index, history }) {
  const Icon = config.icon
  const parsed = config.parse(value) || 0
  const pct = Math.min((parsed / config.max) * 100, 100)
  const status = getStatus(config.key, value, parsed)
  
  const chartData = history && history.length > 0 ? history : [
    { time: '1m ago', value: parsed * 0.9 },
    { time: 'now', value: parsed },
  ]

  return (
    <motion.div
      className="sensor-big-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div className="sbc-header">
        <div className="sbc-icon" style={{ background: config.bg, color: config.color }}>
          <Icon size={22} />
        </div>
        <div className="sbc-meta">
          <h3>{config.name}</h3>
          <span className="sbc-status" style={{ background: status.color + '18', color: status.color }}>{status.text}</span>
        </div>
      </div>
      <div className="sbc-value-row">
        <span className="sbc-value-num">{value || '--'}</span>
        {config.unit && <span className="sbc-value-unit">{config.unit}</span>}
      </div>
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${pct}%`, background: config.color }} />
      </div>
      <div className="sbc-chart" style={{ height: 100 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${config.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="value" stroke={config.color} fill={`url(#grad-${config.key})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

export default function SensorDashboardPage() {
  const { sensorData } = useApp()
  const [sensorHistory, setSensorHistory] = useState({})
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (!sensorData) return
    
    const meta = sensorData._meta || {}
    setLastUpdate(meta.lastUpdate)
    setIsLive(meta.source === 'arduino' && meta.isLive)
    
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    setSensorHistory(prev => {
      const next = { ...prev }
      sensorConfig.forEach(cfg => {
        const val = sensorData[cfg.key]
        if (val) {
          const parsed = cfg.parse(val) || 0
          const existing = next[cfg.key] || []
          next[cfg.key] = [...existing.slice(-20), { time: now, value: parsed }]
        }
      })
      return next
    })
  }, [sensorData])

  return (
    <div className="sensor-page">
      <div className="sensor-page-header">
        <div>
          <h2 className="sensor-page-title">IoT Sensor Dashboard</h2>
          <p className="sensor-page-sub">Real-time data from Arduino-connected sensors (DHT11, MQ-7, MQ-135, LDR, Raindrop)</p>
        </div>
        <div className="live-indicator">
          <Activity size={16} className={isLive ? 'live-pulse' : ''} color={isLive ? '#22c55e' : '#9ca3af'} />
          <span style={{ color: isLive ? '#22c55e' : '#9ca3af' }}>
            {isLive ? 'LIVE' : 'Demo Data'}
          </span>
          {lastUpdate && <span className="last-update">Updated: {new Date(lastUpdate).toLocaleTimeString()}</span>}
        </div>
      </div>
      
      <div className="sensor-full-grid">
        {sensorConfig.map((cfg, i) => (
          <SensorCard 
            key={cfg.key} 
            config={cfg} 
            value={sensorData[cfg.key]} 
            index={i}
            history={sensorHistory[cfg.key]}
          />
        ))}
      </div>
    </div>
  )
}
