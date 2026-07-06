# 🎓 RNGPIT Student Consultancy Portal

<p align="center">
  <img src="public/RNGPIT.png" width="180" alt="RNGPIT Student Consultancy Portal">
</p>

<p align="center">
  <strong>A production-ready student consultation and admission management platform built for RNG Patel Institute of Technology.</strong>
</p>

<p align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)

![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)

![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styled-38BDF8?logo=tailwindcss)

![Production](https://img.shields.io/badge/Status-Live-success)

![Self Hosted](https://img.shields.io/badge/Hosting-Self--Hosted-red)

</p>

---

# 🌐 Live Production Deployment

## 🚀 Production Status

The **RNGPIT Student Consultancy Portal** is a fully operational production system currently deployed for **RNG Patel Institute of Technology**.

Unlike a prototype or academic demonstration, this platform is actively used by faculty members and administrators to manage student consultations, admissions, lead tracking, and institutional workflows.

### 🔗 Live Website

https://consultation.rngpitai.com


<img width="1365" height="684" alt="image" src="https://github.com/user-attachments/assets/cf941d74-8e32-42b1-8a52-04695b0f370d" />



---

# 📖 Overview

The Student Consultancy Portal is an end-to-end admission and consultation management platform designed specifically for higher education institutions.

The system digitizes the complete consultation workflow, allowing faculty members, heads of departments, and administrators to efficiently manage prospective students, monitor admissions, assign consultations, and analyze institutional performance through interactive dashboards.

The application has been designed with scalability, performance, and real-world institutional usage in mind.

---

# ✨ Features

## 👨‍🎓 Student Management

- Student Registration
- Student Profiles
- Search & Filtering
- Student Assignment
- Student Status Tracking
- Admission Progress

---

## 👨‍🏫 Faculty Management

- Faculty Dashboard
- HOD Management
- Faculty Assignment
- Password Management
- Faculty Performance

---

## 📞 Consultation System

- Consultation Tracking
- Lead Management
- Consultation History
- Conversion Tracking
- Follow-up Management

---

## 📊 Analytics Dashboard

- Total Students
- Faculty Statistics
- Consultation Reports
- Conversion Rate Analytics
- Performance Charts
- Institution-wide Insights

---

## 🔐 Authentication

- Secure Login
- Password Reset
- Session Management
- Role-Based Access Control

---

## 🤖 Smart Features

- Voice Transcription
- Receipt Verification
- Reward System
- Bulk Student Import
- Faculty Import & Export

---

# 🌍 Real World Impact

The platform currently manages real institutional data and supports daily administrative operations.

Current deployment includes:

- 👨‍🎓 26,000+ student records
- 📞 Thousands of consultation records
- 👨‍🏫 Faculty management
- 📈 Admission lead tracking
- 📊 Administrative analytics
- 🗂️ Institutional workflows

---

# 🏗️ Production Infrastructure

This project is deployed and maintained on self-managed infrastructure.

## Deployment

- 🌐 Custom Domain
- 🖥️ Self-Hosted Production Server
- 🔒 HTTPS / SSL
- ⚙️ Continuous Maintenance
- 🔄 Regular Updates
- 💾 Secure Database Storage

---

# 🛠️ Tech Stack

## Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS

## Backend

- Next.js API Routes
- Server Actions
- Node.js

## Database

- Supabase

## Authentication

- Supabase Auth

## AI & Automation

- Speech Transcription
- Receipt Verification APIs

## Deployment

- Self Hosted Infrastructure
- HTTPS
- Custom Domain

---

# 📂 Project Structure

```text
src/
│
├── app/
│   ├── admin/
│   ├── dashboard/
│   ├── login/
│   ├── api/
│   ├── forgot-password/
│   ├── reset-password/
│   └── ...
│
├── components/
│   ├── StudentCard
│   ├── ConsultationModal
│   ├── RewardsSidebar
│   ├── Faculty Management
│   └── ...
│
├── lib/
│   ├── actions/
│   ├── supabase/
│   └── utils/
│
scripts/
│
public/
```

---

# 📈 System Architecture

```text
                     Students
                         │
                         ▼
               Faculty Consultation
                         │
                         ▼
                Faculty Dashboard
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
     Student Records             Consultation Data
          │                             │
          └──────────────┬──────────────┘
                         ▼
                    Supabase Database
                         │
                         ▼
                Analytics Dashboard
                         │
                         ▼
                   Administrator Panel
```

---

# 🚀 Installation

Clone the repository

```bash
git clone https://github.com/Gamertoy9354/STUDENT-CONSULTANCY.git

cd STUDENT-CONSULTANCY
```

Install dependencies

```bash
npm install
```

Create a `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=
```

Run locally

```bash
npm run dev
```

Visit

```
http://localhost:3000
```

---

# 🚀 Future Roadmap

- AI-powered consultation recommendations
- Predictive admission analytics
- Mobile application
- WhatsApp integration
- Email automation
- Notification center
- Attendance integration
- Parent Portal
- Student Portal
- Multi-campus support

---

# 💡 Why Self-Hosting?

This platform is deployed on infrastructure that I manage independently rather than relying solely on managed cloud hosting.

This approach provides:

- Complete infrastructure ownership
- Greater deployment flexibility
- Better operational understanding
- Full control over updates and maintenance
- Production DevOps experience

---

# 📄 License

This project is licensed under the **Apache License 2.0**.

---

# 👨‍💻 Author

**Shis Maheta**

🏆 National-Level Hackathon Winner

💻 Full Stack Developer

⚛️ Next.js Developer

🤖 AI Developer

☁️ Self-Hosted Infrastructure Enthusiast

---

# ⭐ Support

If you found this project interesting, consider giving it a ⭐ on GitHub.

---

> **Note:** This project is a real-world production platform currently deployed and actively used within RNG Patel Institute of Technology. It demonstrates full-stack web development, authentication, analytics, institutional workflow management, and production deployment practices.
