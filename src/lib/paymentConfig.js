/**
 * Merchant payment instructions shown at checkout.
 * bKash uses the published Yousuf Enterprise mobile number.
 * Replace bank fields with the live account before taking transfers.
 */
export const SUPPORT = {
  phone: '01590089369',
  phoneAlt: '01977222126',
  whatsapp: '8801590089369',
}

export const PAYMENT_ACCOUNTS = {
  bkash: {
    type: 'Personal',
    number: '01590089369',
    name: 'Yousuf Enterprise',
    nameBn: 'ইউসুফ এন্টারপ্রাইজ',
  },
  nagad: {
    type: 'Personal',
    number: '01590089369',
    name: 'Yousuf Enterprise',
    nameBn: 'ইউসুফ এন্টারপ্রাইজ',
  },
  bank: {
    bankName: 'Bank transfer',
    bankNameBn: 'ব্যাংক স্থানান্তর',
    accountName: 'Yousuf Enterprise',
    accountNameBn: 'ইউসুফ এন্টারপ্রাইজ',
    accountNumber: '',
    branch: 'Karwan Bazar, Dhaka',
    branchBn: 'কারওয়ান বাজার, ঢাকা',
    confirmPhone: '01590089369',
    altPhone: '01977222126',
  },
}

export function accountDisplayName(account, lang = 'bn') {
  if (!account) return ''
  return lang === 'bn' ? (account.nameBn || account.accountNameBn || account.name || account.accountName) : (account.name || account.accountName)
}

export const PREPAID_METHODS = ['bkash', 'nagad', 'bank']

export function needsTransactionId(method) {
  return PREPAID_METHODS.includes(method)
}

export function isPaymentVerified(status) {
  return status === 'verified' || status === 'paid'
}

export function isPaymentFailed(status) {
  return status === 'failed'
}

/** Canonical values: pending | verified | failed. Legacy unpaid/paid still display correctly. */
export function normalizePaymentStatus(status) {
  if (status === 'paid' || status === 'verified') return 'verified'
  if (status === 'failed') return 'failed'
  return 'pending'
}

export function paymentMethodLabel(method, lang = 'bn') {
  const labels = {
    cod: { bn: 'হাতে পেয়ে পরিশোধ', en: 'Cash on Delivery' },
    bkash: { bn: 'বিকাশ', en: 'bKash' },
    nagad: { bn: 'নগদ', en: 'Nagad' },
    bank: { bn: 'ব্যাংক স্থানান্তর', en: 'Bank Transfer' },
  }
  return labels[method]?.[lang] || method || (lang === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery')
}
