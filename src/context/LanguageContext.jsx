import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const translations = {
  bn: {
    shopName: 'ইউসুফ এন্টারপ্রাইজ',
    tagline: 'প্রিমিয়াম হুইল, লক এবং হ্যান্ডেল — পাইকারি সমাধান',
    location: 'ইউসুফ এন্টারপ্রাইজ — কারওয়ান বাজার, ঢাকা',
    categories: 'প্রোডাক্ট ক্যাটাগরি সমূহ',
    viewProducts: 'পণ্য দেখুন →',
    home: 'হোমপেজ',
    allCategories: '← সব ক্যাটাগরি',
    price: 'মূল্য',
    perPiece: '/ পিস',
    selectSize: 'সাইজ নির্বাচন করুন:',
    wholesaleRate: 'পাইকারি দর:',
    quantity: 'পরিমাণ (পিস):',
    addToCart: 'কার্টে যোগ করুন',
    noProducts: 'এই ক্যাটাগরিতে এখনো কোনো প্রোডাক্ট যুক্ত করা হয়নি।',
    loading: 'লোড হচ্ছে...',
    login: 'লগইন',
    signup: 'রেজিস্টার'
  },
  en: {
    shopName: 'Yousuf Enterprise',
    tagline: 'Premium Wheels, Locks & Handles — Wholesale Solutions',
    location: 'Yousuf Enterprise — Karwan Bazar, Dhaka',
    categories: 'Product Categories',
    viewProducts: 'View Products →',
    home: 'Home',
    allCategories: '← All Categories',
    price: 'Price',
    perPiece: '/ pc',
    selectSize: 'Select Size:',
    wholesaleRate: 'Wholesale Rate:',
    quantity: 'Quantity (pcs):',
    addToCart: 'Add to Cart',
    noProducts: 'No products added to this category yet.',
    loading: 'Loading...',
    login: 'Login',
    signup: 'Sign Up'
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'bn');

  const toggleLanguage = () => {
    const nextLang = lang === 'bn' ? 'en' : 'bn';
    setLang(nextLang);
    localStorage.setItem('app_lang', nextLang);
  };

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);