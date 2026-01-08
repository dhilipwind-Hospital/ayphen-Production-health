import { AuthController } from '../controllers/auth.controller';
import { AppDataSource } from '../config/database';
import { Request, Response } from 'express';

jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

type MockRes = {
  status: jest.Mock;
  json: jest.Mock;
  cookie: jest.Mock;
  clearCookie: jest.Mock;
};

const createRes = (): MockRes => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res as MockRes;
};

describe('AuthController.register', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 400 when passwords do not match', async () => {
    const req = { body: { firstName: 'A', lastName: 'B', email: 'a@b.com', phone: '1234567890', password: 'Abcd1234!', confirmPassword: 'Mismatch1!' } } as unknown as Request;
    const res = createRes();

    await AuthController.register(req, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('do not match') }));
  });

  it('returns 400 when password is weak', async () => {
    const req = { body: { firstName: 'A', lastName: 'B', email: 'a@b.com', phone: '1234567890', password: 'weakpass', confirmPassword: 'weakpass' } } as unknown as Request;
    const res = createRes();

    await AuthController.register(req, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Password must contain') }));
  });

  it('returns 400 when email already in use', async () => {
    (AppDataSource.getRepository as jest.Mock).mockReturnValue({
      findOne: jest.fn().mockResolvedValue({ id: 'u1', email: 'a@b.com' }),
    });

    const req = { body: { firstName: 'A', lastName: 'B', email: 'a@b.com', phone: '1234567890', password: 'Abcd1234!', confirmPassword: 'Abcd1234!' } } as unknown as Request;
    const res = createRes();

    await AuthController.register(req, res as unknown as Response);

    expect(AppDataSource.getRepository).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('already in use') }));
  });
});
