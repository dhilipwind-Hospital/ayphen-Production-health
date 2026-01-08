import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Medicine } from '../models/pharmacy/Medicine';
import { User } from '../models/User';
import { UserRole } from '../types/roles';

(async () => {
  try {
    console.log('Initializing database connection...');
    const ds = await AppDataSource.initialize();
    console.log('Database connection established.');

    // Create pharmacist user if it doesn't exist
    const userRepo = ds.getRepository(User);
    const email = process.env.SEED_PHARMACIST_EMAIL || 'pharmacist@example.com';
    const password = process.env.SEED_PHARMACIST_PASSWORD || 'Pharmacist@123';

    let pharmacist = await userRepo.findOne({ where: { email } });
    if (!pharmacist) {
      console.log('Creating pharmacist user...');
      pharmacist = userRepo.create({
        firstName: 'Pharmacy',
        lastName: 'Manager',
        email,
        phone: '9999999999',
        password,
        role: UserRole.PHARMACIST,
        isActive: true,
      });
      await pharmacist.hashPassword();
      await userRepo.save(pharmacist);
      console.log(`Created pharmacist user: ${email}`);
    } else {
      console.log(`Pharmacist user already exists: ${email}`);
    }

    // Seed some medicines
    const medicineRepo = ds.getRepository(Medicine);
    const medicines = [
      {
        name: 'Paracetamol',
        genericName: 'Paracetamol',
        brandName: 'Calpol',
        manufacturer: 'GSK',
        category: 'Analgesic',
        dosageForm: 'Tablet',
        strength: '500mg',
        unitPrice: 0.5,
        sellingPrice: 1.0,
        batchNumber: 'BATCH001',
        manufactureDate: new Date('2025-01-01'),
        expiryDate: new Date('2027-01-01'),
        currentStock: 1000,
        reorderLevel: 200,
        description: 'Pain reliever and fever reducer',
        sideEffects: 'Rare: allergic reactions, liver damage with overdose',
        contraindications: 'Liver disease, alcoholism',
        storageInstructions: 'Store below 30°C in a dry place'
      },
      {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        brandName: 'Amoxil',
        manufacturer: 'GSK',
        category: 'Antibiotic',
        dosageForm: 'Capsule',
        strength: '250mg',
        unitPrice: 1.0,
        sellingPrice: 2.0,
        batchNumber: 'BATCH002',
        manufactureDate: new Date('2025-02-01'),
        expiryDate: new Date('2026-02-01'),
        currentStock: 500,
        reorderLevel: 100,
        description: 'Antibiotic used to treat bacterial infections',
        sideEffects: 'Diarrhea, rash, nausea',
        contraindications: 'Penicillin allergy',
        storageInstructions: 'Store below 25°C in a dry place'
      },
      {
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        brandName: 'Zestril',
        manufacturer: 'AstraZeneca',
        category: 'Antihypertensive',
        dosageForm: 'Tablet',
        strength: '10mg',
        unitPrice: 0.8,
        sellingPrice: 1.5,
        batchNumber: 'BATCH003',
        manufactureDate: new Date('2025-03-01'),
        expiryDate: new Date('2027-03-01'),
        currentStock: 300,
        reorderLevel: 50,
        description: 'ACE inhibitor used to treat high blood pressure',
        sideEffects: 'Dry cough, dizziness, headache',
        contraindications: 'Pregnancy, history of angioedema',
        storageInstructions: 'Store below 30°C in a dry place'
      },
      {
        name: 'Metformin',
        genericName: 'Metformin',
        brandName: 'Glucophage',
        manufacturer: 'Merck',
        category: 'Antidiabetic',
        dosageForm: 'Tablet',
        strength: '500mg',
        unitPrice: 0.6,
        sellingPrice: 1.2,
        batchNumber: 'BATCH004',
        manufactureDate: new Date('2025-04-01'),
        expiryDate: new Date('2027-04-01'),
        currentStock: 400,
        reorderLevel: 80,
        description: 'Oral diabetes medicine that helps control blood sugar levels',
        sideEffects: 'Nausea, diarrhea, stomach upset',
        contraindications: 'Kidney disease, liver disease',
        storageInstructions: 'Store at room temperature away from moisture and heat'
      },
      {
        name: 'Atorvastatin',
        genericName: 'Atorvastatin',
        brandName: 'Lipitor',
        manufacturer: 'Pfizer',
        category: 'Statin',
        dosageForm: 'Tablet',
        strength: '20mg',
        unitPrice: 1.2,
        sellingPrice: 2.5,
        batchNumber: 'BATCH005',
        manufactureDate: new Date('2025-05-01'),
        expiryDate: new Date('2027-05-01'),
        currentStock: 250,
        reorderLevel: 50,
        description: 'Statin medication used to lower cholesterol',
        sideEffects: 'Muscle pain, liver problems',
        contraindications: 'Liver disease, pregnancy',
        storageInstructions: 'Store at room temperature'
      },
      {
        name: 'Salbutamol',
        genericName: 'Salbutamol',
        brandName: 'Ventolin',
        manufacturer: 'GSK',
        category: 'Bronchodilator',
        dosageForm: 'Inhaler',
        strength: '100mcg/dose',
        unitPrice: 5.0,
        sellingPrice: 8.0,
        batchNumber: 'BATCH006',
        manufactureDate: new Date('2025-06-01'),
        expiryDate: new Date('2026-06-01'),
        currentStock: 100,
        reorderLevel: 20,
        description: 'Bronchodilator that relaxes muscles in the airways',
        sideEffects: 'Tremor, headache, rapid heartbeat',
        contraindications: 'Hypersensitivity to salbutamol',
        storageInstructions: 'Store below 30°C. Protect from frost and direct sunlight'
      },
      {
        name: 'Omeprazole',
        genericName: 'Omeprazole',
        brandName: 'Prilosec',
        manufacturer: 'AstraZeneca',
        category: 'Proton Pump Inhibitor',
        dosageForm: 'Capsule',
        strength: '20mg',
        unitPrice: 0.9,
        sellingPrice: 1.8,
        batchNumber: 'BATCH007',
        manufactureDate: new Date('2025-07-01'),
        expiryDate: new Date('2027-07-01'),
        currentStock: 200,
        reorderLevel: 40,
        description: 'Reduces stomach acid production',
        sideEffects: 'Headache, abdominal pain, diarrhea',
        contraindications: 'Hypersensitivity to omeprazole',
        storageInstructions: 'Store below 25°C in a dry place'
      },
      {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        brandName: 'Advil',
        manufacturer: 'Pfizer',
        category: 'NSAID',
        dosageForm: 'Tablet',
        strength: '400mg',
        unitPrice: 0.4,
        sellingPrice: 0.8,
        batchNumber: 'BATCH008',
        manufactureDate: new Date('2025-08-01'),
        expiryDate: new Date('2027-08-01'),
        currentStock: 800,
        reorderLevel: 150,
        description: 'Non-steroidal anti-inflammatory drug',
        sideEffects: 'Stomach upset, heartburn, dizziness',
        contraindications: 'Peptic ulcer, heart failure',
        storageInstructions: 'Store below 25°C in a dry place'
      }
    ];

    for (const medicineData of medicines) {
      const existingMedicine = await medicineRepo.findOne({ 
        where: { 
          name: medicineData.name,
          strength: medicineData.strength,
          dosageForm: medicineData.dosageForm
        } 
      });

      if (!existingMedicine) {
        console.log(`Creating medicine: ${medicineData.name} ${medicineData.strength}`);
        const medicine = medicineRepo.create(medicineData);
        await medicineRepo.save(medicine);
      } else {
        console.log(`Medicine already exists: ${medicineData.name} ${medicineData.strength}`);
      }
    }

    console.log('Pharmacy data seeding completed successfully.');
    await ds.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding pharmacy data:', error);
    try { await AppDataSource.destroy(); } catch {}
    process.exit(1);
  }
})();
