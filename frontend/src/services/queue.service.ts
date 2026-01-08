import api from './api';

export const createVisit = async (patientId: string) => {
  const res = await api.post('/visits', { patientId });
  return (res.data as any)?.data;
};

export const advanceVisit = async (id: string, toStage: 'triage' | 'doctor' | 'billing', doctorId?: string) => {
  const body: any = { toStage };
  if (doctorId) body.doctorId = doctorId;
  const res = await api.post(`/visits/${id}/advance`, body);
  return (res.data as any)?.data;
};

export const getQueue = async (stage: 'reception' | 'triage' | 'doctor' | 'pharmacy' | 'lab' | 'billing', doctorId?: string) => {
  const res = await api.get('/queue', { params: { stage, doctorId } });
  return (res.data as any)?.data || [];
};

export const callNext = async (stage: 'triage' | 'doctor', doctorId?: string) => {
  const res = await api.post('/queue/call-next', {}, { params: { stage, doctorId } });
  return (res.data as any)?.data || null;
};

export const getTriage = async (visitId: string) => {
  const res = await api.get(`/triage/${visitId}`);
  return (res.data as any)?.data || null;
};

export const saveTriage = async (visitId: string, payload: any) => {
  const res = await api.patch(`/triage/${visitId}`, payload);
  return (res.data as any)?.data;
};

export const serveQueueItem = async (id: string) => {
  const res = await api.post(`/queue/${id}/serve`);
  return (res.data as any)?.data;
};

export const skipQueueItem = async (id: string) => {
  const res = await api.post(`/queue/${id}/skip`);
  return (res.data as any)?.data;
};

export const getQueueBoard = async (stage: 'triage' | 'doctor') => {
  const res = await api.get('/queue/board', { params: { stage } });
  return (res.data as any)?.data || [];
};

export const getAvailableDoctors = async () => {
  const res = await api.get('/visits/available-doctors');
  return (res.data as any)?.data || [];
};

export const callQueueItem = async (id: string) => {
  const res = await api.post(`/queue/${id}/call`);
  return (res.data as any)?.data || null;
};
