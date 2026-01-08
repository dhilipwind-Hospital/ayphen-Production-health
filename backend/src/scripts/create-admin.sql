-- Create admin user account
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
  'admin@hospital.com',
  -- Password: Admin@2025 (bcrypt hash)
  '$2a$10$M29QhRL/TidF3hpiEfpHIObl4giOTEXnxV.bFqy63MujIsqhlBsUu',
  'Hospital',
  'Admin',
  'admin',
  '+91-9876543200',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  password = '$2a$10$M29QhRL/TidF3hpiEfpHIObl4giOTEXnxV.bFqy63MujIsqhlBsUu',
  "firstName" = 'Hospital',
  "lastName" = 'Admin',
  role = 'admin',
  phone = '+91-9876543200',
  "isActive" = true,
  "updatedAt" = NOW();
