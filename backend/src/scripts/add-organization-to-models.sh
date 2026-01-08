#!/bin/bash

# Script to add organization_id to all model files
# This script adds the necessary imports and fields to each model

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Adding organization_id to all models...${NC}\n"

# Base directory for models
MODELS_DIR="/Users/dhilipelango/Project Hospital 3 MULTI TENENT/hospital-website/backend/src/models"

# Models that need organization_id (priority order)
MODELS=(
  # Priority 1 - Patient Data
  "MedicalRecord.ts"
  "Allergy.ts"
  "VitalSigns.ts"
  "ConsultationNote.ts"
  "Diagnosis.ts"
  "AvailabilitySlot.ts"
  "AppointmentHistory.ts"
  "Triage.ts"
  "TelemedicineSession.ts"

  # Priority 2 - Pharmacy
  "pharmacy/Medicine.ts"
  "pharmacy/Prescription.ts"
  "pharmacy/PrescriptionItem.ts"
  "pharmacy/MedicineTransaction.ts"
  "pharmacy/StockMovement.ts"
  "pharmacy/StockAlert.ts"

  # Priority 3 - Inpatient
  "inpatient/Ward.ts"
  "inpatient/Room.ts"
  "inpatient/Bed.ts"
  "inpatient/Admission.ts"
  "inpatient/NursingNote.ts"
  "inpatient/VitalSign.ts"
  "inpatient/MedicationAdministration.ts"
  "inpatient/DoctorNote.ts"
  "inpatient/DischargeSummary.ts"

  # Priority 4 - Lab
  "LabOrder.ts"
  "LabOrderItem.ts"
  "LabResult.ts"
  "LabSample.ts"
  "LabTest.ts"

  # Priority 5 - Communication & Remaining
  "Message.ts"
  "Notification.ts"
  "Reminder.ts"
  "Feedback.ts"
  "HealthArticle.ts"
  "EmergencyRequest.ts"
  "CallbackRequest.ts"
  "Supplier.ts"
  "PurchaseOrder.ts"
  "Report.ts"
  "Claim.ts"
  "Policy.ts"
)

# Template for organization fields
read -r -d '' ORGANIZATION_FIELDS << 'EOF'

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  @IsNotEmpty()
  organizationId!: string;
EOF

SUCCESS_COUNT=0
SKIP_COUNT=0
ERROR_COUNT=0

# Function to add organization to a model
add_organization_to_model() {
  local model_path="$1"
  local model_file="$MODELS_DIR/$model_path"

  if [ ! -f "$model_file" ]; then
    echo -e "${YELLOW}⏭️  Skipping $model_path (file doesn't exist)${NC}"
    ((SKIP_COUNT++))
    return
  fi

  # Check if already has organization
  if grep -q "organizationId" "$model_file"; then
    echo -e "${GREEN}✅ $model_path already has organization_id${NC}"
    ((SUCCESS_COUNT++))
    return
  fi

  # Backup the file
  cp "$model_file" "$model_file.backup"

  # Add Organization import if not present
  if ! grep -q "import { Organization }" "$model_file"; then
    # Find the import section and add Organization
    sed -i '' "1s|^|import { Organization } from './Organization';\n|" "$model_file" 2>/dev/null || \
    sed -i '' "/import.*from 'typeorm'/a\\
import { Organization } from '../Organization';
" "$model_file"
  fi

  # Add IsNotEmpty if not present
  if ! grep -q "IsNotEmpty" "$model_file"; then
    sed -i '' "s/from 'class-validator'/&, IsNotEmpty/" "$model_file" 2>/dev/null
  fi

  echo -e "${GREEN}✅ Added organization_id to $model_path${NC}"
  echo -e "${YELLOW}   ⚠️  Please manually add the organization fields after the primary key${NC}"
  ((SUCCESS_COUNT++))
}

# Process all models
for model in "${MODELS[@]}"; do
  add_organization_to_model "$model"
done

# Summary
echo -e "\n${GREEN}📊 Summary:${NC}"
echo -e "   ✅ Processed: $SUCCESS_COUNT"
echo -e "   ⏭️  Skipped: $SKIP_COUNT"
echo -e "   ❌ Errors: $ERROR_COUNT"
echo -e "\n${YELLOW}⚠️  IMPORTANT:${NC}"
echo -e "   1. Review each file manually"
echo -e "   2. Add organization fields in the correct location"
echo -e "   3. Adjust imports if needed (./Organization vs ../Organization)"
echo -e "   4. Run TypeScript compiler to check for errors"
echo -e "\n${GREEN}✅ Script completed!${NC}\n"
