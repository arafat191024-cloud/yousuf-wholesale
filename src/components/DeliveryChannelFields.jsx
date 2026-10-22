import { DELIVERY_CHANNELS } from '../lib/deliveryChannels'

export function DeliveryChannelFields({ lang, channel, note, onChannel, onNote, onFocus, fieldClass }) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-600">
        {lang === 'bn'
          ? 'ডেলিভারি চ্যানেল / পরিবহন মাধ্যম (Delivery Transport) *'
          : 'Delivery Transport / ডেলিভারি চ্যানেল *'}
        <select
          required
          value={channel}
          onChange={(e) => onChannel(e.target.value)}
          onFocus={onFocus}
          className={`${fieldClass} mt-1`}
        >
          <option value="">{lang === 'bn' ? 'পরিবহন মাধ্যম বাছুন' : 'Select a transport channel'}</option>
          {DELIVERY_CHANNELS.map((item) => (
            <option key={item.id} value={item.id}>
              {lang === 'bn' ? `${item.bn} (${item.en})` : `${item.en} / ${item.bn}`}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-bold text-slate-600">
        {lang === 'bn' ? 'শাখা বা বুকিং নোট' : 'Branch or booking note'}
        <input
          className={`${fieldClass} mt-1`}
          value={note}
          onChange={(e) => onNote(e.target.value)}
          onFocus={onFocus}
          placeholder={lang === 'bn' ? 'যেমন: নবাবপুর শাখা থেকে রিসিভ করব' : 'e.g. Receive from Nawabpur branch'}
        />
      </label>
    </div>
  )
}
