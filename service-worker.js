//PUSH NOTIFICATIONS ***********************************************

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');

  const data = event.data.json();
  const title = data.title;
  const options = data.options;

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  // console.log(event.action);
  // console.log(event.notification);
  console.log('[Service Worker] '+event.notification.title);
  console.log(event.notification.data);
  console.log('changed');

  if(event.notification.data != null){
    var key = event.notification.data.event_key;
  }
  event.notification.close();


  if (event.action === 'knowmore') {  
    clients.openWindow('/knowmore/'+key);  
  }  
  else if (event.action === 'reply') {  
    // clients.openWindow("/messages?reply=" + messageId);  
  }else{
    event.notification.close();

  }
  
});


//CACHING 1 ***********************************************
  var staticCache = 'Events-Cache-v1'
  // cache the application shell
  var filesToCache = [
  '.',
  '/',
  'css/events.css',
  'css/event_desc.css',
  'css/mdl.css',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  // 'css/roboto.css',
  'https://fonts.gstatic.com/s/materialicons/v38/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
  'app images/drawerpic2.png',
  'index.html',
  'js/app.js',
  'js/mdl.js',
  'js/client.js',
  '/data',
  'manifest.json',
  'images/91.jpg'
  

  ];

// self.addEventListener('install', function(event) {
//   event.waitUntil(
//     caches.open(staticCache).then(function(cache) {
//         console.log('Caching Static content on SW install')

//         return cache.addAll(filesToCache);
//     })
//   );
// });


self.addEventListener('fetch', function(event) {

    // console.log('[Service Worker]', event.request.url);

   
    if(event.request.url.endsWith('/data')){
        // console.log('requested data')
        // strategy 1 network first then if fetch FAILS falls back to cache, also update cache
            event.respondWith(
                fetch(event.request).catch(function() {
                    return caches.match(event.request);
                })
                
            )
            event.waitUntil(
                caches.open(staticCache).then(function(cache) {
                    return fetch(event.request).then(response=>{
                        return cache.put(event.request,response);
                    }).catch(err=>console.log(err))
                })
            )
                
            

        //strategy 2 respond with cache always and update cache with every request
            // event.respondWith(
            //     caches.open(staticCache).then(cache=>{
            //         return cache.match(event.request);
            //     })

            // )
            // event.waitUntil(
            //     caches.open(staticCache).then(function(cache) {
            //         return fetch(event.request).then(response=>{
            //             return cache.put(event.request,response);
            //         })
            //     })
            // )
            

    }else if(event.request.url.includes('/dashboard') 
      || event.request.url.includes('/subscribe') 
      || event.request.url.includes('/unsubscribe')
      || event.request.url.includes('/auth')){
        return;
    }
    else{
        // cache only for stuff in cache , network only for other stuff
        // event.respondWith(
        //    caches.match(event.request).then(function(response) {
        //     return response || fetch(event.request);
        //     })
        // );


        //network first then if fetch FAILS falls back to cache, 
        //also update every request made to cache
        event.respondWith(
                fetch(event.request).catch(function() {
                    return caches.match(event.request);
                })
                
            )
            event.waitUntil(
                caches.open(staticCache).then(function(cache) {
                    return fetch(event.request).then(response=>{
                        return cache.put(event.request,response);
                    }).catch(err=>console.log(err))
                })
            )
    }    
});


self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheName){
            Promise.all(
                cacheName.filter(cacheName=>{
                return cacheName.startsWith('Events-Cache') && cacheName != staticCache;
                }).map(function(cacheName){
                    return caches.delete(cacheName)
                })
            )
            
        })


    )




});