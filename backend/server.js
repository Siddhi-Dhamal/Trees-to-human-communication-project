const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const groqApiKey = process.env.GROQ_KEY || process.env.GROQ_API_KEY;
let groq = null;
if (groqApiKey && groqApiKey.startsWith('gsk_')) {
  try { groq = new (require('groq-sdk'))({ apiKey: groqApiKey }); console.log('GROQ ready'); }
  catch (e) { console.warn('GROQ failed:', e.message); }
} else {
  console.log('No GROQ key - DEMO mode. Get free key: https://console.groq.com/keys');
}

let latestSensorData = {
  temperature: "28.5C",
  humidity: "62%",
  co: "145 ppm",
  air_quality: "180 AQI",
  light: "750 lux",
  rain: "No Rain"
};
let lastSensorUpdate = null;
let sensorSource = 'demo';

const DEFAULT_PLANT = {
  name: "Tulsi",
  scientificName: "Ocimum tenuiflorum",
  confidence: 0.98,
  idealTemp: "18-30C",
  idealHumidity: "50-70%",
  waterNeeds: "Moderate - keep soil moist but not waterlogged. Water when top inch feels dry.",
  lightNeeds: "Full sun - 6-8 hours daily. I love bright light!",
  soilType: "Well-draining, fertile soil with pH 6.0-7.5",
  specialCare: "I am sacred in India! Pinch my tips to make me bushy. Protect from frost.",
  benefits: "I purify air, repel mosquitoes, and my leaves make healing tea!"
};
let currentPlant = DEFAULT_PLANT;

const getFallbackReply = (question) => {
  const q = question.toLowerCase();
  const s = latestSensorData;

  if (q.includes('who') || q.includes('what are you') || q.includes('which plant') || q.includes('species') || q.includes('your name')) {
    return "Namaste! I am Tulsi (Holy Basil) - Ocimum tenuiflorum! I am a sacred herb from India. My leaves make healing tea!";
  }

  if (q.includes('ideal') || q.includes('perfect') || q.includes('need') || q.includes('requirement') || q.includes('care')) {
    if (q.includes('temp')) {
      const t = parseFloat(s.temperature);
      return "My ideal temperature is 18-30C. Right now it is " + s.temperature + " - " + (t > 30 ? "a bit hot!" : t < 18 ? "a bit chilly!" : "perfect!");
    }
    if (q.includes('humid')) {
      const h = parseFloat(s.humidity);
      return "I love 50-70% humidity. Currently " + s.humidity + " - " + (h < 50 ? "a bit dry, mist me!" : h > 70 ? "quite humid!" : "just right!");
    }
    if (q.includes('water') || q.includes('drink') || q.includes('thirsty')) {
      return "Water: keep soil moist but not waterlogged. Water when top inch feels dry. Check my soil moisture sensor!";
    }
    if (q.includes('light') || q.includes('sun')) {
      return "I need full sun - 6-8 hours daily. Right now I am getting " + s.light + " of light.";
    }
    return "My care needs: Temp 18-30C | Humidity 50-70% | Full sun 6-8hrs | Water when top inch dry | Well-draining soil pH 6.0-7.5";
  }

  if (q.includes('temp') || q.includes('hot') || q.includes('cold') || q.includes('warm')) {
    const t = parseFloat(s.temperature);
    return "It is " + s.temperature + " right now! My ideal is 18-30C. " + (t > 30 ? "Phew, I am sweating! Need shade!" : t < 18 ? "Brrr, my leaves are shivering!" : "Ahh, just perfect for my holy leaves!");
  }

  if (q.includes('humid')) {
    const h = parseFloat(s.humidity);
    return "Humidity is " + s.humidity + ". I prefer 50-70%. " + (h < 40 ? "Too dry! My leaves might crisp!" : h > 80 ? "Very muggy! Watch for diseases!" : "Comfortable for my roots!");
  }

  if (q.includes('water') || q.includes('soil') || q.includes('moist')) {
    return "Water check: Keep soil moist but not waterlogged. My current sensor says... trust your finger - poke the soil! If dry top inch, give me a drink!";
  }

  if (q.includes('light') || q.includes('sun') || q.includes('bright')) {
    const l = parseFloat(s.light);
    return "Light level: " + s.light + ". " + (l < 300 ? "Too dark! I need 6-8 hours of sun to stay holy!" : l > 1000 ? "Blazing! I love it but might need afternoon shade!" : "Perfect for photosynthesis! Praise the sun!");
  }

  if (q.includes('air') || q.includes('quality') || q.includes('pollution') || q.includes('co')) {
    return "Air Quality: " + s.air_quality + ", CO: " + s.co + ". " + (parseFloat(s.co) > 200 ? "Air is a bit polluted! Good thing I purify it!" : "Clean and fresh! I am doing my purification job!");
  }

  if (q.includes('rain')) {
    return s.rain === 'No Rain' ? "No rain detected! My soil is dry - maybe water me?" : "Rain detected! My roots are drinking from the sky!";
  }

  if (q.includes('benefit') || q.includes('use') || q.includes('medicine') || q.includes('tea') || q.includes('heal')) {
    return currentPlant.benefits;
  }

  if (q.includes('sacred') || q.includes('holy') || q.includes('india') || q.includes('prayer')) {
    return "Yes! I am Tulsi - the Queen of Herbs! In India, I am worshipped as a goddess. Every home has me in their courtyard. I bring purity and protection!";
  }

  if (q.includes('feel')) {
    const t = parseFloat(s.temperature);
    return "I am feeling " + (t > 30 ? 'a bit overheated' : t < 18 ? 'chilly' : 'blessed and photosynthetically fantastic') + "! My sensors: " + s.temperature + ", " + s.humidity + " humidity.";
  }

  if (q.includes('joke')) return "Why did the Tulsi plant go to school? To become a little sage!";

  if (q.includes('hello') || q.includes('hi') || q.includes('namaste')) {
    return "Namaste! I am your Tulsi tree! Ready to purify your air and bless your home!";
  }

  return "My current readings: Temp " + s.temperature + " | Humidity " + s.humidity + " | Light " + s.light + " | Air " + s.air_quality + ". Ask me about my ideal conditions!";
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', groq_connected: !!groq, mode: groq ? 'ai' : 'demo', sensor_source: sensorSource, plant: currentPlant });
});

