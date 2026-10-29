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
export const resolvedSupabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

export const isSupabaseConfigured = Boolean(
  (getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY')) &&
  !resolvedSupabaseAnonKey.includes('dummy')
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
    const res = await fetch(`${SUPABASE_REST_URL}`, {
      method: 'GET',
      headers: {
        'apikey': resolvedSupabaseAnonKey,
        'Authorization': `Bearer ${resolvedSupabaseAnonKey}`
      }
    });

    // A 200 or 401 or OpenAPI schema return confirms the Supabase project server is alive
    if (res.status === 200 || res.status === 401 || res.status === 404) {
      return {
        connected: true,
        status: res.status,
        message: res.status === 200 
          ? 'Connected to Supabase REST API successfully'
          : `Supabase instance live at ${SUPABASE_PROJECT_ID} (HTTP ${res.status}: Ready for anon key / tables)`,
        projectId: SUPABASE_PROJECT_ID,
        endpoint: SUPABASE_REST_URL
      };
    }

    return {
      connected: false,
      status: res.status,
      message: `Supabase returned HTTP ${res.status}`,
      projectId: SUPABASE_PROJECT_ID,
      endpoint: SUPABASE_REST_URL
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 0,
      message: err.message || 'Network error pinging Supabase endpoint',
      projectId: SUPABASE_PROJECT_ID,
      endpoint: SUPABASE_REST_URL
    };
  }
}
