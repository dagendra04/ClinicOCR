import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  json,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Patients ────────────────────────────────────────────────────────────────

export const patients = pgTable('patients', {
  id:         uuid('id').defaultRandom().primaryKey(),
  name:       text('name').notNull(),
  age:        integer('age'),
  gender:     text('gender'),
  phone:      text('phone'),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
});

// ─── Prescriptions ───────────────────────────────────────────────────────────

export const prescriptions = pgTable('prescriptions', {
  id:             uuid('id').defaultRandom().primaryKey(),
  patientId:      uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  imageUrl:       text('image_url'),
  imageBase64:    text('image_base64'), // stored in DB for simplicity (no storage bucket needed)
  rawOcr:         text('raw_ocr'),
  correctedText:  text('corrected_text'),
  aiSummary:      text('ai_summary'),
  medicinesJson:  json('medicines_json').$type<Medicine[]>().default([]),
  importantFindings: json('important_findings').$type<string[]>().default([]),
  tags:           json('tags').$type<string[]>().default([]),
  doctorNotes:    text('doctor_notes'),
  important:      boolean('important').default(false),
  ocrConfidence:  integer('ocr_confidence'), // 0–100
  createdAt:      timestamp('created_at').defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const patientsRelations = relations(patients, ({ many }) => ({
  prescriptions: many(prescriptions),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
}));

// ─── Types ───────────────────────────────────────────────────────────────────

export type Patient      = typeof patients.$inferSelect;
export type NewPatient   = typeof patients.$inferInsert;
export type Prescription = typeof prescriptions.$inferSelect;
export type NewPrescription = typeof prescriptions.$inferInsert;

export type Medicine = {
  name:      string;
  dosage:    string;
  frequency: string;
};
