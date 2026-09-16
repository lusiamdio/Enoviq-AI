import { createClient } from '@supabase/supabase-js';
import { createDevSupabaseMock } from './devSupabaseMock';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const enableMockData = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

if ((!supabaseUrl || !supabaseAnonKey) && !enableMockData) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set VITE_ENABLE_MOCK_DATA=true only for local development.');
}

export const supabase = enableMockData
  ? createDevSupabaseMock()
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

export const loginWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const registerWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const isCurrentUserAdmin = async () => {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw error;
  return Boolean(data);
};

export const notifyUser = (type: 'match' | 'event' | 'info', title: string, message: string) => {
  const event = new CustomEvent('enoviq_notification', {
    detail: { type, title, message }
  });
  window.dispatchEvent(event);
};
