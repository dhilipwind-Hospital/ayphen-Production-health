import { Plan, PremiumCalcRequest, PremiumCalcResponse, CompareRequest, CompareRow, FamilyCalcRequest, PurchaseRequest, PurchaseResponse, Claim, BenefitUsage, UserDashboard } from '../../types/insurance';

export const mockPlans: Plan[] = [
  { id: 'ie-basic', name: 'Essential Care', insurer: 'Vhi', coverageLevel: 'Basic', priceMonthly: 49.99, waitingPeriod: '26 weeks', benefits: ['GP x2', 'ER Cover', 'Day-care'], country: 'IE' },
  { id: 'ie-plus', name: 'Silver Plus', insurer: 'Laya', coverageLevel: 'Standard', priceMonthly: 79.99, waitingPeriod: '16 weeks', benefits: ['GP x4', 'Physio x3', 'ER Cover', 'Day-care'], country: 'IE' },
  { id: 'ie-premium', name: 'Prime Advantage', insurer: 'Irish Life', coverageLevel: 'Premium', priceMonthly: 119.99, waitingPeriod: '8 weeks', benefits: ['GP unlimited', 'Physio x6', 'Private Room', 'ER Cover'], country: 'IE' },
  { id: 'us-basic', name: 'Care Basic', insurer: 'BlueShield', coverageLevel: 'Basic', priceMonthly: 59.99, waitingPeriod: '12 weeks', benefits: ['PCP x2', 'ER Cover'], country: 'US' },
  { id: 'in-plus', name: 'Arogya Plus', insurer: 'StarHealth', coverageLevel: 'Standard', priceMonthly: 24.99, waitingPeriod: '30 days', benefits: ['OPD x3', 'Day-care', 'AYUSH'], country: 'IN' },
];

export async function listPlans(country?: string): Promise<Plan[]> {
  await new Promise(r => setTimeout(r, 300));
  const code = String(country || '').toUpperCase();
  if (!code || code === 'ALL') return mockPlans;
  return mockPlans.filter(p => String(p.country || '').toUpperCase() === code);
}

export async function recommendPlans(): Promise<Plan[]> {
  await new Promise(r => setTimeout(r, 200));
  return mockPlans.slice(0, 2);
}

export async function comparePlans(body: CompareRequest): Promise<CompareRow[]> {
  await new Promise(r => setTimeout(r, 200));
  const map = new Map(mockPlans.map(p => [p.id, p] as const));
  return (body.planIds || []).map(id => {
    const p = map.get(id) || mockPlans[0];
    return {
      id: p.id,
      name: p.name,
      insurer: p.insurer,
      coverageLevel: p.coverageLevel,
      waitingPeriod: p.waitingPeriod,
      priceMonthly: p.priceMonthly,
      benefits: p.benefits,
    };
  });
}

export async function calculatePremium(body: PremiumCalcRequest): Promise<PremiumCalcResponse> {
  await new Promise(r => setTimeout(r, 200));
  const age = Number(body.age || 30);
  const dependents = Number(body.dependents || 0);
  const base = 50 + Math.max(0, age - 30) * 1.2 + dependents * 15;
  const loading = age > 34 ? Math.round(base * 0.1) : 0;
  const total = Math.round((base + loading) * 100) / 100;
  return { base, loading, total };
}

export async function familyCalc(_body: FamilyCalcRequest, country?: string): Promise<Plan[]> {
  await new Promise(r => setTimeout(r, 200));
  const code = String(country || '').toUpperCase();
  const list = (!code || code === 'ALL') ? mockPlans : mockPlans.filter(p => (p.country || '').toUpperCase() === code);
  // Return cheapest first, capped to 5
  return [...list].sort((a, b) => a.priceMonthly - b.priceMonthly).slice(0, 5);
}

export async function purchase(_body: PurchaseRequest): Promise<PurchaseResponse> {
  await new Promise(r => setTimeout(r, 300));
  return { policyId: 'policy-demo-1', documents: [{ id: 'doc-1', name: 'Policy.pdf' }] };
}

export async function listClaims(): Promise<Claim[]> {
  await new Promise(r => setTimeout(r, 200));
  return [
    { id: 'c-1001', date: '2025-01-10', type: 'GP Visit', amount: 45, status: 'Approved' },
    { id: 'c-1002', date: '2025-02-05', type: 'Physio', amount: 120, status: 'Processing' },
    { id: 'c-1003', date: '2025-03-12', type: 'ER Visit', amount: 300, status: 'Rejected' },
  ];
}

export async function dashboard(): Promise<UserDashboard> {
  await new Promise(r => setTimeout(r, 200));
  const benefits: BenefitUsage[] = [
    { key: 'gp', label: 'GP Visits', used: 1, total: 6 },
    { key: 'physio', label: 'Physio Sessions', used: 2, total: 8 },
    { key: 'scan', label: 'Scans', used: 0, total: 3 },
  ];
  return { benefits };
}
