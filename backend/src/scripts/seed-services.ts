import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Department } from '../models/Department';
import { Service } from '../models/Service';

// Map of department name keyword -> services
const deptServices: Record<string, { name: string; description: string; averageDuration?: number }[]> = {
  cardio: [
    { name: 'ECG', description: 'Non-invasive test recording the heart’s electrical activity.', averageDuration: 15 },
    { name: 'Echocardiography', description: 'Ultrasound imaging of the heart to assess structure and function.', averageDuration: 30 },
    { name: 'Angiography', description: 'Imaging to view blood vessels and detect blockages.', averageDuration: 60 },
  ],
  ortho: [
    { name: 'Arthroscopy', description: 'Minimally invasive joint surgery and diagnosis.', averageDuration: 60 },
    { name: 'Physiotherapy', description: 'Rehabilitation program to restore movement and function.', averageDuration: 45 },
    { name: 'Joint Replacement Evaluation', description: 'Assessment and planning for joint replacement surgery.', averageDuration: 30 },
  ],
  pedia: [
    { name: 'Well-baby Clinic', description: 'Routine checks, growth assessment and parental counselling.', averageDuration: 20 },
    { name: 'Vaccinations', description: 'Immunization as per national schedule.', averageDuration: 15 },
  ],
  derma: [
    { name: 'Acne Care', description: 'Personalized acne evaluation and treatment.' },
    { name: 'Dermatosurgery', description: 'Minor surgical procedures for skin lesions.' },
  ],
  ophthal: [
    { name: 'Eye Exams', description: 'Comprehensive vision and eye health evaluation.' },
    { name: 'Cataract Surgery', description: 'Phacoemulsification with IOL implantation.' },
  ],
  neuro: [
    { name: 'EEG', description: 'Electroencephalogram to record brain activity.', averageDuration: 45 },
    { name: 'Stroke Clinic', description: 'Multi-disciplinary management of stroke patients.' },
  ],
  ent: [
    { name: 'Sinus Clinic', description: 'Evaluation and management of sinus disorders.' },
    { name: 'Audiology', description: 'Hearing tests and counselling.' },
  ],
  gastro: [
    { name: 'Endoscopy', description: 'Upper GI endoscopy for diagnosis and intervention.' },
    { name: 'Colonoscopy', description: 'Lower GI endoscopy for colon evaluation.' },
  ],
  gyn: [
    { name: 'Prenatal Care', description: 'Antenatal visits and pregnancy screening.' },
    { name: 'Fertility Counseling', description: 'Consultation and planning for fertility options.' },
  ],
  uro: [
    { name: 'Prostate Clinic', description: 'Screening and management of prostate disorders.' },
    { name: 'Stone Management', description: 'Evaluation and treatment for urinary stones.' },
  ],
  onco: [
    { name: 'Chemotherapy', description: 'Day-care chemotherapy administration.' },
    { name: 'Immunotherapy', description: 'Targeted immunotherapy based on tumor profiling.' },
  ],
};

const pickBucket = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('cardio')) return 'cardio';
  if (n.includes('ortho')) return 'ortho';
  if (n.includes('pedia') || n.includes('child')) return 'pedia';
  if (n.includes('derma') || n.includes('skin')) return 'derma';
  if (n.includes('ophthal') || n.includes('eye')) return 'ophthal';
  if (n.includes('neuro')) return 'neuro';
  if (n.includes('ent')) return 'ent';
  if (n.includes('gastro')) return 'gastro';
  if (n.includes('gyn')) return 'gyn';
  if (n.includes('uro')) return 'uro';
  if (n.includes('onco')) return 'onco';
  return undefined;
};

(async () => {
  const ds = await AppDataSource.initialize();
  const deptRepo = ds.getRepository(Department);
  const svcRepo = ds.getRepository(Service);

  let depts = await deptRepo.find();
  let created = 0;

  for (const d of depts) {
    const bucket = pickBucket(d.name);
    const items = bucket ? deptServices[bucket] : undefined;
    if (!items) continue;

    for (const s of items) {
      const exists = await svcRepo.findOne({ where: { name: s.name, department: { id: d.id } }, relations: ['department'] });
      if (exists) continue;
      const entity = svcRepo.create({
        name: s.name,
        description: s.description,
        averageDuration: s.averageDuration,
        status: 'active',
        department: d,
        departmentId: d.id,
      });
      await svcRepo.save(entity);
      created++;
    }
  }

  // Fallback: if no departments, create a general department + core departments, then attach services
  if (depts.length === 0) {
    const coreDepartments: Array<{ name: string; description: string }> = [
      { name: 'Cardiology', description: 'Heart care' },
      { name: 'Orthopedics', description: 'Bone and joints' },
      { name: 'Pediatrics', description: 'Child healthcare' },
      { name: 'Dermatology', description: 'Skin, hair and nail' },
      { name: 'Ophthalmology', description: 'Eye care' },
      { name: 'Neurology', description: 'Brain and nerves' },
      { name: 'ENT', description: 'Ear, nose and throat' },
      { name: 'Gastroenterology', description: 'Digestive system and liver' },
      { name: 'Gynecology', description: 'Women’s health' },
      { name: 'Urology', description: 'Urinary tract care' },
      { name: 'Oncology', description: 'Cancer care' },
    ];

    // Also add a general department for generic services
    coreDepartments.unshift({ name: 'General Medicine', description: 'General and family medicine services' });

    for (const cd of coreDepartments) {
      const existsDept = await deptRepo.findOne({ where: { name: cd.name } });
      if (!existsDept) {
        await deptRepo.save(deptRepo.create({ name: cd.name, description: cd.description, status: 'active' } as any));
        created++;
      }
    }

    // Refresh departments after creation
    depts = await deptRepo.find();

    // Attach generic services to General Medicine
    const general = await deptRepo.findOne({ where: { name: 'General Medicine' } });
    if (general) {
      const generic = [
        { name: 'General Consultation', description: 'Meet a physician for a comprehensive evaluation.' },
        { name: 'Health Checkup', description: 'Basic health package tests and consultation.' },
      ];
      for (const g of generic) {
        const exists = await svcRepo.findOne({ where: { name: g.name, department: { id: (general as Department).id } }, relations: ['department'] });
        if (!exists) {
          const entity = svcRepo.create({ name: g.name, description: g.description, status: 'active', department: general as Department, departmentId: (general as Department).id } as any);
          await svcRepo.save(entity);
          created++;
        }
      }
    }

    // Now seed department-specific services using the mapping at the top (the loop above will handle it)
    for (const d of depts) {
      const bucket = pickBucket(d.name);
      const items = bucket ? deptServices[bucket] : undefined;
      if (!items) continue;
      for (const s of items) {
        const exists = await svcRepo.findOne({ where: { name: s.name, department: { id: d.id } }, relations: ['department'] });
        if (exists) continue;
        const entity = svcRepo.create({
          name: s.name,
          description: s.description,
          averageDuration: s.averageDuration,
          status: 'active',
          department: d,
          departmentId: d.id,
        });
        await svcRepo.save(entity);
        created++;
      }
    }
  }

  console.log(`Seeded ${created} service(s).`);
  await ds.destroy();
})().catch(async (e) => {
  console.error('Service seeding failed:', e);
  try { await AppDataSource.destroy(); } catch {}
  process.exit(1);
});
