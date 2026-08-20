'use server';

import { db } from '@/db';
import { patients } from '@/db/schema';
import { eq, ilike, or, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { NewPatient } from '@/db/schema';

const patientSchema = z.object({
  name:   z.string().min(2, 'Name must be at least 2 characters'),
  age:    z.coerce.number().min(0).max(150).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  phone:  z.string().optional(),
});

export async function getPatients(search?: string) {
  if (search) {
    return db
      .select()
      .from(patients)
      .where(
        or(
          ilike(patients.name,  `%${search}%`),
          ilike(patients.phone, `%${search}%`),
        )
      )
      .orderBy(desc(patients.createdAt));
  }

  return db
    .select()
    .from(patients)
    .orderBy(desc(patients.createdAt));
}

export async function getPatientById(id: string) {
  const result = await db
    .select()
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function createPatient(formData: FormData) {
  const raw = {
    name:   formData.get('name') as string,
    age:    formData.get('age')  as string,
    gender: formData.get('gender') as string,
    phone:  formData.get('phone')  as string,
  };

  const parsed = patientSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const newPatient: NewPatient = {
    name:   parsed.data.name,
    age:    parsed.data.age,
    gender: parsed.data.gender,
    phone:  parsed.data.phone || null,
  };

  try {
    const [created] = await db.insert(patients).values(newPatient).returning();
    revalidatePath('/patients');
    return { success: true, data: created };
  } catch {
    return { success: false, error: 'Failed to create patient' };
  }
}

export async function updatePatient(id: string, formData: FormData) {
  const raw = {
    name:   formData.get('name') as string,
    age:    formData.get('age')  as string,
    gender: formData.get('gender') as string,
    phone:  formData.get('phone')  as string,
  };

  const parsed = patientSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  try {
    const [updated] = await db
      .update(patients)
      .set({
        name:   parsed.data.name,
        age:    parsed.data.age,
        gender: parsed.data.gender,
        phone:  parsed.data.phone || null,
      })
      .where(eq(patients.id, id))
      .returning();

    revalidatePath('/patients');
    revalidatePath(`/patients/${id}`);
    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Failed to update patient' };
  }
}

export async function deletePatient(id: string) {
  try {
    await db.delete(patients).where(eq(patients.id, id));
    revalidatePath('/patients');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete patient' };
  }
}
