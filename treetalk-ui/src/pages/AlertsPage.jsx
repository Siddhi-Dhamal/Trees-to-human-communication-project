import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Thermometer, Droplets, Wind, Cloud, Sun, CloudRain, Activity } from 'lucide-react'
import { useApp } from '../context/AppContext'

const iconMap = { Thermometer, Droplets, Wind, Cloud, Sun, CloudRain }
const typeConfig = {
  danger:  { color: '#ef4444', bg: '#fee2e2', label: 'Critical' },
  warning: { color: '#f59e0b', bg: '#fef3c7', label: 'Warning' },
  success: { color: '#22c55e', bg: '#dcfce7', label: 'Resolved' },
  info:    { color: '#3b82f6', bg: '#dbeafe', label: 'Info' },
}

function generateLiveAlerts(sensorData) {
  const alerts = []
  if (!sensorData) return alerts

  const temp = parseFloat(sensorData.temperature)
  const hum = parseFloat(sensorData.humidity)
  const co = parseFloat(sensorData.co)
  const aqi = parseFloat(sensorData.air_quality)
  const light = parseFloat(sensorData.light)
  const rain = sensorData.rain

  // Temperature alerts
  if (temp > 35) {
    alerts.push({ id: 't1', type: 'danger', sensor: 'Temperature', title: 'High Temperature!', message: `Temperature is ${temp}C - too hot! Provide shade or ventilation.`, time: 'Now', icon: 'Thermometer' })
  } else if (temp < 15) {
    alerts.push({ id: 't2', type: 'warning', sensor: 'Temperature', title: 'Low Temperature', message: `Temperature is ${temp}C - plant may be cold. Move to warmer spot.`, time: 'Now', icon: 'Thermometer' })
  } else {
    alerts.push({ id: 't3', type: 'success', sensor: 'Temperature', title: 'Temperature Optimal', message: `Temperature ${temp}C is within ideal range (18-30C).`, time: 'Now', icon: 'Thermometer' })
  }

  // Humidity alerts
  if (hum > 80) {
    alerts.push({ id: 'h1', type: 'warning', sensor: 'Humidity', title: 'High Humidity', message: `Humidity ${hum}% - risk of fungal disease.`, time: 'Now', icon: 'Droplets' })
  } else if (hum < 30) {
    alerts.push({ id: 'h2', type: 'warning', sensor: 'Humidity', title: 'Low Humidity', message: `Humidity ${hum}% - mist the plant or use humidity tray.`, time: 'Now', icon: 'Droplets' })
  } else {
    alerts.push({ id: 'h3', type: 'success', sensor: 'Humidity', title: 'Humidity Good', message: `Humidity ${hum}% is in ideal range (50-70%).`, time: 'Now', icon: 'Droplets' })
  }

  // CO alerts
  if (co > 400) {
    alerts.push({ id: 'c1', type: 'danger', sensor: 'CO Level', title: 'High CO Detected!', message: `CO level ${co}ppm - ensure proper ventilation!`, time: 'Now', icon: 'Wind' })
  } else if (co > 200) {
    alerts.push({ id: 'c2', type: 'warning', sensor: 'CO Level', title: 'Moderate CO', message: `CO level ${co}ppm - slightly elevated.`, time: 'Now', icon: 'Wind' })
  } else {
    alerts.push({ id: 'c3', type: 'success', sensor: 'CO Level', title: 'Air Clean', message: `CO level ${co}ppm - clean air!`, time: 'Now', icon: 'Wind' })
  }

  // Air Quality alerts
  if (aqi > 400) {
    alerts.push({ id: 'a1', type: 'danger', sensor: 'Air Quality', title: 'Poor Air Quality!', message: `AQI ${aqi} - hazardous levels!`, time: 'Now', icon: 'Cloud' })
  } else if (aqi > 200) {
    alerts.push({ id: 'a2', type: 'warning', sensor: 'Air Quality', title: 'Fair Air Quality', message: `AQI ${aqi} - slightly polluted.`, time: 'Now', icon: 'Cloud' })
  } else {
    alerts.push({ id: 'a3', type: 'success', sensor: 'Air Quality', title: 'Fresh Air', message: `AQI ${aqi} - air is fresh and clean!`, time: 'Now', icon: 'Cloud' })
  }

  // Light alerts
  if (light < 300) {
    alerts.push({ id: 'l1', type: 'warning', sensor: 'Light', title: 'Low Light', message: `Light ${light} lux - move plant to brighter area.`, time: 'Now', icon: 'Sun' })
  } else if (light > 1000) {
    alerts.push({ id: 'l2', type: 'info', sensor: 'Light', title: 'Bright Light', message: `Light ${light} lux - excellent for photosynthesis!`, time: 'Now', icon: 'Sun' })
  } else {
    alerts.push({ id: 'l3', type: 'success', sensor: 'Light', title: 'Good Light', message: `Light ${light} lux - sufficient for growth.`, time: 'Now', icon: 'Sun' })
  }

  // Rain alert
  if (rain !== 'No Rain') {
    alerts.push({ id: 'r1', type: 'info', sensor: 'Rain', title: 'Rain Detected', message: `${rain} - plant is getting natural water!`, time: 'Now', icon: 'CloudRain' })
  } else {
    alerts.push({ id: 'r2', type: 'success', sensor: 'Rain', title: 'No Rain', message: 'No rain - check if plant needs watering.', time: 'Now', icon: 'CloudRain' })
  }

  return alerts
}

export default function AlertsPage() {
  const { sensorData } = useApp()
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    setAlerts(generateLiveAlerts(sensorData))
  }, [sensorData])

  const counts = { danger: 0, warning: 0, success: 0, info: 0 }
  alerts.forEach(a => { if (counts[a.type] !== undefined) counts[a.type]++ })

  const meta = sensorData?._meta || {}
  const isLive = meta.source === 'arduino' && meta.isLive

  return (
    <div className="alerts-page">
      <div className="sensor-page-header">
        <div>
          <h2 className="sensor-page-title">Smart Alerts</h2>
          <p className="sensor-page-sub">Real-time sensor threshold monitoring</p>
        </div>
        <div className="live-indicator">
          <Activity size={16} className={isLive ? 'live-pulse' : ''} color={isLive ? '#22c55e' : '#9ca3af'} />
          <span style={{ color: isLive ? '#22c55e' : '#9ca3af' }}>
            {isLive ? 'LIVE' : 'Demo'}
          </span>
        </div>
      
      <div className="alert-summary">
        {Object.entries(counts).filter(([_, count]) => count > 0).map(([type, count]) => (
          <motion.div key={type} className="as-card" style={{ color: typeConfig[type].color }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AlertTriangle size={28} />
            <span className="as-count">{count}</span>
            <span className="as-label">{typeConfig[type].label}</span>
          </motion.div>
        ))}
      </div>

      <div className="alert-list">
        {alerts.map((a, i) => {
          const cfg = typeConfig[a.type]
          const Icon = iconMap[a.icon] || AlertTriangle
          return (
            <motion.div
              key={a.id}
              className={`alert-item ${a.type}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="alert-icon-box" style={{ background: cfg.color }}>
                <Icon size={20} />
              </div>
              <div className="alert-body">
                <div className="alert-head">
                  <h4>{a.title}</h4>
                  <span className="alert-tag">{a.sensor}</span>
                </div>
                <p className="alert-msg">{a.message}</p>
                <span className="alert-time">{a.time}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
    </div>
  )
}
