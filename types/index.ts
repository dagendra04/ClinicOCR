import type { Patient, Prescription, Medicine } from '@/db/schema';

export type { Patient, Prescription, Medicine };

export interface PatientWithPrescriptionCount extends Patient {
  prescriptionCount: number;
}

export interface PrescriptionWithPatient extends Prescription {
  patient: Patient;
}

export type OcrStatus =
  | 'idle'
  | 'quality-check'
  | 'preprocessing'
  | 'ocr'
  | 'ai'
  | 'done'
  | 'error';

export interface ProcessingState {
  status:   OcrStatus;
  message:  string;
  progress: number; // 0–100
}

export type OcrQualityLabel = 'Excellent' | 'Good' | 'Needs Review';

export interface SearchFilters {
  query?:        string;
  medicineName?: string;
  dateFrom?:     string;
  dateTo?:       string;
}
