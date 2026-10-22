/** Featured header pills and footer category links share one slug resolver. */
export const FEATURED_NAV = [
  {
    id: 'casters',
    slugs: ['caster-wheels', 'wheels'],
    bn: 'কাস্টার হুইল',
    en: 'Caster Wheels',
  },
  {
    id: 'handles',
    slugs: ['handle-locks'],
    bn: 'হ্যান্ডেল লক',
    en: 'Handle Locks',
  },
  {
    id: 'cabinet',
    slugs: ['cabinet-handles', 'handles'],
    bn: 'কেবিনেট ফিটিংস',
    en: 'Cabinet Fittings',
  },
]

export const FOOTER_CATEGORIES = [
  {
    id: 'casters',
    slugs: ['caster-wheels', 'wheels'],
    bn: 'কাস্টার হুইল',
    en: 'Caster Wheels',
    noteBn: 'Heavy / Medium / Light',
    noteEn: 'Heavy / Medium / Light',
  },
  {
    id: 'locks',
    slugs: ['handle-locks', 'cabinet-handles'],
    bn: 'হ্যান্ডেল ও ক্যাবিনেট লক',
    en: 'Handle & Cabinet Locks',
  },
  {
    id: 'doors',
    slugs: ['door-locks', 'round-locks', 'handles'],
    bn: 'ডোর হার্ডওয়্যার',
    en: 'Door Hardware',
  },
]

export function resolveCategorySlug(categories, slugs) {
  const list = Array.isArray(categories) ? categories : []
  for (const slug of slugs) {
    if (list.some((item) => item.slug === slug)) return slug
  }
  const token = String(slugs[0] || '').split('-')[0]
  if (token) {
    const fuzzy = list.find((item) => String(item.slug || '').toLowerCase().includes(token))
    if (fuzzy?.slug) return fuzzy.slug
  }
  return slugs[0] || ''
}

export function categoryHref(categories, slugs) {
  const slug = resolveCategorySlug(categories, slugs)
  return slug ? `/category/${encodeURIComponent(slug)}` : '/'
}
