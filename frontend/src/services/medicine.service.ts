import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Medicine categories from around the world
export const MEDICINE_CATEGORIES = [
  'Analgesic',
  'NSAID',
  'Antibiotic',
  'Antiviral',
  'Antifungal',
  'Antiparasitic',
  'Antimalarial',
  'Antihypertensive',
  'Antidiabetic',
  'Statin',
  'Bronchodilator',
  'Corticosteroid',
  'Proton Pump Inhibitor',
  'Antidiarrheal',
  'Antihistamine',
  'SSRI',
  'Benzodiazepine',
  'Antipsychotic',
  'Vaccine',
  'Biologic',
  'Monoclonal Antibody',
  'Herbal',
  'Calcium Channel Blocker',
  'ACE Inhibitor',
  'ARB',
  'Diuretic',
  'Beta Blocker',
  'Anthelmintic',
  'Anticoagulant',
  'Antiplatelet',
  'Antidepressant',
  'Antiepileptic',
  'Hormone',
  'Vitamin',
  'Mineral',
  'Immunosuppressant',
  'Chemotherapy',
  'Retinoid',
  'Laxative',
  'Antacid'
];

// Dosage forms from around the world
export const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Inhaler',
  'Cream',
  'Ointment',
  'Drops',
  'Suppository',
  'Patch',
  'Powder',
  'Gel',
  'Lotion',
  'Spray',
  'Suspension',
  'Solution',
  'Elixir',
  'Nasal Spray',
  'Lozenge',
  'Granules'
];

// Major pharmaceutical manufacturers from around the world
export const MANUFACTURERS = [
  'Pfizer',
  'Johnson & Johnson',
  'Roche',
  'Novartis',
  'Merck',
  'GSK',
  'Sanofi',
  'AbbVie',
  'AstraZeneca',
  'Bristol-Myers Squibb',
  'Eli Lilly',
  'Amgen',
  'Gilead Sciences',
  'Bayer',
  'Novo Nordisk',
  'Takeda',
  'Boehringer Ingelheim',
  'Teva',
  'Cipla',
  'Sun Pharma',
  'Dr. Reddy\'s',
  'Lupin',
  'Aurobindo Pharma',
  'Sinopharm',
  'Shanghai Pharmaceuticals',
  'Astellas Pharma',
  'Daiichi Sankyo',
  'Eisai',
  'Otsuka',
  'Meiji Seika'
];

// Common medicine names from different regions
export const COMMON_MEDICINES = [
  // Analgesics
  { name: 'Paracetamol', genericName: 'Paracetamol', category: 'Analgesic' },
  { name: 'Ibuprofen', genericName: 'Ibuprofen', category: 'NSAID' },
  { name: 'Aspirin', genericName: 'Acetylsalicylic Acid', category: 'NSAID' },
  { name: 'Diclofenac', genericName: 'Diclofenac', category: 'NSAID' },
  
  // Antibiotics
  { name: 'Amoxicillin', genericName: 'Amoxicillin', category: 'Antibiotic' },
  { name: 'Azithromycin', genericName: 'Azithromycin', category: 'Antibiotic' },
  { name: 'Ciprofloxacin', genericName: 'Ciprofloxacin', category: 'Antibiotic' },
  { name: 'Doxycycline', genericName: 'Doxycycline', category: 'Antibiotic' },
  
  // Antihypertensives
  { name: 'Lisinopril', genericName: 'Lisinopril', category: 'ACE Inhibitor' },
  { name: 'Amlodipine', genericName: 'Amlodipine', category: 'Calcium Channel Blocker' },
  { name: 'Losartan', genericName: 'Losartan', category: 'ARB' },
  { name: 'Hydrochlorothiazide', genericName: 'Hydrochlorothiazide', category: 'Diuretic' },
  
  // Antidiabetics
  { name: 'Metformin', genericName: 'Metformin', category: 'Antidiabetic' },
  { name: 'Glimepiride', genericName: 'Glimepiride', category: 'Antidiabetic' },
  { name: 'Insulin Glargine', genericName: 'Insulin Glargine', category: 'Antidiabetic' },
  
  // Statins
  { name: 'Atorvastatin', genericName: 'Atorvastatin', category: 'Statin' },
  { name: 'Simvastatin', genericName: 'Simvastatin', category: 'Statin' },
  
  // Respiratory medications
  { name: 'Salbutamol', genericName: 'Salbutamol', category: 'Bronchodilator' },
  { name: 'Fluticasone', genericName: 'Fluticasone', category: 'Corticosteroid' },
  
  // Gastrointestinal medications
  { name: 'Omeprazole', genericName: 'Omeprazole', category: 'Proton Pump Inhibitor' },
  { name: 'Loperamide', genericName: 'Loperamide', category: 'Antidiarrheal' },
  
  // Psychiatric medications
  { name: 'Sertraline', genericName: 'Sertraline', category: 'SSRI' },
  { name: 'Alprazolam', genericName: 'Alprazolam', category: 'Benzodiazepine' },
  
  // International medications
  { name: 'Artemether/Lumefantrine', genericName: 'Artemether/Lumefantrine', category: 'Antimalarial' },
  { name: 'Albendazole', genericName: 'Albendazole', category: 'Anthelmintic' },
  
  // Specialty medications
  { name: 'Adalimumab', genericName: 'Adalimumab', category: 'Biologic' },
  { name: 'Bevacizumab', genericName: 'Bevacizumab', category: 'Monoclonal Antibody' },
  
  // Traditional medicines
  { name: 'Ashwagandha', genericName: 'Withania somnifera', category: 'Herbal' },
  { name: 'Ginseng', genericName: 'Panax ginseng', category: 'Herbal' },
  
  // Vaccines
  { name: 'Influenza Vaccine', genericName: 'Influenza Vaccine', category: 'Vaccine' },
  { name: 'Pneumococcal Vaccine', genericName: 'Pneumococcal Vaccine', category: 'Vaccine' },
  
  // Dermatological medications
  { name: 'Hydrocortisone', genericName: 'Hydrocortisone', category: 'Corticosteroid' },
  { name: 'Tretinoin', genericName: 'Tretinoin', category: 'Retinoid' }
];

