# HRMS Management System

AI-powered Human Resource Management System (HRMS) built as a modern enterprise workforce platform with attendance management, leave tracking, payroll processing, recruitment management, AI Copilot assistance, real-time notifications, and analytics dashboards.

---

## Overview

HRMS Management System is a full-stack web application designed to streamline HR operations through automation, analytics, and AI-driven insights.

The platform enables organizations to manage:

* Employee records
* Attendance tracking
* Leave management
* Payroll processing
* Recruitment workflows
* HR analytics
* AI-powered HR Copilot
* Real-time notifications
* Workforce insights

---

## Features

### Dashboard

* Real-time HR KPI dashboard
* Workforce statistics
* Attendance analytics
* Payroll insights
* Recruitment metrics
* Attrition risk monitoring
* AI Daily Summary

### Employee Management

* Employee CRUD operations
* Department-wise organization
* Employee profiles
* Performance tracking
* Workforce analytics

### Attendance Management

* Daily attendance tracking
* Check-in / Check-out monitoring
* Attendance trends
* Attendance analytics
* Attendance anomaly detection
* Edit/Delete attendance records

### Leave Management

* Leave application workflow
* Approval / Rejection process
* Leave balance tracking
* Smart leave recommendations
* Leave analytics

### Payroll Management

* Salary processing
* Payroll records
* Compensation analysis
* Payroll insights
* Monthly salary reporting

### Recruitment Management

* Job posting management
* Candidate applications
* Recruitment pipeline
* Hiring analytics

### AI Copilot

Powered by Google Gemini.

Capabilities:

* Workforce analysis
* Attendance insights
* Payroll recommendations
* Attrition analysis
* HR decision support
* Natural language HR queries

### Notifications

* Real-time notifications
* HR alerts
* Attendance alerts
* Attrition alerts
* Recruitment updates
* Payroll updates

### Security

* JWT Authentication
* Protected routes
* Role-based access
* Session management

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Query
* React Router
* Framer Motion
* Socket.IO Client
* Recharts
* Lucide React

### Backend

* Node.js
* Express.js
* Socket.IO
* JWT Authentication
* Prisma ORM

### Database

* PostgreSQL

### AI Integration

* Google Gemini API

---

## Project Structure

```bash
hrms-management/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── data/
│   │
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── config/
│   │
│   └── package.json
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-repository/hrms-management.git

cd hrms-management
```

---

## Backend Setup

### Install Dependencies

```bash
cd backend

npm install
```

### Configure Environment

Create:

```bash
backend/.env
```

Example:

```env
PORT=5000

DATABASE_URL="postgresql://postgres:password@localhost:5432/hrms_management"

JWT_SECRET=your_jwt_secret

GOOGLE_AI_API_KEY=your_gemini_api_key
```

---

### Run Prisma Migration

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

Seed Database:

```bash
npm run seed
```

### Start Backend

```bash
npm start
```

Backend:

```bash
http://localhost:5000
```

---

## Frontend Setup

### Install Dependencies

```bash
cd frontend

npm install
```

### Create Environment File

```env
VITE_API_URL=http://localhost:5000
```

### Start Frontend

```bash
npm run dev
```

Frontend:

```bash
http://localhost:5173
```

---
---

### Start Backend and frontend

```bash
cd hrms_management
npm run dev
```

---

## Database Setup

### PostgreSQL

Create database:

```sql
CREATE DATABASE hrms_management;
```

Verify connection:

```bash
psql -U postgres
```

Check databases:

```sql
\l
```

---

## API Modules

### Authentication

```http
POST /auth/login
POST /auth/signup
```

### Employees

```http
GET    /employees
POST   /employees
PUT    /employees/:id
DELETE /employees/:id
```

### Attendance

```http
GET    /attendance
POST   /attendance
PUT    /attendance/:id
DELETE /attendance/:id
```

### Leave

```http
GET    /leave
POST   /leave
PUT    /leave/:id
DELETE /leave/:id
```

### Payroll

```http
GET    /payroll
POST   /payroll
PUT    /payroll/:id
DELETE /payroll/:id
```

### Recruitment

```http
GET    /recruitment
POST   /recruitment
PUT    /recruitment/:id
DELETE /recruitment/:id
```

### AI Copilot

```http
POST /ai/copilot
GET  /ai/daily-summary
```

### Notifications

```http
GET /notifications
PUT /notifications/:id/read
```

### Reports

```http
GET /reports/hr-summary/pdf
```

---

## Real-Time Events

Socket.IO Events:

```javascript
employee:created
employee:updated
attendance:updated
leave:updated
payroll:updated
recruitment:updated
hr:alert
dashboard:refresh
```

---

## Future Enhancements

* Contractor Compliance Module
* PF Verification
* Statutory Registers
* Exit Management
* Email Notifications
* Calendar Integration
* Workforce Health Score
* Advanced RBAC
* Multi-Tenant SaaS Support
* Audit Logs
* Mobile Application

---

## Team

### Developer

**Ritika S**

B.E. Computer Science and Engineering
Velammal Institute of Technology

### Project

**AI-Powered Enterprise HRMS Platform**

---

## License

This project is developed for academic, internship, and hackathon purposes.

© 2026 Ritika S. All Rights Reserved.