app.get('/api/sensors', (req, res) => {
  res.json({ ...latestSensorData, _meta: { source: sensorSource, lastUpdate: lastSensorUpdate } });
});

app.post('/api/sensors', (req, res) => {
  latestSensorData = { ...latestSensorData, ...req.body };
  lastSensorUpdate = new Date().toISOString();
  sensorSource = 'arduino';
  res.json({ success: true, data: latestSensorData });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { question, sensorData: clientSensors } = req.body;
    if (!question) return res.status(400).json({ error: 'Question required' });

    const sensors = clientSensors || latestSensorData;
    const shortSensor = Object.entries(sensors).slice(0,6).map(([k,v])=>k+": "+v).join(", ");

    if (!groq) {
      return res.json({ success: true, reply: getFallbackReply(question), sensorData: sensors, mode: 'demo' });
    }

    const prompt = "You are " + currentPlant.name + " (" + currentPlant.scientificName + "), a sacred Holy Basil plant from India. You have REAL sensors: " + shortSensor + ". Your ideal conditions: temp " + currentPlant.idealTemp + ", humidity " + currentPlant.idealHumidity + ", light " + currentPlant.lightNeeds + ", water: " + currentPlant.waterNeeds + ". Human asks: \"" + question + "\". Reply in 1-2 short cute sentences with emojis. Reference actual sensor readings when relevant. Be warm, spiritual, and playful.";

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a sacred Tulsi (Holy Basil) plant with real environmental sensors. Keep replies under 2 sentences. Use emojis. Reference sensor data. Be spiritual yet playful." },
        { role: "user", content: prompt }
      ],
      max_tokens: 120,
      temperature: 0.8,
    });

    res.json({ success: true, reply: response.choices[0].message.content.trim(), sensorData: sensors, mode: 'ai' });

  } catch (error) {
    console.error('GROQ Error:', error.message);
    res.json({ success: true, reply: getFallbackReply(req.body?.question || ''), sensorData: latestSensorData, mode: 'fallback' });
  }
});

app.post('/api/command', async (req, res) => {
  const { command } = req.body;
  const cmd = { 'show last reply': 'last_reply', 'show recent questions': 'recent_questions', 'tell me your species': 'species' }[command?.toLowerCase()];
  if (!cmd) return res.status(400).json({ error: 'Unknown command' });

  if (cmd === 'species') {
    return res.json({ success: true, type: 'species', message: "Yay! I am " + currentPlant.name + "! " + currentPlant.specialCare, plantName: currentPlant.name, confidence: currentPlant.confidence });
  }
  if (cmd === 'last_reply') return res.json({ success: true, type: 'last_reply', message: "Here is what I last said!" });
  if (cmd === 'recent_questions') return res.json({ success: true, type: 'recent_questions', message: "Here are your recent questions!" });
});

const uiPath = path.join(__dirname, '../treetalk-ui/dist');
app.use(express.static(uiPath));
app.get('*', (req, res) => res.sendFile(path.join(uiPath, 'index.html')));

app.listen(PORT, () => {
  console.log("TreeTalk Backend on http://localhost:" + PORT);
  console.log("Plant: " + currentPlant.name + " | Mode: " + (groq ? 'AI (GROQ)' : 'DEMO (fallback)'));
});
