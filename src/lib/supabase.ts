/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_PROJECT_ID = 'kwzqkpeeaqxlpymrohkt';
export const SUPABASE_URL = 'https://kwzqkpeeaqxlpymrohkt.supabase.co';
export const SUPABASE_REST_URL = 'https://kwzqkpeeaqxlpymrohkt.supabase.co/rest/v1/';

// Safe resolution of environment variables for Vite client & Node server contexts
const getEnvVar = (key: string, fallback = ''): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] || fallback;
  }
  return fallback;
};

export const resolvedSupabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL') || SUPABASE_URL;
export const resolvedSupabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY') || 'sb_publishable_iMij_v8OKiT7XXIfT2xj0A_Q08cp9i7';

export const isSupabaseConfigured = Boolean(
  resolvedSupabaseAnonKey && !resolvedSupabaseAnonKey.includes('dummy')
);

// Create Supabase Client instance
export const supabase: SupabaseClient = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Health check / verification for the Supabase REST endpoint
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  status: number;
  message: string;
  projectId: string;
  endpoint: string;
}> {
  try {
    const { error, status } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST205') {
      return {
        connected: false,
        status: status || 400,
        message: error.message || 'Supabase error',
        projectId: SUPABASE_PROJECT_ID,
        endpoint: SUPABASE_REST_URL
      };
    }

    return {
      connected: true,
      status: 200,
      message: error?.code === 'PGRST205'
        ? 'Supabase backend connected (Table awaiting setup in SQL editor)'
        : 'Supabase backend connected & synchronized',
      projectId: SUPABASE_PROJECT_ID,
      endpoint: SUPABASE_REST_URL
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 0,
      message: err.message || 'Unable to connect to Supabase endpoint',
      projectId: SUPABASE_PROJECT_ID,
      endpoint: SUPABASE_REST_URL
    };
  }
}
