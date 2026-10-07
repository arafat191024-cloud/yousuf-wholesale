const SIZE_RE = /(\d+(?:\.\d+)?)\s*(?:["”″]|inch(?:es)?|\bin\b)/i

const SERIES_PATTERNS = [
  [/copper\s*wood/i, 'Copper Wood'],
  [/copper\s*black/i, 'Copper Black'],
  [/cp\s*wood/i, 'CP Wood'],
  [/cp\s*black/i, 'CP Black'],
  [/\bpvc\b/i, 'PVC'],
  [/\bnylon\b/i, 'Nylon'],
  [/\btpr\b/i, 'TPR'],
  [/\bpu\b/i, 'PU'],
]

export function formatSizeLabel(raw) {
  const text = String(raw || '').trim()
  if (!text) return ''
  const match = text.match(/(\d+(?:\.\d+)?)/)
  if (!match) return text
  const number = match[1].replace(/\.0$/, '')
  return `${number}"`
}

export function sizeSortValue(label) {
  const match = String(label || '').match(/(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY
}

export function productSizes(product) {
  const fromVariants = (product?.product_variants || [])
    .map((variant) => formatSizeLabel(variant.size))
    .filter(Boolean)
  if (fromVariants.length) return [...new Set(fromVariants)]
  const match = String(product?.name || '').match(SIZE_RE)
  return match ? [formatSizeLabel(match[1])] : []
}

export function productSeries(product) {
  const explicit = String(product?.series || '').trim()
  if (explicit) return explicit
  const name = `${product?.name || ''} ${product?.description || ''}`
  for (const [pattern, label] of SERIES_PATTERNS) {
    if (pattern.test(name)) return label
  }
  return ''
}

export function collectSizes(products) {
  const set = new Set()
  products.forEach((product) => productSizes(product).forEach((size) => set.add(size)))
  return [...set].sort((a, b) => sizeSortValue(a) - sizeSortValue(b))
}

export function collectSeries(products) {
  const set = new Set()
  products.forEach((product) => {
    const series = productSeries(product)
    if (series) set.add(series)
  })
  return [...set].sort((a, b) => a.localeCompare(b))
}

export function matchesSize(product, size) {
  if (!size || size === 'all') return true
  return productSizes(product).includes(size)
}

export function matchesSeries(product, series) {
  if (!series || series === 'all') return true
  return productSeries(product) === series
}

export function productSearchText(product) {
  return [product?.name, product?.product_code, productSeries(product), ...productSizes(product)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}
