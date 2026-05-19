/**
 * KB retrieval for edge runtime (keep in sync with src/lib/kb/kbRetrieval.js).
 * Future: replace searchKbArticles body with embedding / pgvector query.
 */

export const KB_RETRIEVAL_VERSION = 'keyword_v1';

export type KbCategoryRef = { name?: string; slug?: string } | null;

export type KbArticleRow = {
  id: string;
  title: string;
  content: string;
  slug?: string;
  status?: string;
  kb_categories?: KbCategoryRef;
};

export type KbSearchMatch = {
  article: KbArticleRow;
  score: number;
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of',
  'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and',
  'but', 'if', 'or', 'because', 'until', 'while', 'about', 'against', 'i',
  'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its', 'they', 'them', 'their',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'help',
]);

export function tokenizeQuery(query: string): string[] {
  return String(query || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token))
    .slice(0, 24);
}

export function scoreKbArticle(article: KbArticleRow, tokens: string[]): number {
  const title = String(article.title ?? '').toLowerCase();
  const content = String(article.content ?? '').toLowerCase();
  const category = String(article.kb_categories?.name ?? '').toLowerCase();
  const categorySlug = String(article.kb_categories?.slug ?? '').toLowerCase();
  const queryJoined = tokens.join(' ');

  let score = 0;

  if (queryJoined.length >= 4 && title.includes(queryJoined)) {
    score += 12;
  }

  for (const token of tokens) {
    if (title.includes(token)) score += 5;
    if (category.includes(token)) score += 4;
    if (categorySlug.includes(token)) score += 3;
    const contentIndex = content.indexOf(token);
    if (contentIndex >= 0) {
      score += 1;
      if (contentIndex < 200) score += 1;
    }
  }

  return score;
}

export function searchKbArticles(
  articles: KbArticleRow[],
  query: string,
  options: { limit?: number; minScore?: number } = {},
): KbSearchMatch[] {
  const { limit = 5, minScore = 2 } = options;
  const tokens = tokenizeQuery(query);
  if (!tokens.length || !articles.length) return [];

  return articles
    .map((article) => ({
      article,
      score: scoreKbArticle(article, tokens),
    }))
    .filter((row) => row.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function formatKbContextForPrompt(matches: KbSearchMatch[]): string {
  if (!matches.length) return '';

  return matches
    .map(({ article }, index) => {
      const category = article.kb_categories?.name ?? 'Uncategorized';
      const excerpt = String(article.content ?? '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1500);

      return `[KB-${index + 1}] Title: ${article.title}
Category: ${category}
Article ID: ${article.id}
Content:
${excerpt}`;
    })
    .join('\n\n---\n\n');
}

export function getKbSourceSummaries(matches: KbSearchMatch[]) {
  return matches.map(({ article }) => ({
    id: article.id,
    title: article.title,
    category: article.kb_categories?.name ?? null,
  }));
}
