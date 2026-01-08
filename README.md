# 🏥 Hospital Website

A comprehensive hospital management system with patient portal, doctor scheduling, and appointment management.

## Project Structure

```
hospital-website/
├── frontend/               # Frontend React application
│   ├── public/             # Static files
│   └── src/                # Source code
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       ├── services/       # API services
│       ├── utils/          # Utility functions
│       ├── assets/         # Images, icons, styles
│       ├── hooks/          # Custom React hooks
│       └── types/          # TypeScript type definitions
│
├── backend/                # Backend Node.js/Express application
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript type definitions
│   └── tests/              # Backend tests
│
├── docs/                   # Project documentation
├── scripts/                # Utility scripts
└── docker-compose.yml      # Docker Compose configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
### Development Setup

1. Clone the repository
2. Run `docker-compose up --build`
3. Access the application at `http://localhost`

## Quick Demo

### Bring up the stack

```bash
docker compose up -d --build
```

- Backend health: http://localhost:5001/health → should return `{ "status": "ok" }`.
- Frontend: http://localhost:3000

### Create an account and login

1) Register at `http://localhost:3000/register`.
2) Login at `http://localhost:3000/login`.

Password policy: at least 8 chars, one uppercase, one lowercase, one number, one special.

### Dev-only utilities

- Seed demo patient (records + bills):

```bash
curl -X POST http://localhost:5001/api/dev/seed-patient-portal \
  -H 'Content-Type: application/json' \
  -d '{"patientEmail":"portal.demo.patient@example.com"}'
```

Login after seeding: `portal.demo.patient@example.com` / `patient123`.

- Reset a user password (dev only):

```bash
curl -X POST http://localhost:5001/api/dev/reset-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"arun@gmail.com","newPassword":"Arun@1234"}'
```

### Key portal links

- Patient Dashboard: `http://localhost:3000/portal`
- Medical Records: `http://localhost:3000/portal/records`
- Bills (Invoice View/Download/Print/Pay Now/Stripe Test): `http://localhost:3000/portal/bills`
- My Insurance: `http://localhost:3000/portal/insurance`

### Demo Accounts
- Doctor: `doctor@example.com` / `doctor123`
- Patient: `patient.demo@example.com` / `patient123`

### Doctor Workflows
- My Patients: `Doctor → My Patients`
  - Lists distinct patients the doctor has seen (via appointments).
  - Columns: Last Visit, Visits, Next Appointment, Referrals (department tags).
  - Filters: search (name/email/phone), date range; CSV export.
  - Actions per patient:
    - Records → `/doctor/patients/:patientId/records`
    - Refer → creates department referral (grants access to that department per FR-001)
    - Book Follow-up → creates an appointment for the selected patient

- Patient Records:
  - View patient reports/notes and add new notes (doctor-only, with access checks).
  - Shows referral badges for quick context.

### Access Control (FR-001 + Treated Patient)
- FR-001 (Department-based access): If a patient is assigned to a department, only doctors in that department can access reports. Doctors from other departments need a referral to their department.
- Treated patient access: A doctor who has had an appointment with the patient can access the patient’s records and create referrals.

### Key API Endpoints (Highlights)
- Patients under my care (doctor):
  - `GET /api/users/doctor/my-patients` (search/date filters, pagination)
  - `GET /api/users/doctor/my-patients.csv` (CSV export)
- Referrals:
  - `POST /api/patients/:patientId/referrals/doctor` (doctor creates referral)
  - `GET  /api/patients/:patientId/referrals/doctor` (doctor lists patient referrals)
- Appointments:
  - `GET /api/appointments/doctor/me` (doctor’s appointments)
  - `POST /api/appointments` (patient books own appointment)
  - `POST /api/appointments/doctor` (doctor books follow-up for a patient)
- Reports (notes):
  - `GET /api/patients/:patientId/reports`
  - `POST /api/reports` (doctor adds a note)

### Dev Utilities
- Seed demo patient and appointment for a doctor (dev only):
  - `POST /api/dev/seed-patient-for-doctor`
  - Body: `{ "doctorEmail": "doctor@example.com", "patientEmail": "patient.demo@example.com" }`

### Common Commands
- Build & run: `docker compose up -d --build`
- Restart containers: `docker compose restart backend frontend`
- Logs: `docker compose logs -f backend` (or `frontend`)

### Tech Stack
- Frontend: React, React Router, Ant Design, Axios
- Backend: Node/Express, TypeORM, PostgreSQL, JWT Auth

## License

This project is licensed under the MIT License.
