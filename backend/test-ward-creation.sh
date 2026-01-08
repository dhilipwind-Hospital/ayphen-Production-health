#!/bin/bash

echo "🧪 Testing Ward Creation..."

# Get token
echo "📍 Step 1: Login as admin..."
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}' \
  | jq -r '.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Login successful"
echo "Token: ${TOKEN:0:20}..."

# Try to create ward with dept-3
echo ""
echo "📍 Step 2: Creating Ward with dept-3 (Orthopedics)..."
RESPONSE=$(curl -s -X POST http://localhost:5001/api/inpatient/wards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "wardNumber": "W-TEST-001",
    "name": "Test Ward",
    "departmentId": "dept-3",
    "capacity": 50,
    "location": "chennai"
  }')

echo "Response:"
echo "$RESPONSE" | jq '.'

# Check if successful
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
  echo ""
  echo "✅ Ward created successfully!"
  WARD_ID=$(echo "$RESPONSE" | jq -r '.ward.id')
  echo "Ward ID: $WARD_ID"
else
  echo ""
  echo "❌ Ward creation failed!"
  MESSAGE=$(echo "$RESPONSE" | jq -r '.message')
  echo "Error: $MESSAGE"
  
  # Check backend logs
  echo ""
  echo "📋 Backend logs:"
  docker logs hospital-website-backend-1 --tail 30 2>&1 | grep -A 5 "ward\|Error"
fi
