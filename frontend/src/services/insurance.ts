import api from './api';
import { INSURANCE_USE_MOCK } from '../config/insurance';
import type {
  Plan,
  PremiumCalcRequest,
  PremiumCalcResponse,
  CompareRequest,
  CompareRow,
  FamilyCalcRequest,
  PurchaseRequest,
  PurchaseResponse,
  Claim,
  UserDashboard,
} from '../types/insurance';

// Mock implementations
import * as mock from './__mocks__/insurance.mock';

export async function listPlans(country?: string): Promise<Plan[]> {
  if (INSURANCE_USE_MOCK) return mock.listPlans(country);
  const params: Record<string, string> = {};
  if (country && country.toUpperCase() !== 'ALL') params.country = country.toUpperCase();
  const { data } = await api.get<Plan[]>(`/plans`, { params });
  return data as any;
}

export async function recommendPlans(): Promise<Plan[]> {
  if (INSURANCE_USE_MOCK) return mock.recommendPlans();
  const { data } = await api.post<Plan[]>(`/plans/recommend`, {});
  return data as any;
}

export async function comparePlans(body: CompareRequest): Promise<CompareRow[]> {
  if (INSURANCE_USE_MOCK) return mock.comparePlans(body);
  const { data } = await api.post<CompareRow[]>(`/plans/compare`, body);
  return data as any;
}

export async function calculatePremium(body: PremiumCalcRequest): Promise<PremiumCalcResponse> {
  if (INSURANCE_USE_MOCK) return mock.calculatePremium(body);
  const { data } = await api.post<PremiumCalcResponse>(`/calculator/premium`, body);
  return data as any;
}

export async function familyCalc(body: FamilyCalcRequest, country?: string): Promise<Plan[]> {
  if (INSURANCE_USE_MOCK) return mock.familyCalc(body, country);
  const params: Record<string, string> = {};
  if (country && country.toUpperCase() !== 'ALL') params.country = country.toUpperCase();
  const { data } = await api.post<Plan[]>(`/plans/family-calc`, body, { params });
  return data as any;
}

export async function purchase(body: PurchaseRequest): Promise<PurchaseResponse> {
  if (INSURANCE_USE_MOCK) return mock.purchase(body);
  const { data } = await api.post<PurchaseResponse>(`/plans/purchase`, body);
  return data as any;
}

export async function listClaims(): Promise<Claim[]> {
  if (INSURANCE_USE_MOCK) return mock.listClaims();
  const { data } = await api.get<Claim[]>(`/users/me/claims`);
  return data as any;
}

export async function dashboard(): Promise<UserDashboard> {
  if (INSURANCE_USE_MOCK) return mock.dashboard();
  const { data } = await api.get<UserDashboard>(`/users/me/dashboard`);
  return data as any;
}
