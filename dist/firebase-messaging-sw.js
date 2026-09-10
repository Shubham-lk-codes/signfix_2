self.addEventListener('push', event => {
  if (!event.data) return;
  let payload = {};
  try { payload = event.data.json(); } catch (_) { payload = { notification: { body: event.data.text() } }; }
  const notification = payload.notification || payload.data || {};
  event.waitUntil(self.registration.showNotification(notification.title || 'SignFix', {
    body: notification.body || 'You have a new update.',
    icon: '/assets/signfix-logo.svg',
    data: { link: payload.fcmOptions?.link || payload.data?.link || '/' },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.link || '/'));
});
