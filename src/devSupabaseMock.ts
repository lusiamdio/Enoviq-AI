import type { SupabaseClient } from '@supabase/supabase-js';

const emptyResult = { data: [], error: null };
const okResult = { data: null, error: null };

const createQuery = () => {
  const query: any = {
    select: () => query,
    insert: () => Promise.resolve(okResult),
    update: () => query,
    delete: () => query,
    upsert: () => Promise.resolve(okResult),
    eq: () => query,
    gte: () => query,
    lte: () => query,
    order: () => Promise.resolve(emptyResult),
    limit: () => Promise.resolve(emptyResult),
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => Promise.resolve(emptyResult).then(resolve),
  };
  return query;
};

export const createDevSupabaseMock = () => ({
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
  },
  from: () => createQuery(),
  rpc: async (fn: string) => ({ data: fn === 'is_admin' ? false : fn === 'current_user_kyc_assurance' ? 0 : fn === 'has_approved_kyc' ? false : null, error: null }),
  channel: () => ({
    on: function () { return this; },
    subscribe: function () { return this; },
  }),
  removeChannel: () => undefined,
}) as unknown as SupabaseClient;
