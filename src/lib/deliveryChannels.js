export const DELIVERY_CHANNELS = [
  { id: 'ajr', bn: 'এ জে আর পার্সেল সার্ভিস', en: 'A.J.R Parcel Service' },
  { id: 'janani', bn: 'জননী এক্সপ্রেস পার্সেল', en: 'Janani Express Parcel' },
  { id: 'sundorban', bn: 'সুন্দরবন কুরিয়ার সার্ভিস', en: 'Sundorban Courier Service' },
  { id: 'bismillah', bn: 'বিসমিল্লাহ কুরিয়ার ও ট্রান্সপোর্ট', en: 'Bismillah Courier & Transport' },
  { id: 'bd-digital', bn: 'বাংলাদেশ ডিজিটাল কুরিয়ার', en: 'Bangladesh Digital Courier' },
  { id: 'royel', bn: 'রয়েল কুরিয়ার সার্ভিস', en: 'Royel Courier Service' },
  { id: '5-star', bn: 'ফাইভ স্টার ট্রান্সপোর্ট', en: '5 Star Transport Agency' },
  { id: '7-star', bn: 'সেভেন স্টার ট্রান্সপোর্ট', en: '7 Star Transport Agency' },
  { id: 'sobuj-bangla', bn: 'সবুজ বাংলা কুরিয়ার / ট্রান্সপোর্ট', en: 'Sobuj Bangla Courier / Transport' },
  { id: 'pickup', bn: 'দোকান থেকে সরাসরি সংগ্রহ', en: 'Store Pickup' },
]

export function deliveryChannelLabel(id, lang = 'bn') {
  const row = DELIVERY_CHANNELS.find((item) => item.id === id)
  if (!row) return id || ''
  return lang === 'en' ? `${row.en} / ${row.bn}` : `${row.bn} (${row.en})`
}

export function formatShippingAddress({ district, upazila, detail }) {
  return [district, upazila, detail].map((part) => String(part || '').trim()).filter(Boolean).join(', ')
}
