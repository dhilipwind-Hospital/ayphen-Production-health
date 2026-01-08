import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { DeepPartial } from 'typeorm';
import { UserRole } from '../types/roles';
import { Organization } from '../models/Organization';

(async () => {
  const ds = await AppDataSource.initialize();
  const userRepo = ds.getRepository(User);
  const orgRepo = ds.getRepository(Organization);

  const email = process.env.SEED_NURSE_EMAIL || 'nurse@hospital.com';
  const password = process.env.SEED_NURSE_PASSWORD || 'Nurse@2025';

  // Resolve organization (prefer SEED_ORG_SUBDOMAIN, fallback to 'default')
  const sub = process.env.SEED_ORG_SUBDOMAIN;
  let org = null as Organization | null;
  if (sub) {
    org = await orgRepo.findOne({ where: { subdomain: sub } });
  }
  if (!org) {
    org = await orgRepo.findOne({ where: { subdomain: 'default' } });
  }
  const organizationId = org?.id;

  const existing = await userRepo.findOne({ where: { email } });
  let nurse: User;
  if (!existing) {
    const payload: DeepPartial<User> = {
      firstName: 'Ward',
      lastName: 'Nurse',
      email,
      phone: '9999999997',
      password,
      role: UserRole.NURSE,
      isActive: true,
      ...(organizationId ? { organizationId } : {}),
    };
    nurse = userRepo.create(payload);
    await nurse.hashPassword();
    await userRepo.save(nurse);
    console.log(`Created nurse user: ${email}`);
  } else {
    nurse = existing as User;
    nurse.role = UserRole.NURSE;
    nurse.password = password;
    nurse.isActive = true;
    if (organizationId) (nurse as any).organizationId = organizationId;
    await nurse.hashPassword();
    await userRepo.save(nurse);
    console.log(`Updated nurse user: ${email}`);
  }

  await ds.destroy();
})().catch(async (e) => {
  console.error('Nurse seeding failed:', e);
  try { await AppDataSource.destroy(); } catch {}
  process.exit(1);
});
