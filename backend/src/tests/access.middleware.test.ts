import { canDoctorAccessPatient, enforcePatientReportAccess } from '../middleware/access.middleware';
import { AppDataSource } from '../config/database';
import { Request, Response, NextFunction } from 'express';

jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

type RepoMock = {
  findOne?: jest.Mock;
  createQueryBuilder?: jest.Mock;
};

const qbMock = (result?: any) => {
  const chain: any = {
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  };
  return chain;
};

const mockRepo = (overrides: Partial<RepoMock> = {}): RepoMock => ({
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
  ...overrides,
});

const setRepos = (repos: { user?: RepoMock; referral?: RepoMock; appointment?: RepoMock }) => {
  (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
    const name = entity?.name || entity?.constructor?.name;
    if (name === 'User') return repos.user;
    if (name === 'Referral') return repos.referral;
    if (name === 'Appointment') return repos.appointment;
    return mockRepo();
  });
};

const userDoctor = { id: 'doc1', role: 'doctor', departmentId: 'D1' } as any;
const userPatient = { id: 'pat1', role: 'patient', primaryDepartmentId: 'D1' } as any;

describe('canDoctorAccessPatient', () => {
  beforeEach(() => jest.resetAllMocks());

  it('allows access when doctor and patient share primary department', async () => {
    const userRepo = mockRepo({
      findOne: jest
        .fn()
        .mockResolvedValueOnce(userDoctor)
        .mockResolvedValueOnce(userPatient),
    });
    setRepos({ user: userRepo, referral: mockRepo(), appointment: mockRepo({ createQueryBuilder: jest.fn(() => qbMock(undefined)) }) });

    const ok = await canDoctorAccessPatient('pat1', 'doc1');
    expect(ok).toBe(true);
  });

  it('allows access when a referral exists to doctor department', async () => {
    const userRepo = mockRepo({ findOne: jest.fn().mockResolvedValueOnce({ ...userDoctor, departmentId: 'D2' }).mockResolvedValueOnce({ ...userPatient, primaryDepartmentId: 'D3' }) });
    const referralRepo = mockRepo({ findOne: jest.fn().mockResolvedValue({ id: 'ref1' }) });
    setRepos({ user: userRepo, referral: referralRepo, appointment: mockRepo({ createQueryBuilder: jest.fn(() => qbMock(undefined)) }) });

    const ok = await canDoctorAccessPatient('pat1', 'doc1');
    expect(ok).toBe(true);
  });

  it('allows access when there is an appointment (treated-patient)', async () => {
    const userRepo = mockRepo({ findOne: jest.fn().mockResolvedValueOnce({ ...userDoctor, departmentId: 'D4' }).mockResolvedValueOnce({ ...userPatient, primaryDepartmentId: 'D3' }) });
    const apptRepo = mockRepo({ createQueryBuilder: jest.fn(() => qbMock({ id: 'a1' })) });
    setRepos({ user: userRepo, referral: mockRepo({ findOne: jest.fn().mockResolvedValue(undefined) }), appointment: apptRepo });

    const ok = await canDoctorAccessPatient('pat1', 'doc1');
    expect(ok).toBe(true);
  });

  it('denies access when no department/referral/appointment match', async () => {
    const userRepo = mockRepo({ findOne: jest.fn().mockResolvedValueOnce({ ...userDoctor, departmentId: 'D9' }).mockResolvedValueOnce({ ...userPatient, primaryDepartmentId: 'D3' }) });
    setRepos({ user: userRepo, referral: mockRepo({ findOne: jest.fn().mockResolvedValue(undefined) }), appointment: mockRepo({ createQueryBuilder: jest.fn(() => qbMock(undefined)) }) });

    const ok = await canDoctorAccessPatient('pat1', 'doc1');
    expect(ok).toBe(false);
  });

  it('denies access if user is not a doctor', async () => {
    const userRepo = mockRepo({ findOne: jest.fn().mockResolvedValueOnce({ id: 'doc1', role: 'patient' }).mockResolvedValueOnce(userPatient) });
    setRepos({ user: userRepo, referral: mockRepo(), appointment: mockRepo() });

    const ok = await canDoctorAccessPatient('pat1', 'doc1');
    expect(ok).toBe(false);
  });
});

describe('enforcePatientReportAccess', () => {
  beforeEach(() => jest.resetAllMocks());

  it('bypasses for admin', async () => {
    const middleware = enforcePatientReportAccess((req) => (req as any).params?.patientId);
    const req = { user: { id: '1', role: 'admin' }, params: { patientId: 'pat1' } } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn();
    await (middleware as any)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows when doctor shares primary department with patient', async () => {
    // Mock repos so canDoctorAccessPatient resolves true via primary dept rule
    const userRepo = mockRepo({
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ id: 'doc1', role: 'doctor', departmentId: 'D1' }) // doctor
        .mockResolvedValueOnce({ id: 'pat1', role: 'patient', primaryDepartmentId: 'D1' }), // patient
    });
    const referralRepo = mockRepo({ findOne: jest.fn().mockResolvedValue(undefined) });
    const apptRepo = mockRepo({ createQueryBuilder: jest.fn(() => qbMock(undefined)) });
    setRepos({ user: userRepo, referral: referralRepo, appointment: apptRepo });

    const middleware = enforcePatientReportAccess((req) => (req as any).params?.patientId);
    const req = { user: { id: 'doc1', role: 'doctor' }, params: { patientId: 'pat1' } } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    const next = jest.fn();
    await (middleware as any)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('denies with 403 when doctor lacks department relationship/referral/appointments', async () => {
    const userRepo = mockRepo({
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ id: 'doc1', role: 'doctor', departmentId: 'D9' })
        .mockResolvedValueOnce({ id: 'pat1', role: 'patient', primaryDepartmentId: 'D3' }),
    });
    const referralRepo = mockRepo({ findOne: jest.fn().mockResolvedValue(undefined) });
    const apptRepo = mockRepo({ createQueryBuilder: jest.fn(() => qbMock(undefined)) });
    setRepos({ user: userRepo, referral: referralRepo, appointment: apptRepo });

    const middleware = enforcePatientReportAccess((req) => (req as any).params?.patientId);
    const req = { user: { id: 'doc1', role: 'doctor' }, params: { patientId: 'pat1' } } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    const next = jest.fn();
    await (middleware as any)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Access denied') }));
  });

  it('returns 400 when patientId missing', async () => {
    const middleware = enforcePatientReportAccess(() => '' as any);
    const req = { user: { id: 'doc1', role: 'doctor' }, params: {} } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    const next = jest.fn();
    await (middleware as any)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
