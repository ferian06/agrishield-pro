import React, { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { notificationService } from '../services/notificationService'

export default function NotificationBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (
      notificationService.isSupported() &&
      notificationService.getPermission() === 'default' &&
      !localStorage.getItem('gg_notif_dismissed')
    ) {
      const t = setTimeout(() => setVisible(true), 2500)
      return () => clearTimeout(t)
    }
  }, [])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem('gg_notif_dismissed', '1')
    setVisible(false)
  }

  const handleEnable = async () => {
    setLoading(true)
    const result = await notificationService.enable()
    setLoading(false)
    if (result.success || result.reason === 'dismissed') {
      localStorage.setItem('gg_notif_dismissed', '1')
    }
    setVisible(false)
  }

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-3 pt-2 pointer-events-none">
      <div className="bg-forest-mid text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3 pointer-events-auto
                      animate-[slideDown_0.3s_ease-out]">
        <div className="w-9 h-9 bg-brand-mint/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bell size={16} className="text-brand-mint" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{t('notifBanner.title')}</p>
          <p className="text-xs text-green-200 mt-0.5 leading-relaxed">{t('notifBanner.subtitle')}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="bg-brand-mint text-forest-mid text-xs font-bold px-4 py-1.5 rounded-full disabled:opacity-60"
            >
              {loading ? t('notifBanner.enabling') : t('notifBanner.allow')}
            </button>
            <button onClick={dismiss} className="text-green-200 text-xs font-semibold px-2 py-1.5">
              {t('notifBanner.notNow')}
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="text-white/50 hover:text-white transition-colors flex-shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
