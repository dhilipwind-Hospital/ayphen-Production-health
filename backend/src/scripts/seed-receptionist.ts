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

  const email = process.env.SEED_RECEPTION_EMAIL || 'reception@hospital.com';
  const password = process.env.SEED_RECEPTION_PASSWORD || 'Reception@2025';

  // Resolve organization via subdomain or default
  const sub = process.env.SEED_ORG_SUBDOMAIN;
  let org: Organization | null = null;
  if (sub) {
    org = await orgRepo.findOne({ where: { subdomain: sub } });
  }
  if (!org) {
    org = await orgRepo.findOne({ where: { subdomain: 'default' } });
  }
  const organizationId = org?.id;

  const existing = await userRepo.findOne({ where: { email } });
  let rec: User;
  if (!existing) {
    const payload: DeepPartial<User> = {
      firstName: 'Front',
      lastName: 'Desk',
      email,
      phone: '9999990011',
      password,
      role: UserRole.RECEPTIONIST,
      isActive: true,
      ...(organizationId ? { organizationId } : {}),
    };
    rec = userRepo.create(payload);
    await rec.hashPassword();
    await userRepo.save(rec);
    console.log(`Created receptionist user: ${email}`);
  } else {
    rec = existing as User;
    rec.role = UserRole.RECEPTIONIST;
    rec.password = password;
    rec.isActive = true;
    if (organizationId) (rec as any).organizationId = organizationId;
    await rec.hashPassword();
    await userRepo.save(rec);
    console.log(`Updated receptionist user: ${email}`);
  }

  await ds.destroy();
})().catch(async (e) => {
  console.error('Receptionist seeding failed:', e);
  try { await AppDataSource.destroy(); } catch {}
  process.exit(1);
});
