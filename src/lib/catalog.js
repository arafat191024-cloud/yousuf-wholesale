export const categoryMeta = {
  wheels: {
    titleEn: 'Wheels & Castors',
    titleBn: 'চাকা ও হুইল',
    descEn: 'Heavy wheels for smooth movement',
    descBn: 'মসৃণ চলাচলের জন্য মজবুত হুইল',
    image: '/wheels.png',
    icon: 'wheel',
  },
  'door-locks': {
    titleEn: 'Door Locks',
    titleBn: 'ডোর লক ও তালা',
    descEn: 'Brass padlocks and rim locks',
    descBn: 'বাসা ও দোকানের নিরাপদ তালা',
    image: 'https://images.pexels.com/photos/279810/pexels-photo-279810.jpeg?auto=compress&cs=tinysrgb&w=600',
    icon: 'lock',
  },
  'handle-locks': {
    titleEn: 'Handle Locks',
    titleBn: 'হ্যান্ডেল লক',
    descEn: 'Modern mortise handle lock sets',
    descBn: 'আধুনিক হ্যান্ডেল লক সেট',
    image: 'https://images.pexels.com/photos/5691544/pexels-photo-5691544.jpeg?auto=compress&cs=tinysrgb&w=600',
    icon: 'handle',
  },
  handles: {
    titleEn: 'Door & Cabinet Handles',
    titleBn: 'ডোর ও ক্যাবিনেট হ্যান্ডেল',
    descEn: 'Metal pull handles for doors',
    descBn: 'দরজা ও ক্যাবিনেটের পুল হ্যান্ডেল',
    image: 'https://images.pexels.com/photos/7174391/pexels-photo-7174391.jpeg?auto=compress&cs=tinysrgb&w=600',
    icon: 'pull',
  },
}

export function categoryCopy(category, lang) {
  const meta = categoryMeta[category?.slug] || {
    titleEn: category?.name || '',
    titleBn: category?.name || '',
    descEn: 'Wholesale hardware',
    descBn: 'পাইকারি হার্ডওয়্যার',
    image: '/wheels.png',
    icon: 'box',
  }
  return {
    title: lang === 'bn' ? meta.titleBn : meta.titleEn,
    description: lang === 'bn' ? meta.descBn : meta.descEn,
    image: meta.image,
    icon: meta.icon,
  }
}

export function fallbackImage(slug) {
  return categoryMeta[slug]?.image || '/wheels.png'
}
