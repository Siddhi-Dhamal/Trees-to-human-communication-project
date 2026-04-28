/*
  TreeTalk Sensor Node
  ====================
  This Arduino sketch reads environmental sensors and sends data over serial
  in "key: value" format for the Python sensor_bridge.py to pick up.

  Sensors used:
  - DHT11/DHT22: Temperature & Humidity
  - MQ-135: Air quality / CO2
  - MQ-7: CO (Carbon Monoxide)
  - LDR (Light Dependent Resistor): Light intensity
  - Rain sensor: Rain detection

  Wiring (adjust pins as needed):
  - DHT11: VCC→5V, GND→GND, DATA→D2
  - MQ-135: VCC→5V, GND→GND, AO→A0
  - MQ-7: VCC→5V, GND→GND, AO→A1
  - LDR: One leg→5V, other→A2 + 10K resistor to GND
  - Rain: VCC→5V, GND→GND, AO→A3

  Data format sent to Serial:
    temperature: 28.5°C
    humidity: 62%
    co: 145 ppm
    air_quality: 180 AQI
    light: 750 lux
    rain: No Rain
*/

#include <DHT.h>

// ============== CONFIG ==============
#define DHT_PIN 2
#define DHT_TYPE DHT11   // Change to DHT22 if using that
#define MQ135_PIN A0
#define MQ7_PIN A1
#define LDR_PIN A2
#define RAIN_PIN A3

#define SEND_INTERVAL 3000  // ms between sensor readings
// ====================================

DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastSend = 0;

void setup() {
  Serial.begin(9600);
  dht.begin();
  
  // Allow sensors to warm up
  delay(2000);
  
  Serial.println("TreeTalk Sensor Node Ready");
}

void loop() {
  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();

    // Read DHT sensor
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    // Read analog sensors
    int mq135Raw = analogRead(MQ135_PIN);
    int mq7Raw = analogRead(MQ7_PIN);
    int ldrRaw = analogRead(LDR_PIN);
    int rainRaw = analogRead(RAIN_PIN);

    // Convert to meaningful values
    String tempStr = isnan(temp) ? "N/A" : String(temp, 1) + "°C";
    String humStr = isnan(hum) ? "N/A" : String(hum, 1) + "%";
    
    // Calibrate these formulas based on your sensors
    String coStr = String(map(mq7Raw, 0, 1023, 0, 500)) + " ppm";
    String airStr = String(map(mq135Raw, 0, 1023, 0, 500)) + " AQI";
    String lightStr = String(map(ldrRaw, 0, 1023, 0, 1000)) + " lux";
    
    String rainStr;
    if (rainRaw < 300) rainStr = "Heavy Rain";
    else if (rainRaw < 600) rainStr = "Light Rain";
    else rainStr = "No Rain";

    // Send data in key: value format
    Serial.println("temperature: " + tempStr);
    Serial.println("humidity: " + humStr);
    Serial.println("co: " + coStr);
    Serial.println("air_quality: " + airStr);
    Serial.println("light: " + lightStr);
    Serial.println("rain: " + rainStr);
    
    // Empty line to mark end of reading
    Serial.println();
  }
}
