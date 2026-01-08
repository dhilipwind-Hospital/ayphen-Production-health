-- Create the physiotherapy appointment for Dr. Orthopedics Chief
-- First, let's create a patient if needed
INSERT INTO users (
  email, 
  password, 
  "firstName", 
  "lastName", 
  role, 
  phone,
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  'patient.demo@example.com',
  -- Password: Patient@2025 (bcrypt hash)
  '$2a$10$M29QhRL/TidF3hpiEfpHIObl4giOTEXnxV.bFqy63MujIsqhlBsUu',
  'John',
  'Doe',
  'patient',
  '+91-9876543211',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Create the appointment
INSERT INTO appointments (
  id,
  "patientId",
  "doctorId", 
  "appointmentDate",
  "startTime",
  "endTime",
  service,
  status,
  notes,
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'patient.demo@example.com'),
  (SELECT id FROM users WHERE email = 'ortho.chief@example.com'),
  '2025-10-04'::date,
  '00:00:00'::time,
  '00:30:00'::time,
  'Physiotherapy',
  'confirmed',
  'Physiotherapy session for orthopedic rehabilitation',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM appointments 
  WHERE "doctorId" = (SELECT id FROM users WHERE email = 'ortho.chief@example.com')
  AND "appointmentDate" = '2025-10-04'::date
  AND "startTime" = '00:00:00'::time
);
