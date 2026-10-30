/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Appointment } from '../types/index.js';

export const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID && !process.env.SUPABASE_PROJECT_ID.includes('your_')
  ? process.env.SUPABASE_PROJECT_ID
  : 'kwzqkpeeaqxlpymrohkt';

export const SUPABASE_URL = process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your_')
  ? process.env.SUPABASE_URL
  : 'https://kwzqkpeeaqxlpymrohkt.supabase.co';

export const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1/`;

function resolveEffectiveKey(): string {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && !serviceKey.includes('your_') && !serviceKey.includes('dummy') && serviceKey.trim().length > 10) {
    return serviceKey.trim();
  }

  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (anonKey && !anonKey.includes('your_') && !anonKey.includes('dummy') && anonKey.trim().length > 10) {
    return anonKey.trim();
  }

  return 'sb_publishable_iMij_v8OKiT7XXIfT2xj0A_Q08cp9i7';
}

export const SUPABASE_ANON_KEY = resolveEffectiveKey();
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_')
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : '';

export const supabaseServer: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export async function pingSupabase(): Promise<{
  connected: boolean;
  status: number;
  message: string;
  projectId: string;
  restUrl: string;
  isKeyConfigured: boolean;
  tableReady: boolean;
}> {
  try {
    const { error, status } = await supabaseServer
      .from('appointments')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205') {
        return {
          connected: true,
          status: 200,
          message: `Supabase instance connected at ${SUPABASE_PROJECT_ID}! Awaiting 'public.appointments' table creation in Supabase SQL Editor.`,
          projectId: SUPABASE_PROJECT_ID,
          restUrl: SUPABASE_REST_URL,
          isKeyConfigured: true,
          tableReady: false
        };
      }
      return {
        connected: false,
        status: status || 400,
        message: error.message || 'Error communicating with Supabase',
        projectId: SUPABASE_PROJECT_ID,
        restUrl: SUPABASE_REST_URL,
        isKeyConfigured: true,
        tableReady: false
      };
    }

    return {
      connected: true,
      status: 200,
      message: `Supabase database connected & 'public.appointments' table verified live!`,
      projectId: SUPABASE_PROJECT_ID,
      restUrl: SUPABASE_REST_URL,
      isKeyConfigured: true,
      tableReady: true
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 0,
      message: err.message || 'Connection error contacting Supabase REST API',
      projectId: SUPABASE_PROJECT_ID,
      restUrl: SUPABASE_REST_URL,
      isKeyConfigured: true,
      tableReady: false
    };
  }
}

/**
 * Attempts to persist or sync an appointment to Supabase
 */
export async function syncAppointmentToSupabase(apt: Appointment): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseServer
      .from('appointments')
      .upsert({
        booking_reference: apt.bookingReference,
        patient_name: apt.patientName,
        patient_phone: apt.patientPhone,
        patient_email: apt.patientEmail,
        doctor_id: apt.doctorId,
        doctor_name: apt.doctorName,
        service_id: apt.serviceId,
        service_name: apt.serviceName,
        appointment_date: apt.appointmentDate,
        appointment_time: apt.appointmentTime,
        status: apt.status,
        fee: apt.fee,
        payment_mode: apt.paymentMode,
        payment_status: apt.paymentStatus,
        payment_id: apt.paymentId || null,
        notes: apt.adminNotes || null,
        created_at: apt.createdAt,
        updated_at: apt.updatedAt
      }, { onConflict: 'booking_reference' });

    if (error) {
      console.warn(`[Supabase Sync Notice] ${apt.bookingReference}: ${error.message}`);
      return { success: false, error: error.message };
    }
    console.log(`[Supabase Sync Success] ${apt.bookingReference} persisted to Supabase database.`);
    return { success: true };
  } catch (err: any) {
    console.warn(`[Supabase Sync Error] ${apt.bookingReference}: ${err.message}`);
    return { success: false, error: err.message };
  }
}
