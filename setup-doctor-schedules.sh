#!/bin/bash

echo "🏥 Setting Up Doctor Schedules"
echo "=============================="
echo ""

API_BASE="http://localhost:5001/api"

# Function to login and get token
login() {
    local email=$1
    local password=$2
    curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}" | jq -r '.accessToken'
}

# Function to create availability
create_availability() {
    local token=$1
    local doctor_id=$2
    local day=$3
    local start=$4
    local end=$5
    local notes=$6
    
    curl -s -X POST "$API_BASE/availability" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{\"doctorId\":\"$doctor_id\",\"dayOfWeek\":\"$day\",\"startTime\":\"$start\",\"endTime\":\"$end\",\"notes\":\"$notes\"}"
}

# Setup General Medicine Chief
echo "📍 Setting up: General Medicine Chief"
TOKEN=$(login "general-medicine.chief@example.com" "doctor123")
DOCTOR_ID=$(echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq -r '.userId')

if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "   ✅ Logged in"
    create_availability "$TOKEN" "$DOCTOR_ID" "monday" "08:00" "12:00" "Morning clinic" > /dev/null
    echo "   ✅ Monday 08:00-12:00: Created"
    create_availability "$TOKEN" "$DOCTOR_ID" "wednesday" "14:00" "18:00" "Afternoon clinic" > /dev/null
    echo "   ✅ Wednesday 14:00-18:00: Created"
    create_availability "$TOKEN" "$DOCTOR_ID" "friday" "09:00" "13:00" "General consultation" > /dev/null
    echo "   ✅ Friday 09:00-13:00: Created"
else
    echo "   ❌ Login failed"
fi
echo ""

# Setup Cardiology Senior
echo "📍 Setting up: Cardiology Senior"
TOKEN=$(login "cardiology.senior@example.com" "doctor123")
DOCTOR_ID=$(echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq -r '.userId')

if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "   ✅ Logged in"
    create_availability "$TOKEN" "$DOCTOR_ID" "tuesday" "09:00" "12:00" "Cardiac consultation" > /dev/null
    echo "   ✅ Tuesday 09:00-12:00: Created"
    create_availability "$TOKEN" "$DOCTOR_ID" "thursday" "14:00" "17:00" "Follow-up clinic" > /dev/null
    echo "   ✅ Thursday 14:00-17:00: Created"
else
    echo "   ❌ Login failed"
fi
echo ""

# Setup Orthopedics Consultant
echo "📍 Setting up: Orthopedics Consultant"
TOKEN=$(login "orthopedics.consultant@example.com" "doctor123")
DOCTOR_ID=$(echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq -r '.userId')

if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "   ✅ Logged in"
    create_availability "$TOKEN" "$DOCTOR_ID" "monday" "10:00" "14:00" "Orthopedic clinic" > /dev/null
    echo "   ✅ Monday 10:00-14:00: Created"
    create_availability "$TOKEN" "$DOCTOR_ID" "wednesday" "10:00" "14:00" "Joint consultation" > /dev/null
    echo "   ✅ Wednesday 10:00-14:00: Created"
    create_availability "$TOKEN" "$DOCTOR_ID" "friday" "15:00" "18:00" "Sports medicine" > /dev/null
    echo "   ✅ Friday 15:00-18:00: Created"
else
    echo "   ❌ Login failed"
fi
echo ""

# Setup Pediatrics Chief
echo "📍 Setting up: Pediatrics Chief"
TOKEN=$(login "pediatrics.chief@example.com" "doctor123")
DOCTOR_ID=$(echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq -r '.userId')

if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "   ✅ Logged in"
    create_availability "$TOKEN" "$DOCTOR_ID" "monday" "08:00" "11:00" "Pediatric clinic" > /dev/null
    echo "   ✅ Monday 08:00-11:00: Created"
    create_availability "$TOKEN" "$DOCTOR_ID" "tuesday" "14:00" "17:00" "Child health" > /dev/null
    echo "   ✅ Tuesday 14:00-17:00: Created"
    create_availability "$TOKEN" "$DOCTOR_ID" "thursday" "09:00" "12:00" "Vaccination clinic" > /dev/null
    echo "   ✅ Thursday 09:00-12:00: Created"
    create_availability "$TOKEN" "$DOCTOR_ID" "saturday" "09:00" "12:00" "Weekend clinic" > /dev/null
    echo "   ✅ Saturday 09:00-12:00: Created"
else
    echo "   ❌ Login failed"
fi
echo ""

echo "🎉 Doctor schedules set up successfully!"
echo ""
echo "📋 Summary:"
echo "   - General Medicine Chief: 3 slots (Mon, Wed, Fri)"
echo "   - Cardiology Senior: 2 slots (Tue, Thu)"
echo "   - Orthopedics Consultant: 3 slots (Mon, Wed, Fri)"
echo "   - Pediatrics Chief: 4 slots (Mon, Tue, Thu, Sat)"
echo ""
echo "📋 Next Steps:"
echo "   1. Doctors can manage schedules at /doctor/my-schedule"
echo "   2. Public can book appointments at /appointments/book"
echo "   3. Test booking workflow with different dates"
