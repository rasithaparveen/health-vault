// API utility functions for Health Hub Connect

import type { VitalReading, FamilyMember, User, MedicalReport, DoctorNote, Appointment, Medication, Symptom } from '@/types/health';

const API_BASE_URL = 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiRequest = async <T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || 'API request failed', response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0);
  }
};

export const authAPI = {
  login: (email: string, password: string): Promise<{ token: string; user: User }> =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name: string): Promise<{ token: string; user: User }> =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  getCurrentUser: (): Promise<User> => apiRequest('/auth/me'),

  updateProfile: (updates: Partial<User>): Promise<User> => apiRequest('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
};

export const familyAPI = {
  getMembers: (): Promise<FamilyMember[]> => apiRequest('/family'),
  getMember: (id: string): Promise<FamilyMember> => apiRequest(`/family/${id}`),
  createMember: (member: Omit<FamilyMember, 'id' | 'createdAt' | 'isDefault'>): Promise<FamilyMember> => apiRequest('/family', {
    method: 'POST',
    body: JSON.stringify(member),
  }),
  updateMember: (id: string, updates: Partial<FamilyMember>) => apiRequest(`/family/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteMember: (id: string) => apiRequest(`/family/${id}`, {
    method: 'DELETE',
  }),
};

export const vitalsAPI = {
  getVitals: (memberId: string): Promise<VitalReading[]> => apiRequest(`/vitals/${memberId}`),
  createVital: (vital: Omit<VitalReading, 'id' | 'recordedAt'>) => {
    console.log('vitalsAPI.createVital called with:', vital);
    return apiRequest('/vitals', {
      method: 'POST',
      body: JSON.stringify(vital),
    });
  },
  updateVital: (id: string, updates: Partial<VitalReading>) => apiRequest(`/vitals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteVital: (id: string) => apiRequest(`/vitals/${id}`, {
    method: 'DELETE',
  }),
};

export const reportsAPI = {
  getReports: (memberId: string): Promise<MedicalReport[]> => apiRequest(`/reports/${memberId}`),
  createReport: (report: Omit<MedicalReport, 'id' | 'createdAt'>) => apiRequest('/reports', {
    method: 'POST',
    body: JSON.stringify(report),
  }),
  updateReport: (id: string, updates: Partial<MedicalReport>) => apiRequest(`/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteReport: (id: string) => apiRequest(`/reports/${id}`, {
    method: 'DELETE',
  }),
};

export const appointmentsAPI = {
  getAppointments: (memberId: string): Promise<Appointment[]> => apiRequest(`/appointments/${memberId}`),
  createAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => apiRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointment),
  }),
  updateAppointment: (id: string, updates: Partial<Appointment>) => apiRequest(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteAppointment: (id: string) => apiRequest(`/appointments/${id}`, {
    method: 'DELETE',
  }),
};

export const medicationsAPI = {
  getMedications: (memberId: string): Promise<Medication[]> => apiRequest(`/medications/${memberId}`),
  createMedication: (medication: Omit<Medication, 'id' | 'createdAt'>) => apiRequest('/medications', {
    method: 'POST',
    body: JSON.stringify(medication),
  }),
  updateMedication: (id: string, updates: Partial<Medication>) => apiRequest(`/medications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteMedication: (id: string) => apiRequest(`/medications/${id}`, {
    method: 'DELETE',
  }),
};

export const symptomsAPI = {
  getSymptoms: (memberId: string): Promise<Symptom[]> => apiRequest(`/symptoms/${memberId}`),
  createSymptom: (symptom: Omit<Symptom, 'id' | 'recordedAt'>) => apiRequest('/symptoms', {
    method: 'POST',
    body: JSON.stringify(symptom),
  }),
  updateSymptom: (id: string, updates: Partial<Symptom>) => apiRequest(`/symptoms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteSymptom: (id: string) => apiRequest(`/symptoms/${id}`, {
    method: 'DELETE',
  }),
};

export const doctorNotesAPI = {
  getNotes: (memberId: string): Promise<DoctorNote[]> => apiRequest(`/doctor-notes/${memberId}`),
  createNote: (note: Omit<DoctorNote, 'id' | 'createdAt'>) => apiRequest('/doctor-notes', {
    method: 'POST',
    body: JSON.stringify(note),
  }),
  updateNote: (id: string, updates: Partial<DoctorNote>) => apiRequest(`/doctor-notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteNote: (id: string) => apiRequest(`/doctor-notes/${id}`, {
    method: 'DELETE',
  }),
};

export { ApiError };