-- Create test doctor account for Orthopedics Chief
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
  'ortho.chief@example.com',
  -- Password: Ortho@2025 (bcrypt hash)
  '$2a$10$NQ5vVUGqDGQYvzRPSIUcXeJMQDPIkQTqtHGlsGxYRGxRvDrWGMXnK',
  'Rahul',
  'Mehta',
  'doctor',
  '+91-9876543210',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  password = '$2a$10$NQ5vVUGqDGQYvzRPSIUcXeJMQDPIkQTqtHGlsGxYRGxRvDrWGMXnK',
  "firstName" = 'Rahul',
  "lastName" = 'Mehta',
  role = 'doctor',
  phone = '+91-9876543210',
  "isActive" = true,
  "updatedAt" = NOW();
