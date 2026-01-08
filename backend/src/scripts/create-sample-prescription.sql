-- Create a sample prescription from orthopedics doctor to test pharmacy workflow
-- First ensure we have a patient
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

-- Create a sample prescription
INSERT INTO prescriptions (
  id,
  "patientId",
  "doctorId",
  diagnosis,
  notes,
  status,
  "prescriptionDate",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'patient.demo@example.com'),
  (SELECT id FROM users WHERE email = 'orthopedics.chief@example.com'),
  'Post-physiotherapy pain management',
  'Patient requires pain relief medication after physiotherapy session',
  'pending',
  '2025-10-03'::date,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM prescriptions 
  WHERE "doctorId" = (SELECT id FROM users WHERE email = 'orthopedics.chief@example.com')
  AND "patientId" = (SELECT id FROM users WHERE email = 'patient.demo@example.com')
);

-- Add some medicines to the prescription (assuming medicines table exists)
-- This is a sample - adjust based on your actual medicine table structure
