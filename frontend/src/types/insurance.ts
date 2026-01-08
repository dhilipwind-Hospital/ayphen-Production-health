export type Plan = {
  id: string;
  name: string;
  insurer: string;
  coverageLevel: 'Basic' | 'Standard' | 'Premium' | string;
  priceMonthly: number;
  waitingPeriod: string;
  benefits: string[];
  country?: string; // ISO 3166-1 alpha-2
};

export type PremiumCalcRequest = {
  age: number;
  dependents: number;
  prevYears?: number;
};

export type PremiumCalcResponse = {
  base: number;
  loading: number;
  total: number;
};

export type CompareRequest = { planIds: string[] };
export type CompareRow = {
  id: string;
  name: string;
  insurer: string;
  coverageLevel: string;
  waitingPeriod: string;
  priceMonthly: number;
  benefits?: string[];
};

export type FamilyCalcRequest = {
  primaryAge: number;
  spouseAge?: number;
  children: number;
  insurerPreference?: string;
  priority?: 'cheapest' | 'coverage' | 'waiting';
};

export type PurchaseRequest = {
  planId: string;
  billingCycle: 'monthly' | 'annual';
};
export type PurchaseResponse = {
  policyId: string;
  documents: { id: string; name: string; url?: string }[];
};

export type Claim = {
  id: string;
  date: string; // ISO date
  type: string;
  amount: number;
  status: 'Approved' | 'Rejected' | 'Processing' | string;
};

export type BenefitUsage = {
  key: string;
  label: string;
  used: number;
  total: number;
};

export type UserDashboard = {
  benefits: BenefitUsage[];
};
