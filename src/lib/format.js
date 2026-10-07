export function formatTaka(amount, lang = 'bn') {
  const value = Number(amount || 0)
  const formatted = new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
    maximumFractionDigits: 2,
  }).format(value)
  return `৳${formatted}`
}

const STATUS = {
  pending: { bn: 'অপেক্ষমাণ', en: 'Pending' },
  approved: { bn: 'অনুমোদিত', en: 'Approved' },
  confirmed: { bn: 'নিশ্চিত', en: 'Confirmed' },
  processing: { bn: 'প্রস্তুত হচ্ছে', en: 'Processing' },
  shipped: { bn: 'পাঠানো হয়েছে', en: 'Shipped' },
  delivered: { bn: 'পৌঁছেছে', en: 'Delivered' },
  cancelled: { bn: 'বাতিল', en: 'Cancelled' },
}

export function orderStatusLabel(status, lang = 'bn') {
  const key = String(status || '').toLowerCase()
  return STATUS[key]?.[lang] || status || '—'
}
