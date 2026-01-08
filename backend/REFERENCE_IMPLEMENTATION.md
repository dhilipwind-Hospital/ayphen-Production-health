# Reference Implementation - Complete Controller Updates

This document provides complete, production-ready examples of controllers fully updated for multi-tenant isolation using TenantRepository.

---

## Example 1: Complete Lab Order Controller

```typescript
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { LabOrder } from '../models/LabOrder';
import { LabOrderItem } from '../models/LabOrderItem';
import { LabTest } from '../models/LabTest';
import { User } from '../models/User';
import { createTenantRepository } from '../repositories/TenantRepository';

export class LabOrderController {
  // Generate order number (scoped to organization)
  private static async generateOrderNumber(orgId: string): Promise<string> {
    const labOrderRepo = createTenantRepository(
      AppDataSource.getRepository(LabOrder),
      orgId
    );

    const year = new Date().getFullYear();

    const lastOrder = await labOrderRepo.getRepository()
      .createQueryBuilder('order')
      .where('order.organizationId = :orgId', { orgId })
      .andWhere('order.orderNumber LIKE :pattern', { pattern: `LAB-${year}-%` })
      .orderBy('order.createdAt', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `LAB-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  // Create a new lab order (for doctors)
  static createLabOrder = async (req: Request, res: Response) => {
    try {
      const { patientId, tests, clinicalNotes, diagnosis, isUrgent } = req.body;
      const doctorId = (req as any).user.id;
      const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );
      const labOrderItemTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrderItem),
        orgId
      );
      const labTestTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabTest),
        orgId
      );

      // Generate order number
      const orderNumber = await LabOrderController.generateOrderNumber(orgId);

      // Create lab order
      const labOrder = labOrderTenantRepo.create({
        orderNumber,
        doctorId,
        patientId,
        orderDate: new Date(),
        clinicalNotes,
        diagnosis,
        isUrgent: isUrgent || false,
        status: 'ordered'
      });

      const savedOrder = await labOrderTenantRepo.save(labOrder);

      // Create order items
      const orderItems = [];
      for (const testId of tests) {
        const test = await labTestTenantRepo.findOne({ where: { id: testId } });
        if (test) {
          const item = labOrderItemTenantRepo.create({
            labOrderId: savedOrder.id,
            labTestId: testId,
            status: 'ordered'
          });
          orderItems.push(item);
        }
      }

      await labOrderItemTenantRepo.saveMany(orderItems);

      // Fetch complete order with relations
      const completeOrder = await labOrderTenantRepo.findOne({
        where: { id: savedOrder.id },
        relations: ['doctor', 'patient', 'items', 'items.labTest']
      });

      res.status(201).json(completeOrder);
    } catch (error) {
      console.error('Error creating lab order:', error);
      res.status(500).json({ message: 'Error creating lab order' });
    }
  };

  // Get lab orders by patient
  static getPatientLabOrders = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;
      const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const tenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );

      const orders = await tenantRepo.find({
        where: { patientId },
        relations: ['doctor', 'patient', 'items', 'items.labTest', 'items.result'],
        order: { createdAt: 'DESC' }
      });

      res.json(orders);
    } catch (error) {
      console.error('Error fetching patient lab orders:', error);
      res.status(500).json({ message: 'Error fetching patient lab orders' });
    }
  };

  // Get lab orders by doctor
  static getDoctorLabOrders = async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user.id;
      const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const tenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );

      const orders = await tenantRepo.find({
        where: { doctorId },
        relations: ['doctor', 'patient', 'items', 'items.labTest', 'items.result'],
        order: { createdAt: 'DESC' }
      });

      res.json(orders);
    } catch (error) {
      console.error('Error fetching doctor lab orders:', error);
      res.status(500).json({ message: 'Error fetching doctor lab orders' });
    }
  };

  // Get pending lab orders (for lab technicians)
  static getPendingLabOrders = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderRepo = AppDataSource.getRepository(LabOrder);

      const orders = await labOrderRepo
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.doctor', 'doctor')
        .leftJoinAndSelect('order.patient', 'patient')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.labTest', 'labTest')
        .leftJoinAndSelect('items.sample', 'sample')
        .where('order.organizationId = :orgId', { orgId })
        .andWhere('order.status IN (:...statuses)', {
          statuses: ['ordered', 'sample_collected', 'in_progress']
        })
        .orderBy('order.isUrgent', 'DESC')
        .addOrderBy('order.createdAt', 'ASC')
        .getMany();

      res.json(orders);
    } catch (error) {
      console.error('Error fetching pending lab orders:', error);
      res.status(500).json({ message: 'Error fetching pending lab orders' });
    }
  };

  // Get all lab orders (admin)
  static getAllLabOrders = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, status = '' } = req.query;
      const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const tenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );

      const whereConditions: any = {};
      if (status) {
        whereConditions.status = status;
      }

      const [orders, total] = await tenantRepo.getRepository().findAndCount({
        where: { ...whereConditions, organizationId: orgId },
        relations: ['doctor', 'patient', 'items', 'items.labTest'],
        order: { createdAt: 'DESC' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });

      res.json({
        orders,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      console.error('Error fetching all lab orders:', error);
      res.status(500).json({ message: 'Error fetching all lab orders' });
    }
  };

  // Get single lab order by ID
  static getLabOrderById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const tenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );

      const order = await tenantRepo.findOne({
        where: { id },
        relations: ['doctor', 'patient', 'items', 'items.labTest', 'items.sample', 'items.result']
      });

      if (!order) {
        return res.status(404).json({ message: 'Lab order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Error fetching lab order:', error);
      res.status(500).json({ message: 'Error fetching lab order' });
    }
  };

  // Update lab order status
  static updateLabOrderStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const tenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );

      const order = await tenantRepo.findOne({ where: { id } });

      if (!order) {
        return res.status(404).json({ message: 'Lab order not found' });
      }

      order.status = status;
      const updatedOrder = await tenantRepo.save(order);

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating lab order status:', error);
      res.status(500).json({ message: 'Error updating lab order status' });
    }
  };

  // Cancel lab order
  static cancelLabOrder = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );
      const labOrderItemTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrderItem),
        orgId
      );

      const order = await labOrderTenantRepo.findOne({
        where: { id },
        relations: ['items']
      });

      if (!order) {
        return res.status(404).json({ message: 'Lab order not found' });
      }

      // Update order status
      order.status = 'cancelled';
      await labOrderTenantRepo.save(order);

      // Update all items status
      for (const item of order.items) {
        item.status = 'cancelled';
        if (reason) {
          item.notes = `Cancelled: ${reason}`;
        }
        await labOrderItemTenantRepo.save(item);
      }

      res.json({ message: 'Lab order cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling lab order:', error);
      res.status(500).json({ message: 'Error cancelling lab order' });
    }
  };
}
```

---

## Example 2: Complete Vital Signs Controller

```typescript
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { VitalSigns } from '../models/VitalSigns';
import { User } from '../models/User';
import { ConsultationNote } from '../models/ConsultationNote';
import { createTenantRepository } from '../repositories/TenantRepository';

