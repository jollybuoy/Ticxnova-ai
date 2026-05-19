import { supabase } from '../supabase';
import {
  formatKbContextForPrompt,
  getKbSourceSummaries,
  searchKbArticles,
} from './kbRetrieval';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function listKbCategories(tenantId) {
  const { data, error } = await supabase
    .from('kb_categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');

  return { data: data ?? [], error };
}

export async function createKbCategory(tenantId, { name, description }) {
  const slug = slugify(name);
  const { data, error } = await supabase
    .from('kb_categories')
    .insert({ tenant_id: tenantId, name, slug, description })
    .select()
    .single();

  return { data, error };
}

export async function listKbArticles(tenantId, { status, categoryId, search } = {}) {
  let query = supabase
    .from('kb_articles')
    .select('*, kb_categories(id, name, slug)')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (search?.trim()) {
    query = query.ilike('title', `%${search.trim()}%`);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function getKbArticle(tenantId, articleId) {
  const { data, error } = await supabase
    .from('kb_articles')
    .select('*, kb_categories(id, name, slug)')
    .eq('tenant_id', tenantId)
    .eq('id', articleId)
    .maybeSingle();

  return { data, error };
}

export async function createKbArticle(tenantId, authorId, payload) {
  const slug = slugify(payload.slug || payload.title);
  const { data, error } = await supabase
    .from('kb_articles')
    .insert({
      tenant_id: tenantId,
      author_id: authorId,
      category_id: payload.category_id || null,
      title: payload.title,
      slug,
      content: payload.content ?? '',
      status: payload.status ?? 'draft',
    })
    .select('*, kb_categories(id, name, slug)')
    .single();

  return { data, error };
}

export async function updateKbArticle(tenantId, articleId, payload) {
  const updates = {
    ...payload,
    updated_at: new Date().toISOString(),
  };
  if (payload.title && !payload.slug) {
    updates.slug = slugify(payload.title);
  }

  const { data, error } = await supabase
    .from('kb_articles')
    .update(updates)
    .eq('tenant_id', tenantId)
    .eq('id', articleId)
    .select('*, kb_categories(id, name, slug)')
    .single();

  return { data, error };
}

/**
 * Client-side KB search (tenant-scoped). Primary AI retrieval runs in the ai-assistant edge function.
 * @param {string} tenantId
 * @param {string} query
 */
export async function searchKbArticlesForTenant(tenantId, query, options = {}) {
  const { data, error } = await listKbArticles(tenantId, { status: 'published' });
  if (error) return { matches: [], sources: [], context: '', error };

  const matches = searchKbArticles(data, query, options);
  return {
    matches,
    sources: getKbSourceSummaries(matches),
    context: formatKbContextForPrompt(matches),
    error: null,
  };
}

export async function deleteKbArticle(tenantId, articleId) {
  const { error } = await supabase
    .from('kb_articles')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', articleId);

  return { error };
}
