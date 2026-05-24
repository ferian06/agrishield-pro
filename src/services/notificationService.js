const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export const notificationService = {
  isSupported() {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    )
  },

  getPermission() {
    return typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  },

  /** Request permission, subscribe to push, and save subscription to backend. */
  async enable() {
    if (!this.isSupported()) return { success: false, reason: 'unsupported' }
    if (!VAPID_PUBLIC_KEY) return { success: false, reason: 'no-vapid-key' }
    if (this.getPermission() === 'denied') return { success: false, reason: 'denied' }

    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return { success: false, reason: 'dismissed' }

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Try to get location so backend can send weather alerts
      let lat = null, lng = null
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        )
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      } catch { /* location not available — weather alerts won't fire but push still works */ }

      const api = (await import('./api')).default
      await api.post('/notifications/subscribe', { subscription: sub.toJSON(), lat, lng })
      localStorage.setItem('gg_push_enabled', '1')
      return { success: true }
    } catch {
      return { success: false, reason: 'error' }
    }
  },

  isEnabled() {
    return this.getPermission() === 'granted' && !!localStorage.getItem('gg_push_enabled')
  },
}
