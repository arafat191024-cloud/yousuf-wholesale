export function EmptyState({ icon = '📦', title, body, action }) {
  return (
    <div className="premium-card rounded-3xl px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sand text-2xl">
        {icon}
      </div>
      <h2 className="text-lg font-extrabold text-ink">{title}</h2>
      {body && <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
