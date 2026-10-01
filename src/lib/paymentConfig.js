/**
 * Merchant payment instructions shown at checkout.
 * bKash uses the published Yousuf Enterprise mobile number.
 * Replace bank fields with the live account before taking transfers.
 */
export const PAYMENT_ACCOUNTS = {
  bkash: {
    type: 'Personal',
    number: '01590089369',
    name: 'Yousuf Enterprise',
  },
  nagad: {
    type: 'Personal',
    number: '01590089369',
    name: 'Yousuf Enterprise',
  },
  bank: {
    bankName: 'Bank transfer',
    accountName: 'Yousuf Enterprise',
    accountNumber: '',
    branch: 'Karwan Bazar, Dhaka',
    confirmPhone: '01590089369',
    altPhone: '01977222126',
  },
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
    cod: { bn: 'ক্যাশ অন ডেলিভারি', en: 'Cash on Delivery' },
    bkash: { bn: 'বিকাশ', en: 'bKash' },
    nagad: { bn: 'নগদ', en: 'Nagad' },
    bank: { bn: 'ব্যাংক ট্রান্সফার', en: 'Bank Transfer' },
  }
  return labels[method]?.[lang] || method || (lang === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery')
}
