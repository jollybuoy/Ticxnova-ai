import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PlanGate } from '../components/billing/PlanGate';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { Textarea } from '../components/ui/Textarea';
import { FEATURES } from '../lib/plans/planConfig';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../hooks/useTenant';
import {
  createKbArticle,
  createKbCategory,
  deleteKbArticle,
  listKbArticles,
  listKbCategories,
  updateKbArticle,
} from '../lib/kb/kbService';

const emptyArticle = {
  title: '',
  content: '',
  status: 'draft',
  category_id: '',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const ARTICLE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export default function KnowledgeBase() {
  const { user } = useAuth();
  const { tenantId, loading: tenantLoading } = useTenant();
  const { canManageModule, modules } = usePermissions();
  const canEdit = canManageModule(modules.KB);

  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [form, setForm] = useState(emptyArticle);
  const [editingId, setEditingId] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [catRes, artRes] = await Promise.all([
      listKbCategories(tenantId),
      listKbArticles(tenantId, { status: statusFilter || undefined, search }),
    ]);
    setLoading(false);
    if (catRes.error || artRes.error) {
      toast.error('Failed to load knowledge base');
      return;
    }
    setCategories(catRes.data);
    setArticles(artRes.data);
  }, [tenantId, statusFilter, search]);

  useEffect(() => {
    const task = window.setTimeout(load, 0);
    return () => window.clearTimeout(task);
  }, [load]);

  const filteredArticles = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase();
    return articles.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.content?.toLowerCase().includes(q),
    );
  }, [articles, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyArticle);
    setEditorOpen(true);
  };

  const openEdit = (article) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      content: article.content,
      status: article.status,
      category_id: article.category_id ?? '',
    });
    setEditorOpen(true);
  };

  const saveArticle = async () => {
    if (!tenantId || !form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      category_id: form.category_id || null,
    };
    const result = editingId
      ? await updateKbArticle(tenantId, editingId, payload)
      : await createKbArticle(tenantId, user?.id, payload);
    setSaving(false);
    if (result.error) {
      toast.error('Could not save article');
      return;
    }
    toast.success(editingId ? 'Article updated' : 'Article created');
    setEditorOpen(false);
    load();
  };

  const removeArticle = async (articleId) => {
    if (!tenantId || !window.confirm('Delete this article?')) return;
    const { error } = await deleteKbArticle(tenantId, articleId);
    if (error) {
      toast.error('Could not delete article');
      return;
    }
    toast.success('Article deleted');
    load();
  };

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'Uncategorized' },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories],
  );

  if (tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  const saveCategory = async () => {
    if (!tenantId || !categoryName.trim()) return;
    setSaving(true);
    const { error } = await createKbCategory(tenantId, { name: categoryName });
    setSaving(false);
    if (error) {
      toast.error('Could not create category');
      return;
    }
    toast.success('Category created');
    setCategoryName('');
    setCategoryOpen(false);
    load();
  };

  return (
    <DashboardLayout>
      <PlanGate
        feature={FEATURES.KNOWLEDGE_BASE}
        title="Knowledge base"
        description="Organize runbooks and IT documentation on the Professional plan or above."
      >
        <div className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">
                Knowledge base
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Articles & runbooks</h1>
              <p className="mt-2 max-w-xl text-sm text-zinc-400">
                Tenant-isolated documentation ready for future AI search.
              </p>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setCategoryOpen(true)}>
                  Add category
                </Button>
                <Button onClick={openCreate}>
                  <Plus size={16} className="mr-2" />
                  New article
                </Button>
              </div>
            )}
          </div>

          <div className="glass-card flex flex-wrap gap-3 p-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <Input
                className="pl-9"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
              options={STATUS_OPTIONS}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="glass-card flex flex-col items-center py-20 text-center">
              <BookOpen className="text-violet-400" size={40} />
              <h2 className="mt-4 text-lg font-medium text-white">No articles yet</h2>
              <p className="mt-2 max-w-sm text-sm text-zinc-400">
                Create your first runbook or IT guide for your team.
              </p>
              {canEdit && (
                <Button className="mt-6" onClick={openCreate}>
                  Create article
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  className="glass-card group cursor-pointer p-5 transition hover:border-violet-500/30"
                  onClick={() => canEdit && openEdit(article)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        article.status === 'published'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-zinc-500/15 text-zinc-400'
                      }`}
                    >
                      {article.status}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        className="text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeArticle(article.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-white">{article.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-zinc-400">
                    {article.content?.replace(/<[^>]+>/g, '').slice(0, 160) || 'No content'}
                  </p>
                  <p className="mt-4 text-xs text-zinc-500">
                    {article.kb_categories?.name ?? 'Uncategorized'} ·{' '}
                    {new Date(article.updated_at).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={editingId ? 'Edit article' : 'New article'}>
          <div className="space-y-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Select
              label="Category"
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              options={categoryOptions}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              options={ARTICLE_STATUS_OPTIONS}
            />
            <Textarea
              label="Content"
              rows={10}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Markdown or plain text — AI search integration ready"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveArticle} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal open={categoryOpen} onClose={() => setCategoryOpen(false)} title="New category">
          <Input
            label="Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCategory} disabled={saving}>
              Create
            </Button>
          </div>
        </Modal>
      </PlanGate>
    </DashboardLayout>
  );
}
