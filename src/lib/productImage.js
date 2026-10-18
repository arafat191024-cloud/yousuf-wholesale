import { supabase } from './supabaseClient'

const BUCKETS = ['products', 'product-images']
const MAX_DATA_URL_BYTES = 1_200_000

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

export function imageFileFromList(list) {
  return [...(list || [])].find((file) => String(file?.type || '').startsWith('image/')) || null
}

export async function uploadProductImage(file) {
  if (!file || !String(file.type || '').startsWith('image/')) {
    const error = new Error('NOT_IMAGE')
    error.code = 'NOT_IMAGE'
    throw error
  }

  const safeName = String(file.name || 'image.jpg').replace(/\s+/g, '_')
  const path = `product-${Date.now()}-${safeName}`

  for (const bucket of BUCKETS) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    })
    if (error) continue
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    if (data?.publicUrl) return { url: data.publicUrl, fallback: false }
  }

  if (file.size > MAX_DATA_URL_BYTES) {
    const error = new Error('TOO_LARGE')
    error.code = 'TOO_LARGE'
    throw error
  }

  const url = await readAsDataUrl(file)
  if (!url.startsWith('data:image/')) {
    const error = new Error('READ_FAILED')
    error.code = 'READ_FAILED'
    throw error
  }
  return { url, fallback: true }
}
