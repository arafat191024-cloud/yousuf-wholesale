import { supabase } from './supabaseClient'

const OPTIONAL_COLUMNS = ['sender_number', 'delivery_channel', 'transport_note', 'shipping_address']

function without(payload, keys) {
  const next = { ...payload }
  keys.forEach((key) => {
    delete next[key]
  })
  return next
}

export async function insertOrder(payload) {
  let body = { ...payload }
  let last = await supabase.from('orders').insert([body]).select().single()

  for (const column of OPTIONAL_COLUMNS) {
    if (!last.error) break
    const message = `${last.error.message || ''} ${last.error.details || ''}`
    if (!new RegExp(column, 'i').test(message)) continue
    if (column === 'sender_number' && body.sender_number) {
      body = {
        ...without(body, ['sender_number']),
        payment_reference: [body.sender_number, body.payment_reference].filter(Boolean).join(' · ') || null,
      }
    } else if (column === 'shipping_address') {
      body = {
        ...without(body, ['shipping_address']),
        delivery_address: body.shipping_address || body.delivery_address || null,
      }
    } else if (column === 'delivery_channel' || column === 'transport_note') {
      const extra = [body.delivery_channel, body.transport_note].filter(Boolean).join(' · ')
      body = {
        ...without(body, [column]),
        payment_reference: [body.payment_reference, extra].filter(Boolean).join(' · ') || null,
      }
    } else {
      body = without(body, [column])
    }
    last = await supabase.from('orders').insert([body]).select().single()
  }

  return last
}

export async function updateProductRow(id, payload) {
  let body = { ...payload }
  let last = await supabase.from('products').update(body).eq('id', id).select('*, categories(name)').single()
  if (last.error && /series|size/i.test(last.error.message || '')) {
    body = without(body, ['series', 'size'])
    last = await supabase.from('products').update(body).eq('id', id).select('*, categories(name)').single()
  }
  return last
}

export async function insertProductRow(payload) {
  let body = { ...payload }
  let last = await supabase.from('products').insert([body]).select('*, categories(name)').single()
  if (last.error && /series|size/i.test(last.error.message || '')) {
    body = without(body, ['series', 'size'])
    last = await supabase.from('products').insert([body]).select('*, categories(name)').single()
  }
  return last
}
