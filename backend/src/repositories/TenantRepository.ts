import { Repository, FindManyOptions, FindOneOptions, DeepPartial, FindOptionsWhere } from 'typeorm';

/**
 * Base Repository with Automatic Tenant Filtering
 * 
 * This repository wraps TypeORM's Repository and automatically adds
 * organization_id filtering to all queries, ensuring complete tenant isolation.
 * 
 * Usage:
 * ```typescript
 * const tenantRepo = new TenantRepository(userRepository, req.tenant.id);
 * const users = await tenantRepo.find(); // Automatically filtered by tenant
 * ```
 */
export class TenantRepository<Entity extends { organizationId?: string }> {
  constructor(
    private readonly repository: Repository<Entity>,
    private readonly tenantId: string
  ) {}

  /**
   * Find multiple entities (automatically filtered by tenant)
   */
  async find(options?: FindManyOptions<Entity>): Promise<Entity[]> {
    return this.repository.find({
      ...options,
      where: this.addTenantFilter(options?.where),
    } as FindManyOptions<Entity>);
  }

  /**
   * Find one entity (automatically filtered by tenant)
   */
  async findOne(options: FindOneOptions<Entity>): Promise<Entity | null> {
    return this.repository.findOne({
      ...options,
      where: this.addTenantFilter(options.where),
    } as FindOneOptions<Entity>);
  }

  /**
   * Find by ID (automatically filtered by tenant)
   */
  async findById(id: string, options?: FindOneOptions<Entity>): Promise<Entity | null> {
    return this.repository.findOne({
      ...options,
      where: this.addTenantFilter({ id, ...options?.where } as any),
    } as FindOneOptions<Entity>);
  }

  /**
   * Count entities (automatically filtered by tenant)
   */
  async count(options?: FindManyOptions<Entity>): Promise<number> {
    return this.repository.count({
      ...options,
      where: this.addTenantFilter(options?.where),
    } as FindManyOptions<Entity>);
  }

  /**
   * Save entity (automatically adds tenant ID)
   */
  async save(entity: DeepPartial<Entity>): Promise<Entity> {
    (entity as any).organizationId = this.tenantId;
    return this.repository.save(entity as any);
  }

  /**
   * Save multiple entities (automatically adds tenant ID)
   */
  async saveMany(entities: DeepPartial<Entity>[]): Promise<Entity[]> {
    entities.forEach(entity => {
      (entity as any).organizationId = this.tenantId;
    });
    return this.repository.save(entities as any);
  }

  /**
   * Create entity instance (automatically adds tenant ID)
   */
  create(entityLike: DeepPartial<Entity>): Entity {
    (entityLike as any).organizationId = this.tenantId;
    return this.repository.create(entityLike as any);
  }

  /**
   * Create multiple entity instances (automatically adds tenant ID)
   */
  createMany(entityLikes: DeepPartial<Entity>[]): Entity[] {
    entityLikes.forEach(entity => {
      (entity as any).organizationId = this.tenantId;
    });
    return this.repository.create(entityLikes as any);
  }

  /**
   * Update entity (automatically filtered by tenant)
   */
  async update(
    criteria: string | string[] | FindOptionsWhere<Entity>,
    partialEntity: DeepPartial<Entity>
  ): Promise<any> {
    // Add tenant filter to criteria
    const where = typeof criteria === 'string' || Array.isArray(criteria)
      ? { id: criteria }
      : criteria;
    
    return this.repository.update(
      this.addTenantFilter(where) as any,
      partialEntity
    );
  }

  /**
   * Delete entity (automatically filtered by tenant)
   */
  async delete(criteria: string | string[] | FindOptionsWhere<Entity>): Promise<any> {
    const where = typeof criteria === 'string' || Array.isArray(criteria)
      ? { id: criteria }
      : criteria;
    
    return this.repository.delete(
      this.addTenantFilter(where) as any
    );
  }

  /**
   * Soft delete entity (automatically filtered by tenant)
   */
  async softDelete(criteria: string | string[] | FindOptionsWhere<Entity>): Promise<any> {
    const where = typeof criteria === 'string' || Array.isArray(criteria)
      ? { id: criteria }
      : criteria;
    
    return this.repository.softDelete(
      this.addTenantFilter(where) as any
    );
  }

  /**
   * Get the underlying TypeORM repository (use with caution!)
   * This bypasses tenant filtering - only use when you know what you're doing
   */
  getRepository(): Repository<Entity> {
    return this.repository;
  }

  /**
   * Get the current tenant ID
   */
  getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Helper: Add tenant filter to where clause
   */
  private addTenantFilter(where: any): any {
    if (!where) {
      return { organizationId: this.tenantId };
    }

    if (Array.isArray(where)) {
      return where.map(w => ({ ...w, organizationId: this.tenantId }));
    }

    return { ...where, organizationId: this.tenantId };
  }
}

/**
 * Helper function to create a tenant repository
 * 
 * Usage:
 * ```typescript
 * import { createTenantRepository } from './repositories/TenantRepository';
 * 
 * const userRepo = createTenantRepository(
 *   AppDataSource.getRepository(User),
 *   req.tenant.id
 * );
 * ```
 */
export function createTenantRepository<Entity extends { organizationId?: string }>(
  repository: Repository<Entity>,
  tenantId: string
): TenantRepository<Entity> {
  return new TenantRepository(repository, tenantId);
}
