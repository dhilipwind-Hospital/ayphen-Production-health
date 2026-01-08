import { AppDataSource } from '../config/database';
import { LabTest } from '../models/LabTest';

const labTests = [
  {
    name: 'Complete Blood Count',
    code: 'CBC',
    description: 'Measures different components of blood including RBC, WBC, platelets',
    category: 'hematology',
    sampleType: 'Blood',
    sampleInstructions: 'Fasting not required. Collect 3-5ml blood in EDTA tube',
    normalRange: 'RBC: 4.5-5.5 million/μL, WBC: 4000-11000/μL, Platelets: 150000-450000/μL',
    units: 'cells/μL',
    cost: 300,
    turnaroundTimeMinutes: 120,
    isActive: true
  },
  {
    name: 'Fasting Blood Sugar',
    code: 'FBS',
    description: 'Measures blood glucose level after fasting',
    category: 'biochemistry',
    sampleType: 'Blood',
    sampleInstructions: 'Fasting for 8-12 hours required. Collect 2ml blood in fluoride tube',
    normalRange: '70-100 mg/dL',
    units: 'mg/dL',
    cost: 150,
    turnaroundTimeMinutes: 60,
    isActive: true
  },
  {
    name: 'HbA1c',
    code: 'HBA1C',
    description: 'Glycated hemoglobin test for diabetes monitoring',
    category: 'biochemistry',
    sampleType: 'Blood',
    sampleInstructions: 'No fasting required. Collect 2ml blood in EDTA tube',
    normalRange: '4.0-5.6%',
    units: '%',
    cost: 500,
    turnaroundTimeMinutes: 180,
    isActive: true
  },
  {
    name: 'Lipid Profile',
    code: 'LIPID',
    description: 'Measures cholesterol and triglycerides',
    category: 'biochemistry',
    sampleType: 'Blood',
    sampleInstructions: 'Fasting for 12 hours required. Collect 3ml blood in plain tube',
    normalRange: 'Total Cholesterol: <200 mg/dL, LDL: <100 mg/dL, HDL: >40 mg/dL',
    units: 'mg/dL',
    cost: 600,
    turnaroundTimeMinutes: 240,
    isActive: true
  },
  {
    name: 'Liver Function Test',
    code: 'LFT',
    description: 'Measures liver enzymes and function',
    category: 'biochemistry',
    sampleType: 'Blood',
    sampleInstructions: 'Fasting for 8 hours recommended. Collect 3ml blood in plain tube',
    normalRange: 'ALT: 7-56 U/L, AST: 10-40 U/L, Bilirubin: 0.1-1.2 mg/dL',
    units: 'U/L',
    cost: 700,
    turnaroundTimeMinutes: 240,
    isActive: true
  },
  {
    name: 'Kidney Function Test',
    code: 'KFT',
    description: 'Measures kidney function parameters',
    category: 'biochemistry',
    sampleType: 'Blood',
    sampleInstructions: 'No fasting required. Collect 3ml blood in plain tube',
    normalRange: 'Creatinine: 0.6-1.2 mg/dL, BUN: 7-20 mg/dL',
    units: 'mg/dL',
    cost: 600,
    turnaroundTimeMinutes: 240,
    isActive: true
  },
  {
    name: 'Thyroid Profile',
    code: 'THYROID',
    description: 'Measures thyroid hormones T3, T4, TSH',
    category: 'immunology',
    sampleType: 'Blood',
    sampleInstructions: 'No fasting required. Collect 3ml blood in plain tube',
    normalRange: 'TSH: 0.4-4.0 mIU/L, T3: 80-200 ng/dL, T4: 4.5-12 μg/dL',
    units: 'mIU/L',
    cost: 800,
    turnaroundTimeMinutes: 360,
    isActive: true
  },
  {
    name: 'Urine Routine',
    code: 'URINE',
    description: 'Complete urine analysis',
    category: 'pathology',
    sampleType: 'Urine',
    sampleInstructions: 'Collect mid-stream urine in sterile container',
    normalRange: 'pH: 4.5-8.0, Specific Gravity: 1.005-1.030',
    units: 'various',
    cost: 200,
    turnaroundTimeMinutes: 120,
    isActive: true
  },
  {
    name: 'Chest X-Ray',
    code: 'CXR',
    description: 'Radiographic examination of chest',
    category: 'radiology',
    sampleType: 'N/A',
    sampleInstructions: 'Remove all metal objects. PA and lateral views',
    normalRange: 'Normal lung fields, no abnormalities',
    units: 'N/A',
    cost: 400,
    turnaroundTimeMinutes: 60,
    isActive: true
  },
  {
    name: 'Blood Culture',
    code: 'CULTURE',
    description: 'Bacterial culture from blood sample',
    category: 'microbiology',
    sampleType: 'Blood',
    sampleInstructions: 'Collect before antibiotic therapy. Strict aseptic technique',
    normalRange: 'No growth',
    units: 'N/A',
    cost: 900,
    turnaroundTimeMinutes: 2880, // 48 hours
    isActive: true
  }
];

async function seedLabTests() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    const labTestRepo = AppDataSource.getRepository(LabTest);

    console.log('🔬 Seeding lab tests...\n');

    for (const testData of labTests) {
      const existing = await labTestRepo.findOne({ where: { code: testData.code } });
      
      if (existing) {
        console.log(`⏭️  Skipping ${testData.name} (${testData.code}) - already exists`);
      } else {
        const test = labTestRepo.create(testData);
        await labTestRepo.save(test);
        console.log(`✅ Created ${testData.name} (${testData.code}) - ₹${testData.cost}`);
      }
    }

    console.log('\n🎉 Lab test seeding completed!');
    console.log(`📊 Total tests: ${labTests.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding lab tests:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seedLabTests();
