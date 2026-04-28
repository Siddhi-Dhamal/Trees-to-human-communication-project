import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Activity,
  ScanLine,
  Bell,
  History,
  TreePine
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/sensors', label: 'Sensors', icon: Activity },
  { path: '/identify', label: 'Identify', icon: ScanLine },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/history', label: 'History', icon: History },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <motion.aside
        className="sidebar"
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="sidebar-header">
          <motion.div
            className="logo-icon"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            <TreePine size={28} />
          </motion.div>
          {!collapsed && (
            <motion.span
              className="logo-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              TreeTalk
            </motion.span>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
                title={collapsed ? item.label : ''}
              >
                <Icon size={22} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </motion.aside>

      {/* Mobile overlay */}
      <div className="sidebar-mobile">
        <div className="mobile-logo">
          <TreePine size={24} />
          <span>TreeTalk</span>
        </div>
        <nav className="mobile-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `mobile-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </>
  )
}