export class VitalSignsController {
  // Record vital signs
  static recordVitalSigns = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;
      const {
        patientId,
        consultationId,
        systolicBp,
        diastolicBp,
        heartRate,
        respiratoryRate,
        temperature,
        temperatureUnit,
        oxygenSaturation,
        weight,
        weightUnit,
        height,
        heightUnit,
        painScale
      } = req.body;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required' });
      }

      const vitalSignsTenantRepo = createTenantRepository(
        AppDataSource.getRepository(VitalSigns),
        orgId
      );
      const userTenantRepo = createTenantRepository(
        AppDataSource.getRepository(User),
        orgId
      );

      const patient = await userTenantRepo.findOne({ where: { id: patientId } });
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const recordedBy = await userTenantRepo.findOne({ where: { id: userId } });
      if (!recordedBy) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Calculate BMI if weight and height are provided
      let bmi: number | undefined;
      if (weight && height) {
        let weightKg = weight;
        let heightM = height / 100;

        if (weightUnit === 'lbs') {
          weightKg = weight * 0.453592;
        }
        if (heightUnit === 'in') {
          heightM = (height * 2.54) / 100;
        }

        bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
      }

      const vitalSigns = vitalSignsTenantRepo.create({
        patient,
        recordedBy,
        systolicBp,
        diastolicBp,
        heartRate,
        respiratoryRate,
        temperature,
        temperatureUnit,
        oxygenSaturation,
        weight,
        weightUnit,
        height,
        heightUnit,
        bmi,
        painScale
      });

      // Link to consultation if provided
      if (consultationId) {
        const consultationTenantRepo = createTenantRepository(
          AppDataSource.getRepository(ConsultationNote),
          orgId
        );
        const consultation = await consultationTenantRepo.findOne({
          where: { id: consultationId }
        });
        if (consultation) {
          vitalSigns.consultation = consultation;
        }
      }

      await vitalSignsTenantRepo.save(vitalSigns);

      return res.status(201).json({
        message: 'Vital signs recorded successfully',
        data: vitalSigns
      });
    } catch (error) {
      console.error('Error recording vital signs:', error);
      return res.status(500).json({ message: 'Error recording vital signs' });
    }
  };

  // Get vital signs by ID
  static getVitalSigns = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const tenantRepo = createTenantRepository(
        AppDataSource.getRepository(VitalSigns),
        orgId
      );

      const vitalSigns = await tenantRepo.findOne({
        where: { id },
        relations: ['patient', 'recordedBy', 'consultation']
      });

      if (!vitalSigns) {
        return res.status(404).json({ message: 'Vital signs not found' });
      }

      return res.json({ data: vitalSigns });
    } catch (error) {
      console.error('Error fetching vital signs:', error);
      return res.status(500).json({ message: 'Error fetching vital signs' });
    }
  };

  // Get patient vital signs
  static getPatientVitalSigns = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const vitalSignsRepo = AppDataSource.getRepository(VitalSigns);

      const [vitalSigns, total] = await vitalSignsRepo
        .createQueryBuilder('vs')
        .leftJoinAndSelect('vs.recordedBy', 'recordedBy')
        .where('vs.organizationId = :orgId', { orgId })
        .andWhere('vs.patientId = :id', { id })
        .orderBy('vs.recordedAt', 'DESC')
        .take(Number(limit))
        .skip(Number(offset))
        .getManyAndCount();

      return res.json({
        data: vitalSigns,
        total,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      console.error('Error fetching patient vital signs:', error);
      return res.status(500).json({ message: 'Error fetching vital signs' });
    }
  };

  // Get vital signs trends
  static getVitalSignsTrends = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;
      const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const vitalSignsRepo = AppDataSource.getRepository(VitalSigns);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const vitalSigns = await vitalSignsRepo.createQueryBuilder('vs')
        .where('vs.organizationId = :orgId', { orgId })
        .andWhere('vs.patientId = :patientId', { patientId: id })
        .andWhere('vs.recordedAt >= :startDate', { startDate })
        .orderBy('vs.recordedAt', 'ASC')
        .getMany();

      // Calculate trends
      const trends = {
        bloodPressure: vitalSigns
          .filter(vs => vs.systolicBp && vs.diastolicBp)
          .map(vs => ({
            date: vs.recordedAt,
            systolic: vs.systolicBp,
            diastolic: vs.diastolicBp
          })),
        heartRate: vitalSigns
          .filter(vs => vs.heartRate)
          .map(vs => ({
            date: vs.recordedAt,
            value: vs.heartRate
          })),
        temperature: vitalSigns
          .filter(vs => vs.temperature)
          .map(vs => ({
            date: vs.recordedAt,
            value: vs.temperature,
            unit: vs.temperatureUnit
          })),
        weight: vitalSigns
          .filter(vs => vs.weight)
          .map(vs => ({
            date: vs.recordedAt,
            value: vs.weight,
            unit: vs.weightUnit,
            bmi: vs.bmi
          })),
        oxygenSaturation: vitalSigns
          .filter(vs => vs.oxygenSaturation)
          .map(vs => ({
            date: vs.recordedAt,
            value: vs.oxygenSaturation
          }))
      };

      // Calculate averages
      const averages = {
        systolicBp: trends.bloodPressure.length > 0
          ? Math.round(trends.bloodPressure.reduce((sum, item) => sum + (item.systolic || 0), 0) / trends.bloodPressure.length)
          : null,
        diastolicBp: trends.bloodPressure.length > 0
          ? Math.round(trends.bloodPressure.reduce((sum, item) => sum + (item.diastolic || 0), 0) / trends.bloodPressure.length)
          : null,
        heartRate: trends.heartRate.length > 0
          ? Math.round(trends.heartRate.reduce((sum, item) => sum + (item.value || 0), 0) / trends.heartRate.length)
          : null,
        temperature: trends.temperature.length > 0
          ? (trends.temperature.reduce((sum, item) => sum + (item.value || 0), 0) / trends.temperature.length).toFixed(1)
          : null,
        weight: trends.weight.length > 0
          ? (trends.weight.reduce((sum, item) => sum + (item.value || 0), 0) / trends.weight.length).toFixed(1)
          : null,
        oxygenSaturation: trends.oxygenSaturation.length > 0
          ? Math.round(trends.oxygenSaturation.reduce((sum, item) => sum + (item.value || 0), 0) / trends.oxygenSaturation.length)
          : null
      };

      return res.json({
        data: {
          trends,
          averages,
          period: {
            days: Number(days),
            startDate,
            endDate: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Error fetching vital signs trends:', error);
      return res.status(500).json({ message: 'Error fetching trends' });
    }
  };
}
```

---

## Key Patterns to Follow

### 1. Always Extract and Validate orgId
```typescript
const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

if (!orgId) {
  return res.status(400).json({ message: 'Organization context required' });
}
```

### 2. Create Tenant Repositories
```typescript
const tenantRepo = createTenantRepository(
  AppDataSource.getRepository(ModelName),
  orgId
);
```

### 3. Use QueryBuilder with orgId Filter
```typescript
const results = await repo
  .createQueryBuilder('entity')
  .where('entity.organizationId = :orgId', { orgId })
  .andWhere('entity.someField = :value', { value })
  .getMany();
```

### 4. Handle Related Entities
```typescript
// Create tenant repos for all related entities
const userTenantRepo = createTenantRepository(AppDataSource.getRepository(User), orgId);
const orderTenantRepo = createTenantRepository(AppDataSource.getRepository(Order), orgId);

// Use them consistently
const user = await userTenantRepo.findOne({ where: { id: userId } });
const order = orderTenantRepo.create({ user, ...orderData });
await orderTenantRepo.save(order);
```

---

## Testing Checklist

For each updated controller:

- [ ] Unit test: Verify orgId is required
- [ ] Unit test: Verify correct tenant filtering
- [ ] Integration test: Create data in Org A
- [ ] Integration test: Verify Org B cannot access Org A's data
- [ ] Integration test: Verify Org A can only see their data
- [ ] Load test: Verify performance is acceptable
- [ ] Security test: Attempt cross-tenant access injection
- [ ] Audit log: Verify all operations are logged with orgId

---

## Common Pitfalls to Avoid

1. **Forgetting to filter in QueryBuilders** - Always add `.where('entity.organizationId = :orgId', { orgId })`
2. **Using base repo directly** - Always wrap with `createTenantRepository()`
3. **Not validating orgId** - Always check `if (!orgId)` at method start
4. **Mixing tenant and non-tenant repos** - Be consistent within a method
5. **Forgetting related entities** - All entities in a method need tenant filtering

---

This reference implementation should be used as a template for updating all remaining controllers.
