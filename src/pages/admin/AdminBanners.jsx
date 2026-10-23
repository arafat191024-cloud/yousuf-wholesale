import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useLanguage } from '../../context/LanguageContext'
import { BackButton } from '../../components/BackButton'
import { LanguageToggle } from '../../components/LanguageToggle'
import { imageFileFromList, uploadBannerImage } from '../../lib/productImage'

const copy = {
  bn: {
    title: 'ব্যানার ম্যানেজমেন্ট (Banners)',
    orders: 'অর্ডার',
    products: 'পণ্য',
    memo: 'নতুন মেমো',
    name: 'ব্যানারের নাম',
    link: 'টার্গেট লিংক / ক্যাটাগরি URL',
    priority: 'অগ্রাধিকার',
    active: 'সক্রিয়',
    inactive: 'নিষ্ক্রিয়',
    add: 'ব্যানার যোগ করুন',
    adding: 'যোগ হচ্ছে...',
    image: 'ব্যানার ছবি',
    required: 'নাম এবং ছবি দিন।',
    added: 'ব্যানার যোগ হয়েছে',
    addError: 'ব্যানার যোগ হয়নি',
    toggled: 'অবস্থা বদলানো হয়েছে',
    toggleError: 'অবস্থা বদলানো যায়নি',
    deleted: 'ব্যানার মুছে ফেলা হয়েছে',
    deleteError: 'ব্যানার মুছা যায়নি',
    confirmDelete: 'এই ব্যানারটি মুছে ফেলবেন?',
    empty: 'এখনো কোনো ব্যানার নেই',
    loadError: 'ব্যানার লোড হয়নি। promotional_banners টেবিল আছে কিনা দেখুন।',
    uploadFailed: 'ছবি আপলোড হয়নি',
  },
  en: {
    title: 'Banner management (Banners)',
    orders: 'Orders',
    products: 'Products',
    memo: 'New memo',
    name: 'Banner title',
    link: 'Target link / category URL',
    priority: 'Priority',
    active: 'Active',
    inactive: 'Inactive',
    add: 'Add banner',
    adding: 'Adding...',
    image: 'Banner image',
    required: 'Title and image are required.',
    added: 'Banner added',
    addError: 'Could not add the banner',
    toggled: 'Status updated',
    toggleError: 'Could not update status',
    deleted: 'Banner deleted',
    deleteError: 'Could not delete the banner',
    confirmDelete: 'Delete this banner?',
    empty: 'No banners yet',
    loadError: 'Could not load banners. Check that promotional_banners exists.',
    uploadFailed: 'Image upload failed',
  },
}

const field = 'mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-ink'
const actionBtn = 'inline-flex min-h-11 items-center rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold transition-all duration-200 hover:bg-sand'

export default function AdminBanners() {
  const { lang } = useLanguage()
  const t = copy[lang] || copy.bn
  const fileRef = useRef(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [targetLink, setTargetLink] = useState('/')
  const [priority, setPriority] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [file, setFile] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('promotional_banners')
      .select('id, title, image_url, target_link, is_active, priority, created_at')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) {
      console.error(error)
      toast.error(t.loadError)
      setRows([])
    } else {
      setRows(data || [])
    }
    setLoading(false)
  }, [t.loadError])

  useEffect(() => {
    load()
  }, [load])

  async function onSubmit(event) {
    event.preventDefault()
    if (!title.trim() || !file) {
      toast.error(t.required)
      return
    }
    setSubmitting(true)
    try {
      const uploaded = await uploadBannerImage(file)
      const { error } = await supabase.from('promotional_banners').insert({
        title: title.trim(),
        image_url: uploaded.url,
        target_link: targetLink.trim() || '/',
        is_active: isActive,
        priority: Number(priority) || 0,
      })
      if (error) throw error
      toast.success(t.added)
      setTitle('')
      setTargetLink('/')
      setPriority('0')
      setIsActive(true)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (error) {
      console.error(error)
      toast.error(error?.message ? `${t.addError}: ${error.message}` : t.addError)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggle(row) {
    const next = !row.is_active
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, is_active: next } : item)))
    const { error } = await supabase.from('promotional_banners').update({ is_active: next }).eq('id', row.id)
    if (error) {
      console.error(error)
      toast.error(t.toggleError)
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, is_active: row.is_active } : item)))
      return
    }
    toast.success(t.toggled)
  }

  async function remove(row) {
    if (!window.confirm(t.confirmDelete)) return
    const { error } = await supabase.from('promotional_banners').delete().eq('id', row.id)
    if (error) {
      console.error(error)
      toast.error(t.deleteError)
      return
    }
    setRows((current) => current.filter((item) => item.id !== row.id))
    toast.success(t.deleted)
  }

  return (
    <div className="min-h-screen bg-paper px-4 pb-36 pt-6 md:pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
          <div>
            <BackButton fallback="/admin/orders" className="mb-3" />
            <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{t.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/orders" className={actionBtn}>{t.orders}</Link>
            <Link to="/admin/products" className={actionBtn}>{t.products}</Link>
            <Link to="/admin/pos" className={actionBtn}>{t.memo}</Link>
            <LanguageToggle />
          </div>
        </div>

        <form onSubmit={onSubmit} className="mb-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold text-ink">
              {t.name}
              <input className={field} value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="block text-sm font-bold text-ink">
              {t.link}
              <input className={field} value={targetLink} onChange={(event) => setTargetLink(event.target.value)} placeholder="/category/caster-wheels" />
            </label>
            <label className="block text-sm font-bold text-ink">
              {t.priority}
              <input className={field} inputMode="numeric" value={priority} onChange={(event) => setPriority(event.target.value)} />
            </label>
            <label className="block text-sm font-bold text-ink">
              {t.image}
              <input
                ref={fileRef}
                className={`${field} py-2`}
                type="file"
                accept="image/*"
                onChange={(event) => setFile(imageFileFromList(event.target.files))}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive((current) => !current)}
              className={`inline-flex h-11 items-center rounded-full px-4 text-sm font-bold ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-ink'}`}
            >
              {isActive ? t.active : t.inactive}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center rounded-xl bg-ink px-4 text-sm font-bold text-white disabled:bg-slate-400"
            >
              {submitting ? t.adding : t.add}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="h-24 animate-pulse rounded-3xl bg-slate-200" />
        ) : rows.length === 0 ? (
          <p className="rounded-3xl border border-slate-200 bg-white px-5 py-10 text-center text-sm font-semibold text-slate-500">{t.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <img src={row.image_url} alt="" className="h-16 w-28 rounded-lg object-cover" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-ink">{row.title}</p>
                      <p className="text-xs text-slate-500">{row.target_link || '/'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggle(row)}
                        className={`inline-flex h-10 items-center rounded-full px-3 text-xs font-bold ${row.is_active ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-ink'}`}
                      >
                        {row.is_active ? t.active : t.inactive}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => remove(row)}
                        className="inline-flex h-10 items-center rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700"
                      >
                        {lang === 'bn' ? 'মুছুন' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
