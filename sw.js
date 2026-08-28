// Aura Chat - Service Worker for Background Notifications & PWA
const CACHE_NAME = 'aura-chat-v1.0';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        }).then(() => clients.claim())
    );
});

// Handle incoming notification message from main page
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, icon, tag } = event.data;
        const iconUrl = icon || './icon-192.png';
        const badgeUrl = './badge-96.png';
        
        self.registration.showNotification(title, {
            body: body,
            icon: iconUrl,
            badge: badgeUrl,
            tag: tag || 'aura-chat-msg-' + Date.now(),
            renotify: true,
            vibrate: [200, 100, 200],
            data: { url: self.registration.scope },
            actions: [
                { action: 'reply', title: 'Responder', type: 'text', placeholder: 'Escribe tu respuesta...' },
                { action: 'open_chat', title: 'Abrir Chat' }
            ]
        });
    }
});

// Handle notification click and interactive quick replies
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // 1. If user replied directly from the notification (Android inline reply)
    if (event.action === 'reply' && event.reply) {
        const replyText = event.reply;
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                for (const client of clientList) {
                    client.postMessage({ type: 'NOTIFICATION_REPLY', text: replyText });
                    if ('focus' in client) return client.focus();
                }
                if (clients.openWindow) {
                    return clients.openWindow('./?reply=' + encodeURIComponent(replyText));
                }
            })
        );
        return;
    }

    // 2. Default click: focus window and open chat
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});
