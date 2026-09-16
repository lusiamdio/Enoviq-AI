import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync('supabase_cupido_schema.sql', 'utf8');

test('schema enables RLS for admin-managed tables', () => {
  assert.match(schema, /alter table public\.support_tickets enable row level security;/);
  assert.match(schema, /alter table public\.promotions enable row level security;/);
});

test('schema grants support and promotion mutations only through admin policies', () => {
  assert.match(schema, /create policy support_tickets_admin_manage on public\.support_tickets/);
  assert.match(schema, /create policy promotions_admin_manage on public\.promotions/);
  assert.match(schema, /public\.is_admin\(\)/);
});


test('schema includes KYC workflow storage and assurance helpers', () => {
  assert.match(schema, /create table if not exists public\.kyc_verifications/);
  assert.match(schema, /create or replace function public\.has_approved_kyc/);
  assert.match(schema, /create policy kyc_admin_review on public\.kyc_verifications/);
  assert.match(schema, /create policy kyc_owner_submit on public\.kyc_verifications/);
});


test('schema defines grape on wishlist for saved wine metadata', () => {
  assert.match(schema, /create table if not exists public\.wishlist \([\s\S]*?grape text,/);
  assert.match(schema, /alter table public\.wishlist add column if not exists grape text;/);
});

test('schema enables connected app access policies for wishlist and public catalog reads', () => {
  assert.match(schema, /create policy wishlist_owner_manage on public\.wishlist/);
  assert.match(schema, /for all using \(auth\.uid\(\) = user_id or public\.is_admin\(\)\)/);
  assert.match(schema, /create policy wines_public_read on public\.wines for select using \(true\);/);
});

test('schema secures Cupido data and prevents client-side membership escalation', () => {
  assert.match(schema, /alter table public\.cupido_profiles enable row level security;/);
  assert.match(schema, /create policy cupido_matches_participant_read on public\.cupido_matches/);
  assert.match(schema, /create policy cupido_messages_sender_insert on public\.cupido_messages/);
  assert.match(schema, /create or replace function public\.protect_cupido_membership\(\)/);
  assert.match(schema, /new\.is_premium := old\.is_premium/);
});

test('schema admin policy block has balanced conditional endings', () => {
  assert.doesNotMatch(schema, /end if;\s*end if;\s*\n\s*if not exists/);
});
