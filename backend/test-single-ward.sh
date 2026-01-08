#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","password":"Admin@2025"}' \
  | jq -r '.accessToken')

echo "Token: ${TOKEN:0:20}..."

# Try to create ward with dept-1
echo -e "\n=== Creating Ward with dept-1 (General Medicine) ==="
curl -X POST http://localhost:5001/api/inpatient/wards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "wardNumber": "W-TEST-001",
    "name": "Test General Ward",
    "departmentId": "dept-1",
    "capacity": 50,
    "location": "Test Location",
    "description": "Test Description"
  }' | jq '.'

echo -e "\n=== Checking if ward was created ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/inpatient/wards | jq '.wards[] | select(.wardNumber == "W-TEST-001")'

echo -e "\n=== Checking auto-created departments ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/departments | jq '.departments[] | select(.description | contains("Auto-created"))'
