import { useEffect } from 'react'
import { supabase } from './supabaseClient'

export const STOCK_EVENT = 'yousuf:stock'

export function aggregateQty(items) {
  const totals = {}
  ;(items || []).forEach((item) => {
    if (!item?.productId) return
    totals[item.productId] = (totals[item.productId] || 0) + (Number(item.quantity) || 0)
  })
  return totals
}

export function trackItems(items) {
  return (items || []).map((item) => ({
    ...item,
    stockTracked: true,
    stockApplied: true,
  }))
}

export function orderHoldsStock(order) {
  if (!order) return false
  const status = String(order.status || '').toLowerCase()
  const payment = String(order.payment_status || '').toLowerCase()
  return status !== 'cancelled' && status !== 'failed' && payment !== 'failed'
}

export function isManagedOrder(order) {
  return (order?.items || []).some((item) => item?.stockTracked || item?.stockApplied)
}

export function stockDelta(previous, next) {
  const before = previous && orderHoldsStock(previous) && isManagedOrder(previous)
    ? aggregateQty(previous.items)
    : {}
  const after = next && orderHoldsStock(next) && isManagedOrder(next)
    ? aggregateQty(next.items)
    : {}
  const delta = {}
  new Set([...Object.keys(before), ...Object.keys(after)]).forEach((id) => {
    const change = (after[id] || 0) - (before[id] || 0)
    if (change) delta[id] = change
  })
  return delta
}

export function isInsufficientStock(error) {
  const message = `${error?.message || ''} ${error?.details || ''}`
  return error?.code === 'INSUFFICIENT_STOCK' || /INSUFFICIENT_STOCK/i.test(message)
}

export function isMissingStockRpc(error) {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`
  return error?.code === 'PGRST202' || /sync_order_stock|schema cache|could not find the function/i.test(message)
}

export function stockWarning(lang, name, available) {
  const qty = Number(available) || 0
  if (lang === 'bn') return `স্টক পর্যাপ্ত নয়। ${name} এখন ${qty} পিস আছে।`
  return `Not enough stock. ${name} has ${qty} pcs left.`
}

export function publishAbsoluteStock(absolute) {
  if (typeof window === 'undefined' || !absolute) return
  window.dispatchEvent(new CustomEvent(STOCK_EVENT, { detail: { absolute } }))
}

export function applyStockEvent(products, detail) {
  if (!Array.isArray(products) || !detail) return products
  if (detail.absolute) {
    return products.map((product) => (
      detail.absolute[product.id] === undefined
        ? product
        : { ...product, stock: detail.absolute[product.id] }
    ))
  }
  const delta = detail.delta || {}
  return products.map((product) => {
    const change = delta[product.id]
    if (!change) return product
    return { ...product, stock: (Number(product.stock) || 0) - change }
  })
}

export function useLiveStock(setProducts) {
  useEffect(() => {
    const onStock = (event) => {
      setProducts((current) => applyStockEvent(current, event.detail))
    }
    window.addEventListener(STOCK_EVENT, onStock)
    return () => window.removeEventListener(STOCK_EVENT, onStock)
  }, [setProducts])
}

export async function assertInStock(items) {
  const totals = aggregateQty(items)
  const ids = Object.keys(totals)
  if (!ids.length) return
  const { data, error } = await supabase.from('products').select('id, name, stock').in('id', ids)
  if (error) throw error
  const rows = data || []
  const missingId = ids.find((id) => !rows.some((row) => row.id === id))
  if (missingId) {
    const err = new Error('INSUFFICIENT_STOCK')
    err.code = 'INSUFFICIENT_STOCK'
    err.productName = missingId
    err.available = 0
    throw err
  }
  const short = rows.find((row) => totals[row.id] > (Number(row.stock) || 0))
  if (short) {
    const err = new Error('INSUFFICIENT_STOCK')
    err.code = 'INSUFFICIENT_STOCK'
    err.productName = short.name
    err.available = Number(short.stock) || 0
    throw err
  }
}

export async function applyClientDelta(delta) {
  const ids = Object.keys(delta || {}).filter((id) => delta[id])
  if (!ids.length) return
  const { data, error } = await supabase.from('products').select('id, stock').in('id', ids)
  if (error) throw error
  const planned = (data || []).map((row) => {
    const change = delta[row.id] || 0
    return {
      id: row.id,
      previous: Number(row.stock) || 0,
      next: (Number(row.stock) || 0) - change,
    }
  })
  if (planned.some((row) => row.next < 0)) {
    const err = new Error('INSUFFICIENT_STOCK')
    err.code = 'INSUFFICIENT_STOCK'
    throw err
  }
  const applied = []
  for (const row of planned) {
    if (row.next === row.previous) continue
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({ stock: row.next })
      .eq('id', row.id)
      .eq('stock', row.previous)
      .select('id')
    if (updateError || !updated?.length) {
      for (const done of applied) {
        await supabase.from('products').update({ stock: done.previous }).eq('id', done.id)
      }
      const err = new Error(updateError?.message || 'INSUFFICIENT_STOCK')
      err.code = 'INSUFFICIENT_STOCK'
      throw err
    }
    applied.push(row)
  }
}

export async function syncOrderStock(orderId, fallback) {
  const { error } = await supabase.rpc('sync_order_stock', { p_order_id: orderId })
  if (!error) return { mode: 'rpc' }
  if (isInsufficientStock(error)) {
    const err = new Error('INSUFFICIENT_STOCK')
    err.code = 'INSUFFICIENT_STOCK'
    throw err
  }
  if (isMissingStockRpc(error)) {
    if (fallback) {
      await fallback()
      return { mode: 'client' }
    }
    return { mode: 'missing' }
  }
  throw error
}

export async function commitManagedStock(orderId, previous, next) {
  const delta = stockDelta(previous, next)
  if (!Object.keys(delta).length) return { mode: 'none', delta }
  const tracked = [...(previous?.items || []), ...(next?.items || [])].some((item) => item?.stockTracked)
  if (tracked) {
    const result = await syncOrderStock(orderId, async () => {
      await applyClientDelta(delta)
    })
    return { ...result, delta }
  }
  await applyClientDelta(delta)
  return { mode: 'client', delta }
}

export async function broadcastStock(ids) {
  const unique = [...new Set((ids || []).filter(Boolean))]
  if (!unique.length) return null
  const { data, error } = await supabase.from('products').select('id, stock').in('id', unique)
  if (error || !data) return null
  const absolute = {}
  data.forEach((row) => {
    absolute[row.id] = Number(row.stock) || 0
  })
  publishAbsoluteStock(absolute)
  return absolute
}
