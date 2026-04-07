<div align="center">
  <img src="https://img.icons8.com/color/120/000000/shield.png" alt="ChildShield AI Logo">
  <h1 align="center">Child Shield AI</h1>
  <p align="center">
    <strong>Premium Behavioral Intelligence & Biometric Parental Control Suite</strong>
  </p>
  <p align="center">
    <a href="#demo"><img src="https://img.shields.io/badge/Status-V3_Final-10B981?style=for-the-badge" /></a>
    <a href="#tech-stack"><img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" /></a>
    <a href="#tech-stack"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" /></a>
    <a href="#tech-stack"><img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" /></a>
  </p>
</div>

<hr />

## 💡 The Solution

**Child Shield AI** is a professional-grade digital safety platform that goes beyond simple app blocking. By combining **Real-Time Behavioral Analytics** with **Advanced Face Guard Technology**, we provide parents with a comprehensive supervision ecosystem. 

Built with a high-end Dark Mode aesthetic, the platform translates complex usage patterns into actionable safety intelligence through a cross-platform mobile app and a powerful web dashboard.

---

## ⚡ Core Features (V3 Implementation)

### 1. Advanced Face Guard System
Continuous identity verification using the device camera.
* **Scan Lock UI**: Real-time visual feedback (Green Frame + Tick) when the authorized child is detected.
* **Intelligent Enforcement**: Choose between *Alert*, *Pause Session*, or *Total Lock* upon identity mismatch or face absence.
* **10-Second Grace Period**: Integrated warning system allows children to re-engage before security actions trigger.

### 2. High-Fidelity Daily Analytics
Startup-grade data visualization for long-term behavior tracking.
* **7-Day Trend Analysis**: Interactive line charts showing weekly usage fluctuations.
* **App-Specific Logging**: Granular tracking for exact minutes spent in specific apps (YouTube, Roblox, WhatsApp).
* **Search Interception**: Dedicated feed for monitoring search queries with automated high-risk flagging.

### 3. Safety Intelligence Dashboard
Real-time parent overview with proactive alerting.
* **Shield Intelligence Card**: AI-driven summary of current device safety status.
* **Security Incident Banner**: High-priority red alerts for unauthorized access or usage limit breaches.
* **30-Day History**: Rolling data retention for historical performance auditing.

### 4. Cross-Platform Control Suite
A robust **React Native (Expo)** mobile application for parents to monitor and manage child devices from anywhere in the world.

---

## 🎬 The "Live Demo" Simulation Mode
The platform features a sophisticated **Telemetry Simulation Engine**. By enabling Demo Mode, the backend generates realistic, accelerated data streams:
1. **Watch History Scenarios**: Mimics scrolling patterns and video consumption.
2. **Search Events**: Injects simulated queries to test risk flagging.
3. **Face Incidents**: Simulates unauthorized access attempts with captured base64 intruder snapshots.

---

## 🛠️ Architecture Overview

*   **Mobile App**: React Native & Expo (Lucide Icons, Recharts)
*   **Web Dashboard**: React (Vite-powered, Glassmorphism CSS)
*   **Backend Engine**: Node.js & Express (Sequelize ORM, JWT Authentication)
*   **Database**: SQLite (Production-ready relational schema)

---

## 🚀 Running Locally

**1. Boot Backend & Database**
```bash
cd backend
npm install
npm start
```

**2. Launch Parent Mobile App**
```bash
cd childshield-mobile
npm install
npx expo start --web
```

---

## 🌍 Deployment Strategy

*   **Mobile**: Export via `eas build` for Android (APK) and iOS (IPA) distribution.
*   **Backend**: Production-ready for **Railway** or **Render** with a single click.
*   **Frontend**: SEO-optimized and ready for **Vercel** or **Netlify**.

---

## 🔮 Future Roadmap (Phase 4+)

*   **Live AI Content Filtering**: Real-time OCR and image analysis of device screens using quantized on-edge models.
*   **Encrypted Log Sharing**: Secure, end-to-end encrypted export of 30-day activity logs directly to parent emails.
*   **Dynamic Limit Scheduling**: Rule-based automation based on historical behavior patterns.

