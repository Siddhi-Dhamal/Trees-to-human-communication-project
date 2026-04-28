import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import DashboardPage from './pages/DashboardPage'
import SensorDashboardPage from './pages/SensorDashboardPage'
import PlantIdentificationPage from './pages/PlantIdentificationPage'
import AlertsPage from './pages/AlertsPage'
import HistoryPage from './pages/HistoryPage'
import './App.css'

function App() {
  return (
    <AppProvider>
      <div className="app">
        <Sidebar />
        <div className="main">
          <Header />
          <main className="content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/sensors" element={<SensorDashboardPage />} />
              <Route path="/identify" element={<PlantIdentificationPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </AppProvider>
  )
}

export default App

