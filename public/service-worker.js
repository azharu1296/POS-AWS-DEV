const CACHE_NAME = 'azeetech-pos-v1';
const ASSETS_TO_CACHE = [
  '/login.html',
  '/owner-admin.html',
  '/kitchen.html',
  '/waiter.html',
  '/menu.html',
  '/index.html'
];

// इंस्टॉल होने पर कोर पेजेस को कैश में लॉक करना
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🟢 PWA Offline Shield: Caching Core Assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.log("Cache error during install:", err))
  );
});

// नेटवर्क रिक्वेस्ट को इंटरसेप्ट करना ताकि ऐप तुरंत खुले
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // अगर कैश में है, तो वहीं से तुरंत लोड करो
        return cachedResponse;
      }
      // नहीं तो लाइव नेटवर्क से खींचो
      return fetch(event.request);
    })
  );
});