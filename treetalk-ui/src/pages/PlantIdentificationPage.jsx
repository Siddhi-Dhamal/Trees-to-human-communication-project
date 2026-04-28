import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, ScanLine, Leaf, CheckCircle, X, RefreshCw } from 'lucide-react'
import * as tf from '@tensorflow/tfjs'

const LABELS = ['Mango', 'Orchid', 'Ashoka']

const plantInfo = {
  Mango: {
    scientific: 'Mangifera indica',
    origin: 'South Asia',
    description: 'The mango is a tropical stone fruit known as the "king of fruits." Its leaves are elongated, leathery, and dark green.',
    funFact: 'Mango trees can live for over 300 years and continue to bear fruit! 🥭',
    color: '#ff9f43'
  },
  Orchid: {
    scientific: 'Orchidaceae',
    origin: 'Worldwide (tropical regions)',
    description: 'Orchids are one of the largest families of flowering plants with over 25,000 species. Their leaves are typically fleshy and elongated.',
    funFact: 'Vanilla is extracted from the pod of an orchid species! 🌸',
    color: '#e056fd'
  },
  Ashoka: {
    scientific: 'Saraca asoca',
    origin: 'Indian subcontinent',
    description: 'The Ashoka tree is considered sacred in India. It has compound leaves with 4-6 pairs of leaflets and beautiful orange flowers.',
    funFact: 'Ashoka means "without sorrow" in Sanskrit and is mentioned in ancient Indian texts! 🌳',
    color: '#20bf6b'
  }
}

