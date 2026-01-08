import { Request, Response, NextFunction } from 'express';
import { authorize, isAdmin, isDoctor, isPatient } from '../middleware/rbac.middleware';
import { Permission, UserRole } from '../types/roles';

function makeReq(user?: Partial<{ id: string; role: UserRole; permissions: Permission[] }>) {
  return { user } as unknown as Request;
}

function makeNext() {
  const next = jest.fn((err?: any) => {});
  return next as unknown as NextFunction & jest.Mock;
}

describe('rbac.middleware authorize', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('denies when unauthenticated', async () => {
    const mw = authorize({ requireRole: UserRole.DOCTOR });
    const req = makeReq(undefined);
    const next = makeNext();
    await (mw as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeInstanceOf(Error);
    expect(((next as any).mock.calls[0][0] as Error).message).toMatch(/Authentication required/i);
  });

  it('allows SUPER_ADMIN bypass for any requirements', async () => {
    const mw = authorize({ requireAll: [Permission.DELETE_USER, Permission.MANAGE_INVENTORY] });
    const req = makeReq({ id: '1', role: UserRole.SUPER_ADMIN, permissions: [] });
    const next = makeNext();
    await (mw as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeUndefined();
  });

  it('requireRole: allows user with matching role', async () => {
    const mw = authorize({ requireRole: UserRole.DOCTOR });
    const req = makeReq({ id: 'd1', role: UserRole.DOCTOR, permissions: [] });
    const next = makeNext();
    await (mw as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeUndefined();
  });

  it('requireRole: denies user with non-matching role', async () => {
    const mw = authorize({ requireRole: UserRole.DOCTOR });
    const req = makeReq({ id: 'n1', role: UserRole.NURSE, permissions: [] });
    const next = makeNext();
    await (mw as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeInstanceOf(Error);
    expect(((next as any).mock.calls[0][0] as Error).message).toMatch(/Insufficient permissions/i);
  });

  it('requireOneOf: allows when rolePermissions grant it (doctor can CREATE_MEDICAL_RECORD)', async () => {
    const mw = authorize({ requireOneOf: [Permission.CREATE_MEDICAL_RECORD] });
    const req = makeReq({ id: 'd1', role: UserRole.DOCTOR, permissions: [] });
    const next = makeNext();
    await (mw as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeUndefined();
  });

  it('requireOneOf: denies when neither rolePermissions nor overrides grant it', async () => {
    const mw = authorize({ requireOneOf: [Permission.CREATE_USER] });
    const req = makeReq({ id: 'p1', role: UserRole.PATIENT, permissions: [] });
    const next = makeNext();
    await (mw as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('requireOneOf: allows when user has per-user override permissions', async () => {
    const mw = authorize({ requireOneOf: [Permission.VIEW_USER] });
    const req = makeReq({ id: 'p1', role: UserRole.PATIENT, permissions: [Permission.VIEW_USER] });
    const next = makeNext();
    await (mw as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeUndefined();
  });

  it('requireAll: allows when all permissions are granted by role', async () => {
    const mw = authorize({ requireAll: [Permission.CREATE_USER, Permission.UPDATE_USER] });
    const req = makeReq({ id: 'a1', role: UserRole.ADMIN, permissions: [] });
    const next = makeNext();
    await (mw as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeUndefined();
  });

  it('requireAll: denies when one of the permissions is missing for the role', async () => {
    const mw = authorize({ requireAll: [Permission.CREATE_USER, Permission.DELETE_USER] });
    const req = makeReq({ id: 'a1', role: UserRole.ADMIN, permissions: [] });
    const next = makeNext();
    await (mw as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('customCheck: allows when custom check returns true', async () => {
    const mw = authorize({ customCheck: () => true });
    const req = makeReq({ id: 'x1', role: UserRole.PATIENT, permissions: [] });
    const next = makeNext();
    await (mw as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeUndefined();
  });

  it('customCheck: denies when custom check returns false', async () => {
    const mw = authorize({ customCheck: () => false });
    const req = makeReq({ id: 'x1', role: UserRole.PATIENT, permissions: [] });
    const next = makeNext();
    await (mw as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeInstanceOf(Error);
  });
});

// Basic smoke tests for convenience guards

describe('rbac convenience guards', () => {
  it('isAdmin allows admin', async () => {
    const req = makeReq({ id: '1', role: UserRole.ADMIN, permissions: [] });
    const next = makeNext();
    await (isAdmin as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeUndefined();
  });

  it('isDoctor denies non-doctor', async () => {
    const req = makeReq({ id: '1', role: UserRole.NURSE, permissions: [] });
    const next = makeNext();
    await (isDoctor as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('isPatient allows patient', async () => {
    const req = makeReq({ id: '1', role: UserRole.PATIENT, permissions: [] });
    const next = makeNext();
    await (isPatient as any)(req, {} as Response, next);
    expect((next as any).mock.calls[0][0]).toBeUndefined();
  });
});
