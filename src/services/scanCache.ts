import { supabase } from '../supabase';

export interface CachedScan {
  id: string;
  timestamp: number;
  mode: 'label' | 'menu' | 'winelist';
  previewUrl: string;
  result: any;
  barcode?: string;
}

function mapRemoteScan(row: any): CachedScan {
  return {
    id: row.id,
    timestamp: Number(row.timestamp),
    mode: row.mode as 'label' | 'menu' | 'winelist',
    previewUrl: row.preview_url,
    result: row.result,
    barcode: row.barcode || undefined
  };
}

export async function saveScanToCache(scan: Omit<CachedScan, 'id'>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Authenticated user required to persist scan history.');
  }

  const { data, error } = await supabase.from('scans').insert({
    user_id: user.id,
    timestamp: scan.timestamp,
    mode: scan.mode,
    preview_url: scan.previewUrl,
    result: scan.result,
    barcode: scan.barcode || null
  }).select().single();

  if (error) throw error;
  return data.id;
}

export async function getScanHistory(): Promise<CachedScan[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapRemoteScan);
}

export async function clearScanHistory(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('scans')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;
}
