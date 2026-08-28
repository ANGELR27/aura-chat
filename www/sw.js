// ROAN Chat - Service Worker for Background Notifications, Incoming Calls & PWA
const CACHE_NAME = 'roan-chat-v2.0';

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
            tag: tag || 'roan-msg-' + Date.now(),
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

// Handle notification click and interactive quick replies & incoming calls
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // 1. If user clicked Answer Call on incoming call notification
    if (event.action === 'answer_call') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                for (const client of clientList) {
                    client.postMessage({ type: 'ACCEPT_CALL' });
                    if ('focus' in client) return client.focus();
                }
                if (clients.openWindow) {
                    return clients.openWindow('./?action=accept_call');
                }
            })
        );
        return;
    }

    // 2. If user clicked Reject Call
    if (event.action === 'reject_call') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                for (const client of clientList) {
                    client.postMessage({ type: 'REJECT_CALL' });
                }
            })
        );
        return;
    }

    // 3. If user replied directly from the notification (Android inline text reply)
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

    // 4. Default click: focus window and open chat
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (event.notification.data && event.notification.data.isCall) {
                    client.postMessage({ type: 'ACCEPT_CALL' });
                }
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
