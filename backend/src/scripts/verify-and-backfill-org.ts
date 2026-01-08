import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Appointment } from '../models/Appointment';
import { Service } from '../models/Service';
import { Department } from '../models/Department';
import { Organization } from '../models/Organization';
import { In, IsNull, Not } from 'typeorm';

/**
 * Verify-and-Backfill Organization IDs
 *
 * Usage:
 *   ts-node src/scripts/verify-and-backfill-org.ts           # verify only (no data changes)
 *   ts-node src/scripts/verify-and-backfill-org.ts --apply   # perform backfill (safe, scoped)
 */
(async () => {
  const APPLY = process.argv.includes('--apply');
  try {
    console.log(`Starting verify-and-backfill (apply=${APPLY})...`);
    await AppDataSource.initialize();

    const orgRepo = AppDataSource.getRepository(Organization);
    const userRepo = AppDataSource.getRepository(User);
    const apptRepo = AppDataSource.getRepository(Appointment);
    const svcRepo = AppDataSource.getRepository(Service);
    const deptRepo = AppDataSource.getRepository(Department);

    // 1) Resolve target org (Ayphen Care or subdomain 'default')
    const targetOrg = await orgRepo.findOne({ where: [ { subdomain: 'ayphen' } as any, { name: 'Ayphen Care' } as any, { subdomain: 'default' } as any ] });
    if (!targetOrg) {
      console.log('⚠️  Target organization not found (Ayphen Care or subdomain="default"). Running in report-only mode.');
    } else {
      console.log(`Target Organization: ${targetOrg.name} (${targetOrg.id})`);
    }

    // 2) SUPER ADMIN verification and optional correction
    const seedEmail = process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@hospital.com';
    const superAdmins = await userRepo.find({ where: [{ email: seedEmail } as any, { role: 'super_admin' } as any] });
    console.log(`Super Admins found: ${superAdmins.length}`);
    for (const sa of superAdmins) {
      console.log(` - ${sa.email} org=${(sa as any).organizationId || 'NULL'}`);
      if (APPLY && targetOrg && (sa as any).organizationId !== targetOrg.id) {
        (sa as any).organizationId = targetOrg.id;
        await userRepo.save(sa);
        console.log(`   -> Updated Super Admin org to ${targetOrg.id}`);
      }
    }

    // 3) Report counts
    const counts = {
      usersNullOrg: await userRepo.count({ where: { organizationId: IsNull() } as any }),
      apptsNullOrg: await apptRepo.count({ where: { organizationId: IsNull() } as any }),
      servicesNullOrg: await svcRepo.count({ where: { organizationId: IsNull() } as any }),
      deptsNullOrg: await deptRepo.count({ where: { organizationId: IsNull() } as any }),
    };
    console.log('Current NULL organization_id counts:', counts);

    if (!APPLY) {
      console.log('\nRun with --apply to backfill where safe.');
      process.exit(0);
    }

    // 4) Backfill appointments: from service -> doctor -> patient -> fallback targetOrg
    const appts = await apptRepo.find({ where: { organizationId: IsNull() } as any, relations: ['service','doctor','patient'] });
    for (const a of appts) {
      let orgId: string | undefined = undefined;
      orgId = (a as any)?.service?.organizationId || (a as any)?.doctor?.organizationId || (a as any)?.patient?.organizationId || targetOrg?.id;
      if (orgId) {
        (a as any).organizationId = orgId;
        await apptRepo.save(a);
      }
    }
    console.log(`Backfilled appointments: ${appts.length}`);

    // 5) Backfill services/departments: if a service/department has NULL org but is clearly default/demo, assign to targetOrg (if available)
    if (targetOrg) {
      const services = await svcRepo.find({ where: { organizationId: IsNull() } as any });
      for (const s of services) {
        (s as any).organizationId = targetOrg.id;
        await svcRepo.save(s);
      }
      console.log(`Backfilled services: ${services.length}`);

      const depts = await deptRepo.find({ where: { organizationId: IsNull() } as any });
      for (const d of depts) {
        (d as any).organizationId = targetOrg.id;
        await deptRepo.save(d);
      }
      console.log(`Backfilled departments: ${depts.length}`);
    }

    // 6) Backfill users (patients/doctors) with NULL org if they have at least one appt now tied to an org
    const users = await userRepo.find({ where: { organizationId: IsNull() } as any });
    for (const u of users) {
      const anyAppt = await apptRepo.findOne({ where: [{ doctor: { id: (u as any).id } } as any, { patient: { id: (u as any).id } } as any] as any });
      const apptOrgId = (anyAppt as any)?.organizationId;
      if (apptOrgId) {
        (u as any).organizationId = apptOrgId;
        await userRepo.save(u);
      } else if (targetOrg && ['super_admin', 'admin'].includes(String((u as any).role))) {
        // Assign admin/super_admins to target org as a safe default
        (u as any).organizationId = targetOrg.id;
        await userRepo.save(u);
      }
    }
    console.log(`Evaluated users without org: ${users.length}`);

    // 7) Final report
    const after = {
      usersNullOrg: await userRepo.count({ where: { organizationId: IsNull() } as any }),
      apptsNullOrg: await apptRepo.count({ where: { organizationId: IsNull() } as any }),
      servicesNullOrg: await svcRepo.count({ where: { organizationId: IsNull() } as any }),
      deptsNullOrg: await deptRepo.count({ where: { organizationId: IsNull() } as any }),
    };
    console.log('After backfill NULL counts:', after);

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
