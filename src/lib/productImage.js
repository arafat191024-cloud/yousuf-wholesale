import { supabase } from './supabaseClient'

const MAX_EDGE = 800
const TARGET_BYTES = 300 * 1024
const MAX_BYTES = 500 * 1024
const START_QUALITY = 0.82
const BUCKETS = ['products', 'product-images']

function fail(code) {
  const error = new Error(code)
  error.code = code
  return error
}

export function imageFileFromList(list) {
  return [...(list || [])].find((file) => isImageFile(file)) || null
}

function isHeic(file) {
  const type = String(file?.type || '').toLowerCase()
  return type === 'image/heic' || type === 'image/heif' || /\.hei[cf]$/i.test(file?.name || '')
}

function isImageFile(file) {
  const type = String(file?.type || '').toLowerCase()
  return type.startsWith('image/') || isHeic(file)
}

export function isInlineImageUrl(value) {
  return /^data:/i.test(String(value || '').trim())
}

export function cleanFileName(name) {
  const base = String(name || 'image').replace(/\.[^.]+$/, '')
  const cleaned = base
    .replace(/[^\w-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)
  return cleaned || 'image'
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(fail('DECODE'))
    image.src = src
  })
}

async function decodeHeic(file) {
  try {
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    return Array.isArray(converted) ? converted[0] : converted
  } catch {
    throw fail('HEIC')
  }
}

async function decodeBitmap(blob) {
  if (typeof createImageBitmap !== 'function') return null
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' })
  } catch {
    try {
      return await createImageBitmap(blob)
    } catch {
      return null
    }
  }
}

async function decodeFile(file) {
  const blob = isHeic(file) ? await decodeHeic(file) : file
  const bitmap = await decodeBitmap(blob)
  if (bitmap) return bitmap
  const url = URL.createObjectURL(blob)
  try {
    return await loadImage(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function sourceSize(source) {
  return {
    width: source.naturalWidth || source.width || 0,
    height: source.naturalHeight || source.height || 0,
  }
}

function fittedSize(width, height, edge) {
  const scale = Math.min(1, edge / width, edge / height)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function squareCanvas(source, width, height) {
  const side = Math.max(width, height)
  let canvas
  let ctx
  if (typeof OffscreenCanvas === 'function') {
    try {
      canvas = new OffscreenCanvas(side, side)
      ctx = canvas.getContext('2d', { alpha: false })
    } catch {
      canvas = null
      ctx = null
    }
  }
  if (!ctx) {
    canvas = document.createElement('canvas')
    canvas.width = side
    canvas.height = side
    ctx = canvas.getContext('2d', { alpha: false })
  }
  if (!ctx) throw fail('DECODE')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, side, side)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, Math.round((side - width) / 2), Math.round((side - height) / 2), width, height)
  return canvas
}

function canvasToBlob(canvas, quality) {
  if (typeof canvas.convertToBlob === 'function') {
    return canvas.convertToBlob({ type: 'image/webp', quality })
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(fail('WEBP'))
    }, 'image/webp', quality)
  })
}

function releaseCanvas(canvas) {
  try {
    canvas.width = 1
    canvas.height = 1
  } catch {
    /* A transferred canvas cannot be resized. */
  }
}

async function encodeSquare(source, naturalW, naturalH, edge, quality) {
  const fitted = fittedSize(naturalW, naturalH, edge)
  const canvas = squareCanvas(source, fitted.width, fitted.height)
  try {
    const blob = await canvasToBlob(canvas, quality)
    if (!blob) throw fail('WEBP')
    return blob
  } finally {
    releaseCanvas(canvas)
  }
}

function remember(best, blob) {
  if (!blob) return best
  if (!best || blob.size < best.size) return blob
  return best
}

export async function compressProductImage(file, onProgress) {
  const report = (percent) => {
    if (typeof onProgress === 'function') onProgress(Math.max(0, Math.min(100, Math.round(percent))))
  }
  report(12)
  const source = await decodeFile(file)
  try {
    const { width: naturalW, height: naturalH } = sourceSize(source)
    if (!naturalW || !naturalH) throw fail('DECODE')
    report(40)

    // 0.82 is the catalog default. Step down only while the file is over the 300KB target.
    const qualities = [START_QUALITY, 0.76, 0.7, 0.64]
    let best = null
    for (let attempt = 0; attempt < qualities.length; attempt += 1) {
      const blob = await encodeSquare(source, naturalW, naturalH, MAX_EDGE, qualities[attempt])
      best = remember(best, blob)
      report(48 + attempt * 6)
      if (blob.size <= TARGET_BYTES) break
    }

    if (!best || best.size >= MAX_BYTES) {
      const edges = [680, 560, 480]
      for (let attempt = 0; attempt < edges.length; attempt += 1) {
        const blob = await encodeSquare(source, naturalW, naturalH, edges[attempt], 0.72)
        best = remember(best, blob)
        report(74 + attempt * 4)
        if (blob.size < MAX_BYTES) break
      }
    }

    if (!best || best.size >= MAX_BYTES) throw fail('TOO_LARGE')
    if (best.type && best.type !== 'image/webp') throw fail('WEBP')
    report(88)
    return new File([best], `${cleanFileName(file.name)}.webp`, { type: 'image/webp' })
  } finally {
    source.close?.()
  }
}

export async function uploadProductImage(file, onProgress) {
  if (!isImageFile(file)) throw fail('NOT_IMAGE')
  const report = (percent) => {
    if (typeof onProgress === 'function') onProgress(percent)
  }
  const webp = await compressProductImage(file, onProgress)
  const path = `products/${Date.now()}-${cleanFileName(file.name)}.webp`
  report(94)
  let uploadedBucket = ''
  for (const bucket of BUCKETS) {
    const { error } = await supabase.storage.from(bucket).upload(path, webp, {
      cacheControl: '31536000',
      upsert: false,
      contentType: 'image/webp',
    })
    if (!error) {
      uploadedBucket = bucket
      break
    }
    console.error(error)
  }
  if (!uploadedBucket) throw fail('STORAGE')
  const { data } = supabase.storage.from(uploadedBucket).getPublicUrl(path)
  const url = data?.publicUrl || ''
  if (!url.startsWith('http') || isInlineImageUrl(url)) throw fail('STORAGE')
  report(100)
  return { url, bytes: webp.size, path }
}
