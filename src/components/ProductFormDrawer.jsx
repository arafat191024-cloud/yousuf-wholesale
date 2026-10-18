import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { categoryCopy } from '../lib/catalog'
import { SERIES_OPTIONS, formatSizeLabel, productSeries, productSizes } from '../lib/productMeta'
import { imageFileFromList, uploadProductImage } from '../lib/productImage'
import { useScrollLock } from '../lib/useScrollLock'

const copy = {
  bn: {
    editTitle: 'পণ্য সম্পাদনা',
    addTitle: 'নতুন প্রোডাক্ট যোগ করুন',
    image: 'পণ্যের ছবি',
    imageUrl: 'ছবির লিংক',
    upload: 'ফাইল আপলোড',
    uploading: 'আপলোড হচ্ছে...',
    uploadFailed: 'ছবি আপলোড হয়নি। আবার চেষ্টা করুন।',
    uploadSaved: 'ছবি যোগ হয়েছে',
    uploadFallback: 'স্টোরেজ পাওয়া যায়নি। ছবি সরাসরি সংরক্ষণ করা হয়েছে।',
    uploadLarge: 'ছবি বড়। ছোট ছবি দিন অথবা লিংক ব্যবহার করুন।',
    dropHint: 'টেনে আনুন, পেস্ট করুন (Ctrl+V), অথবা ফাইল বেছে নিন',
    name: 'পণ্যের নাম',
    category: 'ক্যাটাগরি',
    series: 'সিরিজ',
    seriesHint: 'PVC, Nylon, TPR, PU...',
    size: 'সাইজ',
    price: 'পাইকারি রেট',
    stock: 'বর্তমান স্টক',
    code: 'পণ্য কোড',
    description: 'বিবরণ',
    active: 'ওয়েবসাইটে দেখাবে',
    hidden: 'ওয়েবসাইটে লুকানো',
    save: 'সংরক্ষণ করুন',
    saving: 'সংরক্ষণ হচ্ছে...',
    cancel: 'বাতিল',
    close: 'বন্ধ করুন',
  },
  en: {
    editTitle: 'Edit product',
    addTitle: 'Add Product',
    image: 'Product image',
    imageUrl: 'Image URL',
    upload: 'Upload file',
    uploading: 'Uploading...',
    uploadFailed: 'Image upload failed. Try again or paste a URL.',
    uploadSaved: 'Image added',
    uploadFallback: 'Storage is unavailable. The image was saved directly.',
    uploadLarge: 'That image is too large. Use a smaller file or paste a URL.',
    dropHint: 'Drag, paste (Ctrl+V), or choose a file',
    name: 'Product name',
    category: 'Category',
    series: 'Series',
    seriesHint: 'PVC, Nylon, TPR, PU...',
    size: 'Size',
    price: 'Wholesale rate',
    stock: 'Live stock',
    code: 'Product code',
    description: 'Description',
    active: 'Visible on the website',
    hidden: 'Hidden from the website',
    save: 'Save Changes',
    saving: 'Saving...',
    cancel: 'Cancel',
    close: 'Close',
  },
}

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-ink'

const SIZE_SUGGESTIONS = ['1"', '1.5"', '2"', '2.5"', '3"', '4"', '5"', '6"', '8"', '10"', '12"']

function blankForm(categories) {
  return {
    name: '',
    categoryId: categories[0]?.id || '',
    series: '',
    size: '',
    price: '',
    stock: '50',
    imageUrl: '',
    productCode: '',
    description: '',
    isActive: true,
  }
}

function formFromProduct(product) {
  return {
    name: product.name || '',
    categoryId: product.category_id || '',
    series: productSeries(product),
    size: productSizes(product)[0] || '',
    price: String(product.price ?? ''),
    stock: String(product.stock ?? 0),
    imageUrl: product.image_url || '',
    productCode: product.product_code || '',
    description: product.description || '',
    isActive: product.is_active !== false,
  }
}

