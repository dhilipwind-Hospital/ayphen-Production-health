export const INSURANCE_USE_MOCK = false;

// Optional: future-proof for env override
export const INSURANCE_API_BASE = (window as any)?.ENV?.REACT_APP_API_URL || process.env.REACT_APP_API_URL || '/api';
