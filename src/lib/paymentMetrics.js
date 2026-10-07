import { isPaymentVerified } from './paymentConfig'

export const PAYMENT_RANGES = ['today', 'week', 'month', 'all']

function methodKey(method) {
  return String(method || 'cod').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

export function isCashMethod(method) {
  const key = methodKey(method)
  return key === 'cod' || key === 'cash' || key === 'offline' || key === 'cash_offline' || key === 'cash_offline_memo'
}

export function isBkashMethod(method) {
  return methodKey(method) === 'bkash'
}

export function isBankMethod(method) {
  const key = methodKey(method)
  return key === 'bank' || key === 'bank_transfer'
}

export function rangeStart(range, now = new Date()) {
  if (range === 'all') return null
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  if (range === 'week') {
    const mondayOffset = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - mondayOffset)
  } else if (range === 'month') {
    start.setDate(1)
  }
  return start
}

export function inPaymentRange(createdAt, range, now = new Date()) {
  const start = rangeStart(range, now)
  if (!start) return true
  const time = new Date(createdAt || 0).getTime()
  return time >= start.getTime() && time <= now.getTime()
}

function isActiveOrder(order) {
  const status = String(order?.status || '').toLowerCase()
  return status !== 'cancelled' && status !== 'failed'
}

function emptyBucket() {
  return { amount: 0, count: 0 }
}

export function summarizePayments(orders, range, now = new Date()) {
  const stats = {
    cash: emptyBucket(),
    bkash: emptyBucket(),
    bank: emptyBucket(),
    due: emptyBucket(),
    net: emptyBucket(),
  }

  ;(orders || []).forEach((order) => {
    if (!isActiveOrder(order) || !inPaymentRange(order.created_at, range, now)) return
    const amount = Number(order.total_amount) || 0
    const verified = isPaymentVerified(order.payment_status)
    if (verified && isCashMethod(order.payment_method)) {
      stats.cash.amount += amount
      stats.cash.count += 1
    } else if (verified && isBkashMethod(order.payment_method)) {
      stats.bkash.amount += amount
      stats.bkash.count += 1
    } else if (verified && isBankMethod(order.payment_method)) {
      stats.bank.amount += amount
      stats.bank.count += 1
    } else if (!verified) {
      stats.due.amount += amount
      stats.due.count += 1
      return
    } else {
      return
    }
    stats.net.amount += amount
    stats.net.count += 1
  })

  return stats
}
