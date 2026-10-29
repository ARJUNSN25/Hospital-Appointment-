/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Appointment } from '../types/index.js';

export const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'kwzqkpeeaqxlpymrohkt';
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kwzqkpeeaqxlpymrohkt.supabase.co';
export const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1/`;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const effectiveKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

export const supabaseServer: SupabaseClient = createClient(SUPABASE_URL, effectiveKey, {
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
}> {
  const isKeyConfigured = Boolean(
    (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    !effectiveKey.includes('dummy')
  );

  try {
    const res = await fetch(SUPABASE_REST_URL, {
      headers: {
        'apikey': effectiveKey,
        'Authorization': `Bearer ${effectiveKey}`
      }
    });

    return {
      connected: res.status < 500,
      status: res.status,
      message: res.status === 200
        ? 'Supabase REST API connected and operational'
        : `Supabase instance live at ${SUPABASE_PROJECT_ID} (HTTP ${res.status}: Ready for queries)`,
      projectId: SUPABASE_PROJECT_ID,
      restUrl: SUPABASE_REST_URL,
      isKeyConfigured
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 0,
      message: err.message || 'Connection error contacting Supabase REST API',
      projectId: SUPABASE_PROJECT_ID,
      restUrl: SUPABASE_REST_URL,
      isKeyConfigured
    };
  }
}

/**
 * Attempts to persist or sync an appointment to Supabase
 */
export async function syncAppointmentToSupabase(apt: Appointment): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if key is available
    if (effectiveKey.includes('dummy')) {
      return { success: false, error: 'Supabase anon key not set in environment yet' };
    }

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
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