export function ProductFormDrawer({ lang, product, categories, submitting, onClose, onSubmit }) {
  const t = copy[lang] || copy.bn
  const editing = Boolean(product?.id)
  const [form, setForm] = useState(() => (editing ? formFromProduct(product) : blankForm(categories)))
  const [uploading, setUploading] = useState(false)
  const [uploadNote, setUploadNote] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)
  useScrollLock(true)

  useEffect(() => {
    setForm(product?.id ? formFromProduct(product) : blankForm(categories))
    setUploadNote('')
  }, [product, categories])

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function uploadFile(file) {
    if (!file || uploading) return
    setUploading(true)
    setUploadNote('')
    try {
      const result = await uploadProductImage(file)
      setField('imageUrl', result.url)
      if (result.fallback) {
        setUploadNote(t.uploadFallback)
        toast(t.uploadFallback)
      } else {
        toast.success(t.uploadSaved)
      }
    } catch (error) {
      const message = error?.code === 'TOO_LARGE' ? t.uploadLarge : t.uploadFailed
      setUploadNote(message)
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  function onFile(event) {
    const file = imageFileFromList(event.target.files)
    event.target.value = ''
    if (file) uploadFile(file)
  }

  useEffect(() => {
    function onPaste(event) {
      const file = imageFileFromList(event.clipboardData?.files)
      if (!file) return
      event.preventDefault()
      uploadFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  })

  function submit(event) {
    event.preventDefault()
    onSubmit({
      name: form.name.trim(),
      category_id: form.categoryId || null,
      series: form.series.trim(),
      size: formatSizeLabel(form.size) || form.size.trim(),
      price: Number(form.price),
      stock: Math.max(0, Number(form.stock) || 0),
      image_url: form.imageUrl.trim(),
      product_code: form.productCode.trim(),
      description: form.description.trim(),
      is_active: form.isActive,
    })
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" aria-label={t.close} className="absolute inset-0 bg-ink/50 transition-all duration-200" onClick={onClose} />
      <aside className="absolute inset-x-0 bottom-0 flex max-h-[94vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl transition-all duration-200 sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:rounded-none">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-extrabold text-ink">{editing ? t.editTitle : t.addTitle}</h2>
          <button type="button" onClick={onClose} className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-3 text-xs font-bold">
            {t.cancel}
          </button>
        </div>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div>
              <p className="text-xs font-bold text-slate-600">{t.image}</p>
              <div className="mt-2 flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDragOver(false)
                    const file = imageFileFromList(event.dataTransfer?.files)
                    if (file) uploadFile(file)
                  }}
                  className={`relative aspect-square h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed bg-slate-50 transition-all duration-150 ${dragOver ? 'border-ink bg-amber-50' : 'border-slate-300'}`}
                >
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center px-2 text-center text-[11px] font-bold text-slate-400">＋</span>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <input
                    className={fieldClass}
                    value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                    onChange={(e) => setField('imageUrl', e.target.value)}
                    placeholder="https://"
                    aria-label={t.imageUrl}
                  />
                  <label className="mt-2 inline-flex h-11 cursor-pointer items-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-ink transition-all duration-150 transform-gpu active:scale-95 hover:bg-slate-50">
                    {uploading ? t.uploading : t.upload}
                    <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onFile} disabled={uploading} />
                  </label>
                  <p className="mt-2 text-[11px] font-semibold leading-snug text-slate-500">{t.dropHint}</p>
                </div>
              </div>
              {uploadNote && <p className="mt-2 text-xs font-semibold text-amber-700">{uploadNote}</p>}
            </div>

            <label className="block text-xs font-bold text-slate-600">
              {t.name}
              <input className={`${fieldClass} mt-1`} required value={form.name} onChange={(e) => setField('name', e.target.value)} />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-slate-600">
                {t.category}
                <select className={`${fieldClass} mt-1`} value={form.categoryId} onChange={(e) => setField('categoryId', e.target.value)} required>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{categoryCopy(category, lang).title}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-600">
                {t.series}
                <input
                  className={`${fieldClass} mt-1`}
                  list="product-series"
                  value={form.series}
                  onChange={(e) => setField('series', e.target.value)}
                  placeholder={t.seriesHint}
                />
                <datalist id="product-series">
                  {SERIES_OPTIONS.map((series) => <option key={series} value={series} />)}
                </datalist>
              </label>
              <label className="block text-xs font-bold text-slate-600">
                {t.size}
                <input
                  className={`${fieldClass} mt-1`}
                  list="product-sizes"
                  value={form.size}
                  onChange={(e) => setField('size', e.target.value)}
                  placeholder='4"'
                />
                <datalist id="product-sizes">
                  {SIZE_SUGGESTIONS.map((size) => <option key={size} value={size} />)}
                </datalist>
              </label>
              <label className="block text-xs font-bold text-slate-600">
                {t.code}
                <input className={`${fieldClass} mt-1`} value={form.productCode} onChange={(e) => setField('productCode', e.target.value)} />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                {t.price}
                <span className="relative mt-1 block">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">৳</span>
                  <input
                    className={`${fieldClass} pl-8`}
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={form.price}
                    onChange={(e) => setField('price', e.target.value)}
                  />
                </span>
              </label>
              <label className="block text-xs font-bold text-slate-600">
                {t.stock}
                <input
                  className={`${fieldClass} mt-1`}
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.stock}
                  onChange={(e) => setField('stock', e.target.value)}
                />
              </label>
            </div>

            <label className="block text-xs font-bold text-slate-600">
              {t.description}
              <input className={`${fieldClass} mt-1`} value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </label>

            <button
              type="button"
              onClick={() => setField('isActive', !form.isActive)}
              className={`flex min-h-11 w-full items-center justify-between rounded-2xl border px-4 text-sm font-bold transition-all duration-200 ${form.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
            >
              <span>{form.isActive ? t.active : t.hidden}</span>
              <span className={`relative h-6 w-11 rounded-full transition-all duration-200 ${form.isActive ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all duration-200 ${form.isActive ? 'left-5' : 'left-0.5'}`} />
              </span>
            </button>
          </div>
          <div className="border-t border-slate-100 px-5 py-4">
            <button
              type="submit"
              disabled={submitting || uploading}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white transition-all duration-200 disabled:bg-slate-400"
            >
              {submitting ? t.saving : t.save}
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}
