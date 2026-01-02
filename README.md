# MEDGENESIS 💊

**Pharmaceutical Authentication MVP**  
*A Hybrid Online–Offline Medicine Packaging Verification System*

---

## 📌 Overview

**MEDGENESIS** is a healthcare technology MVP designed to combat the growing problem of **counterfeit medicines in India**. The system authenticates **medicine packaging** using cryptographic identifiers and QR/Data Matrix codes, ensuring trust across the pharmaceutical supply chain—especially in **low-resource and low-connectivity environments**.

The solution targets **pharmacists, healthcare distributors, NGOs, and government clinics** without making any medical or therapeutic claims.

---

## ❗ Problem Statement

- Nearly **20% of pharmaceuticals in India are estimated to be counterfeit**, leading to serious health risks and fatalities.
- Existing systems (e.g., DAVA, iVEDA) rely on **replicable QR codes**, which counterfeiters can clone.
- Limited internet connectivity in rural areas makes real-time verification unreliable.

---

## ✅ MEDGENESIS Solution

MEDGENESIS introduces a **secure, cryptographic, and hybrid online–offline authentication system** that:

- Uses **non-reversible SHA-256 cryptographic hashes**
- Works in **offline mode with local cache verification**
- Detects **duplicate and suspicious scan patterns**
- Ensures **privacy-by-design** (no patient or personal data stored)

---

## 🏗️ System Architecture

### Core Components

1. **Manufacturer Code Generation**
   - SHA-256 hash of:
     - Manufacturer ID
     - Batch ID
     - Serial Number
     - Secret Key (never exposed)

2. **Mobile Verification App (Android)**
   - Camera-based QR/Data Matrix scanning
   - Online & Offline verification modes
   - SQLite local storage for offline use

3. **Backend Verification Service**
   - REST-based API (TLS secured)
   - PostgreSQL metadata storage
   - Duplicate & anomaly detection

4. **Admin Dashboard**
   - Batch lifecycle management
   - Real-time analytics
   - Security alerts & batch revocation

---

## 🔄 Verification Flow

1. Pharmacist scans the medicine package
2. App extracts cryptographic identifier
3. Connectivity is checked (online/offline)
4. Identifier validated against database
5. Result displayed with confidence level

### Verification Results

- ✅ **Authentic** – High confidence  
- ⚠️ **Unverified** – Limited confidence (offline)  
- 🚨 **Suspicious** – Duplicate / invalid scan  

---

## 🔐 Security & Privacy

- SHA-256 cryptographic hashing
- Manufacturer-specific secret keys
- TLS-encrypted communication
- No patient, personal, or medical data stored
- GDPR & local regulation compliant

---

## 📊 Analytics & Monitoring

- Real-time verification statistics
- Region-wise and time-based insights
- Suspicious scan detection
- Emergency batch revocation

### Performance Targets

- **99.2%** uptime  
- **~2.3s** average response time  
- **~15,000** daily verifications  

---

## 🚀 MVP Deployment Plan

- **Pilot Regions:** 3 Indian states (urban + rural)
- **Partners:** 50–100 pharmacies & government clinics
- **Target Medicines:** High-risk & commonly counterfeited drugs

### Success Metrics

- >99% verification accuracy
- >95% offline success rate
- >80% pharmacist adoption rate

---

## 🎥 Demo Videos

▶️ **Video 1: System Overview & Architecture**  
🔗 https://your-video-link-1

▶️ **Video 2: Live App Demo & Verification Flow**  
🔗 https://your-video-link-2

---

## 🛠️ Tech Stack

- **Mobile:** Android (API 21+), SQLite
- **Backend:** REST API, Cloud Infrastructure
- **Database:** PostgreSQL
- **Security:** SHA-256, TLS, API Keys
- **Dashboard:** Web-based Admin Panel

---

## 🌍 Impact

MEDGENESIS strengthens trust in the pharmaceutical supply chain by combining **security, scalability, and usability**. It is built to function reliably across India's diverse healthcare landscape, including areas with limited connectivity.

---

## 📄 License

This project is currently released as an **MVP / Prototype**.  
Licensing details can be added based on deployment and collaboration needs.

---

### 🧠 Building Trust in Healthcare

**MEDGENESIS** is not just a system—it's a step toward safer medicine access and stronger healthcare infrastructure.
