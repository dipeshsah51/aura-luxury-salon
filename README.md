# ✨ AURA — Luxury Salon & Bridal Lounge
> **Next-Generation Full-Stack Beauty, Bridal & Wellness Salon Management Platform**  
> 🌐 **Live Production Website:** [https://auraa.kesug.com](https://auraa.kesug.com)  
> 📍 **Flagship Studio:** Ramapuram, Chennai, Tamil Nadu 600089 • Concierge: [+91 9360449096](tel:+919360449096)

---

![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PHP](https://img.shields.io/badge/API-PHP%208.x%20REST-777BB4?style=for-the-badge&logo=php&logoColor=white)
![Security](https://img.shields.io/badge/Security-2FA%20Gmail%20OTP-EA4335?style=for-the-badge&logo=gmail&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 🏛️ Executive Summary

**AURA** is an enterprise-grade, omnichannel salon and bridal management startup solution developed to modernize appointment booking, staff allocation, executive intelligence, and offline retail billing for high-end luxury beauty studios in India.

The platform provides a consumer-facing digital booking salon concierge paired with a secure, two-factor authenticated **Executive Director Portal** designed for salon owners and operations directors.

---

## 🚀 Key Startup Features

### 1. 🌟 Consumer Booking Experience
- **Interactive Multi-Step Booking:** Select master stylists, curated luxury treatments, dates, and dynamic real-time slot allocation.
- **WhatsApp Concierge Integration:** 1-click confirmation pass generator directly routing booking references, appointment timings, and stylist assignments to the studio WhatsApp hotline (`+91 9360449096`).
- **VIP Customer Portal:** Reschedule appointments, track booking histories, and view loyalty milestones.
- **Indian Salon Menu (₹ INR):** Tailored packages including Royal South Indian Muhurtham Bridal Packages, Nanoplastia & Keratin Therapy, 24K Gold Facials, and Ayurvedic Kesh Spa.

### 2. 🔐 Executive Director Portal & 2FA Security
- **Mandatory 2FA OTP Authentication:** Strict security barrier for salon directors. Whenever an administrative sign-in is attempted, a 6-digit one-time password (OTP) is automatically generated and dispatched directly to the director's Gmail.
- **RFC-5322 Compliant Delivery:** Outbound mail engine built with TLS sockets, dual MIME `multipart/alternative` formatting (HTML + clean plain text), unique Message-IDs, and anti-spam transactional headers ensuring direct Primary Inbox arrival.
- **Role-Based Access Control (RBAC):** Distinct permission boundaries separating clients, reception staff, and the executive director.

### 3. 📊 Salon Operations & Revenue Intelligence
- **Real-Time Revenue Analytics:** Live Gross Revenue calculation, Average Ticket Size, and service volume metrics.
- **Offline Walk-in Revenue Tracking:** Dedicated ledger separating and aggregating in-salon cash/card walk-ins alongside online bookings.
- **Dynamic Calendar & Slot Locking:** Complete calendar management with ability to block holidays or lock individual master stylist schedules.
- **Master Stylist Leaderboard:** Performance, commission, and booking distribution across senior artists.

---

## 🛠️ Technology Architecture

```
salon-and-beauty-website/
├── client/                     # Frontend Application (React 18 + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components & modals
│   │   ├── context/            # AuthContext & State management
│   │   ├── data/               # Service catalogs & Master artisans
│   │   ├── pages/              # Client Booking, Director Portal, Auth
│   │   └── index.css           # Glassmorphism & luxury typography styles
│   ├── package.json
│   └── vite.config.js
├── server/                     # Local Full-Stack Development Engine (Node.js)
│   ├── server.js               # Express REST API, 2FA OTP, Analytics
│   ├── database.js             # Data persistence layer
│   └── data/salon_db.json      # JSON datastore
├── deploy/                     # Production Apache / InfinityFree Bundle
│   ├── api/index.php           # High-performance PHP REST backend
│   ├── api/.htaccess           # URL rewrites & security rules
│   ├── index.html              # Optimized production SPA entry
│   └── assets/                 # Minified JS/CSS bundles
└── README.md
```

---

## 💻 Local Quickstart

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/dipeshkumarsah/aura-luxury-salon.git
cd aura-luxury-salon
```

### 2. Install Dependencies
```bash
# Install root orchestration packages
npm install

# Install client packages
cd client
npm install

# Install server packages
cd ../server
npm install
cd ..
```

### 3. Start Development Server
```bash
npm run dev
```
- **Web App:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000`

---

## 🌐 Production Deployment

The platform is designed with dual-backend compatibility:
- **Node.js / Express:** Ready for containerized deployment (Docker, Render, AWS EC2, Vercel).
- **PHP REST Engine:** Standalone zero-dependency deployment for shared Apache hosting (InfinityFree, cPanel, Hostinger) located in the `/deploy` directory.

**Live Deployment:** [https://auraa.kesug.com](https://auraa.kesug.com)

---

## 🔐 Credentials & Environment Setup

Copy `.env.example` to `.env` in the server directory and configure your mail transport credentials:

```env
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

---

## 👨‍💻 Founder & Author

- **Founder & Lead Developer:** Dipesh Kumar Sah
- **GitHub:** [@dipeshkumarsah](https://github.com/dipeshkumarsah)
- **LinkedIn / Contact:** [dsah56631@gmail.com](mailto:dsah56631@gmail.com)

---

## 📄 License

This project is licensed under the **MIT License** — open for commercial use and extension.