// Function to generate a random medicine
export const generateRandomMedicine = (id: string) => {
  const randomMedicine = COMMON_MEDICINES[Math.floor(Math.random() * COMMON_MEDICINES.length)];
  const randomManufacturer = MANUFACTURERS[Math.floor(Math.random() * MANUFACTURERS.length)];
  const randomDosageForm = DOSAGE_FORMS[Math.floor(Math.random() * DOSAGE_FORMS.length)];
  
  // Generate random strength based on dosage form
  let strength = '';
  if (randomDosageForm === 'Tablet' || randomDosageForm === 'Capsule') {
    const strengths = ['5mg', '10mg', '20mg', '25mg', '50mg', '100mg', '250mg', '500mg', '1000mg'];
    strength = strengths[Math.floor(Math.random() * strengths.length)];
  } else if (randomDosageForm === 'Syrup' || randomDosageForm === 'Solution') {
    const strengths = ['5mg/5mL', '10mg/5mL', '25mg/5mL', '50mg/5mL', '100mg/5mL'];
    strength = strengths[Math.floor(Math.random() * strengths.length)];
  } else if (randomDosageForm === 'Injection') {
    const strengths = ['10mg/mL', '25mg/mL', '50mg/mL', '100mg/mL', '250mg/mL'];
    strength = strengths[Math.floor(Math.random() * strengths.length)];
  } else if (randomDosageForm === 'Cream' || randomDosageForm === 'Ointment' || randomDosageForm === 'Gel') {
    const strengths = ['0.5%', '1%', '2%', '5%', '10%'];
    strength = strengths[Math.floor(Math.random() * strengths.length)];
  } else {
    strength = '50mg';
  }
  
  // Generate random stock and reorder level
  const currentStock = Math.floor(Math.random() * 1000);
  const reorderLevel = Math.floor(currentStock * 0.2);
  
  // Generate random prices
  const unitPrice = parseFloat((Math.random() * 10 + 0.5).toFixed(2));
  const sellingPrice = parseFloat((unitPrice * 1.5).toFixed(2));
  
  // Generate random dates
  const today = new Date();
  const manufactureDate = new Date(today);
  manufactureDate.setMonth(today.getMonth() - Math.floor(Math.random() * 12));
  
  const expiryDate = new Date(today);
  expiryDate.setFullYear(today.getFullYear() + 1 + Math.floor(Math.random() * 3));
  
  return {
    id,
    name: randomMedicine.name,
    genericName: randomMedicine.genericName,
    brandName: `${randomManufacturer} ${randomMedicine.name}`,
    manufacturer: randomManufacturer,
    category: randomMedicine.category,
    dosageForm: randomDosageForm,
    strength,
    unitPrice,
    sellingPrice,
    batchNumber: `BATCH${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`,
    manufactureDate: manufactureDate.toISOString().split('T')[0],
    expiryDate: expiryDate.toISOString().split('T')[0],
    currentStock,
    reorderLevel,
    isActive: true,
    description: `${randomMedicine.name} is a ${randomMedicine.category.toLowerCase()} medication.`,
    sideEffects: 'Common side effects may include headache, nausea, and dizziness.',
    contraindications: 'Hypersensitivity to the active ingredient or any excipients.',
    storageInstructions: 'Store at room temperature, away from moisture and heat.'
  };
};

// Function to generate a large dataset of medicines
export const generateMedicineDatabase = (count: number = 100) => {
  const medicines = [];
  for (let i = 0; i < count; i++) {
    medicines.push(generateRandomMedicine(`med-${i + 1}`));
  }
  return medicines;
};

// API service functions
export const getMedicines = async () => {
  try {
    const response = await api.get('/pharmacy/medicines');
    return response.data.medicines || [];
  } catch (error) {
    console.error('Error fetching medicines:', error);
    // Return generated medicines as fallback
    return generateMedicineDatabase(100);
  }
};

export const getMedicineById = async (id: string) => {
  try {
    const response = await api.get(`/pharmacy/medicines/${id}`);
    return response.data.medicine;
  } catch (error) {
    console.error(`Error fetching medicine ${id}:`, error);
    return null;
  }
};

export const createMedicine = async (medicineData: any) => {
  try {
    const response = await api.post('/pharmacy/medicines', medicineData);
    return response.data;
  } catch (error) {
    console.error('Error creating medicine:', error);
    throw error;
  }
};

export const updateMedicine = async (id: string, medicineData: any) => {
  try {
    const response = await api.put(`/pharmacy/medicines/${id}`, medicineData);
    return response.data;
  } catch (error) {
    console.error(`Error updating medicine ${id}:`, error);
    throw error;
  }
};

export const deleteMedicine = async (id: string) => {
  try {
    const response = await api.delete(`/pharmacy/medicines/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting medicine ${id}:`, error);
    throw error;
  }
};

export const addStock = async (data: any) => {
  try {
    const response = await api.post('/pharmacy/inventory/add-stock', data);
    return response.data;
  } catch (error) {
    console.error('Error adding stock:', error);
    throw error;
  }
};

export default {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  addStock,
  generateMedicineDatabase,
  MEDICINE_CATEGORIES,
  DOSAGE_FORMS,
  MANUFACTURERS
};