export default function PlantIdentificationPage() {
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [identifying, setIdentifying] = useState(false)
  const [result, setResult] = useState(null)
  const [model, setModel] = useState(null)
  const [modelLoading, setModelLoading] = useState(true)
  const [cameraActive, setCameraActive] = useState(false)
  const [error, setError] = useState(null)

  // Load TFJS model
  useEffect(() => {
    let mounted = true
    async function loadModel() {
      try {
        setModelLoading(true)
        const loadedModel = await tf.loadLayersModel('/model/model.json')
        if (mounted) {
          setModel(loadedModel)
          setModelLoading(false)
        }
      } catch (err) {
        console.error('Model load error:', err)
        if (mounted) {
          setError('Failed to load plant model. Please refresh.')
          setModelLoading(false)
        }
      }
    }
    loadModel()
    return () => { mounted = false }
  }, [])

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraActive(true)
        setError(null)
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError('Camera access denied. Please allow camera permission or upload an image.')
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }, [])

  // Capture from camera
  const handleCapture = useCallback(() => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg')
    setCapturedImage(dataUrl)
    setResult(null)
    stopCamera()
  }, [stopCamera])

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setCapturedImage(event.target.result)
      setResult(null)
      stopCamera()
    }
    reader.readAsDataURL(file)
  }, [stopCamera])

  // Classify image using TFJS
  const classifyImage = useCallback(async () => {
    if (!model || !capturedImage) return
    setIdentifying(true)
    setError(null)

    try {
      const img = new Image()
      img.src = capturedImage
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const tensor = tf.tidy(() => {
        const t = tf.browser.fromPixels(img)
        const resized = tf.image.resizeBilinear(t, [224, 224])
        const normalized = resized.div(255.0)
        return normalized.expandDims(0)
      })

      const predictions = await model.predict(tensor).data()
      tf.dispose(tensor)

      const maxIndex = predictions.indexOf(Math.max(...predictions))
      const confidence = Math.round(predictions[maxIndex] * 100)
      const plantName = LABELS[maxIndex]

      const allPredictions = LABELS.map((name, i) => ({
        name,
        confidence: Math.round(predictions[i] * 100)
      })).sort((a, b) => b.confidence - a.confidence)

      setResult({
        name: plantName,
        confidence,
        allPredictions,
        info: plantInfo[plantName]
      })
    } catch (err) {
      console.error('Classification error:', err)
      setError('Failed to classify image. Please try again.')
    } finally {
      setIdentifying(false)
    }
  }, [model, capturedImage])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  return (
    <div className="identify-page">
      <motion.h2
        className="page-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🌿 Plant Identification
      </motion.h2>

      {modelLoading && (
        <motion.div className="model-loading-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="spinner-small" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} />
          <span>Loading plant model...</span>
        </motion.div>
      )}

      {error && (
        <motion.div className="error-banner" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <X size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </motion.div>
      )}

      <div className="identify-grid">
        {/* Camera / Upload Section */}
        <motion.div
          className="capture-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>📷 Capture or Upload Leaf Image</h3>
          <div className="capture-area">
            {cameraActive ? (
              <video ref={videoRef} className="camera-feed" autoPlay playsInline muted />
            ) : capturedImage ? (
              <motion.img
                src={capturedImage}
                alt="Captured leaf"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="captured-image"
              />
            ) : (
              <div className="capture-placeholder">
                <ScanLine size={48} />
                <p>Hold a leaf in front of the camera or upload an image</p>
                <span className="placeholder-hint">Supports: Mango, Orchid, Ashoka</span>
              </div>
            )}
          </div>

          <div className="capture-buttons">
            {cameraActive ? (
              <>
                <motion.button
                  className="capture-btn primary"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCapture}
                >
                  <Camera size={18} />
                  <span>Capture Image</span>
                </motion.button>
                <motion.button
                  className="capture-btn secondary"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={stopCamera}
                >
                  <X size={18} />
                  <span>Cancel</span>
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  className="capture-btn primary"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={startCamera}
                  disabled={modelLoading}
                >
                  <Camera size={18} />
                  <span>Open Camera</span>
                </motion.button>
                <motion.button
                  className="capture-btn secondary"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={modelLoading}
                >
                  <Upload size={18} />
                  <span>Upload Image</span>
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </>
            )}
          </div>

          {capturedImage && !cameraActive && (
            <div className="retake-row">
              <motion.button
                className="capture-btn outline"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setCapturedImage(null)
                  setResult(null)
                  startCamera()
                }}
              >
                <RefreshCw size={16} />
                <span>Retake</span>
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Results Section */}
        <motion.div
          className="result-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3>🔍 Identification Result</h3>

          <AnimatePresence mode="wait">
            {!result && !identifying && (
              <motion.div
                key="empty"
                className="result-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Leaf size={48} />
                <p>Capture or upload a leaf image, then tap Identify</p>
                <motion.button
                  className="identify-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={classifyImage}
                  disabled={!capturedImage || modelLoading}
                >
                  <ScanLine size={18} />
                  <span>Identify Plant</span>
                </motion.button>
              </motion.div>
            )}

            {identifying && (
              <motion.div
                key="loading"
                className="result-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="spinner"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <ScanLine size={40} />
                </motion.div>
                <p>Analyzing leaf with AI model...</p>
                <span className="loading-hint">Running MobileNetV2 on TensorFlow.js</span>
              </motion.div>
            )}

            {result && (
              <motion.div
                key="result"
                className="result-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="result-main">
                  <CheckCircle size={32} color={result.info.color} />
                  <div>
                    <span className="result-name" style={{ color: result.info.color }}>
                      {result.name}
                    </span>
                    <span className="result-scientific">{result.info.scientific}</span>
                    <div className="confidence-bar">
                      <div className="confidence-track">
                        <motion.div
                          className="confidence-fill"
                          style={{ background: result.info.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <span>{result.confidence}% confidence</span>
                    </div>
                  </div>
                </div>

                <div className="result-info">
                  <p className="result-description">{result.info.description}</p>
                  <div className="fun-fact">
                    <span className="fun-fact-label">💡 Fun Fact</span>
                    <p>{result.info.funFact}</p>
                  </div>
                </div>

                <div className="species-list">
                  <h4>All Predictions</h4>
                  {result.allPredictions.map((s, i) => (
                    <div key={i} className={`species-item ${i === 0 ? 'top' : ''}`}>
                      <span>{s.name}</span>
                      <div className="species-confidence">
                        <div className="species-track">
                          <motion.div
                            className="species-fill"
                            style={{ background: plantInfo[s.name]?.color || '#888' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${s.confidence}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                          />
                        </div>
                        <span>{s.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <motion.button
                  className="identify-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setCapturedImage(null)
                    setResult(null)
                  }}
                >
                  <RefreshCw size={18} />
                  <span>Scan Another Plant</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

