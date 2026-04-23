// 근무 트래커 Service Worker - 캐싱 없음, 항상 최신 버전 로드
var ALARM_TIME = '18:00';
var _alarmTimer = null;

self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) { return caches.delete(key); }));
    }).then(function() { return self.clients.claim(); })
  );
});

// fetch: 캐싱 없이 항상 네트워크
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request.clone(), {cache:'no-store'}).catch(function() {
      return new Response('offline', {status:503});
    })
  );
});

self.addEventListener('message', function(e) {
  if(e.data.type==='SET_ALARM'){ALARM_TIME=e.data.time;scheduleAlarm();}
  if(e.data.type==='SHOW_NOTIF'){
    self.registration.showNotification(e.data.title,{
      body:e.data.body,icon:'/work-tracker/icon-192.png',
      badge:'/work-tracker/icon-192.png',vibrate:[200,100,200],
      tag:'work-tracker',requireInteraction:false,data:{url:'/work-tracker/'}
    });
  }
  if(e.data.type==='CANCEL_ALARM'){if(_alarmTimer){clearTimeout(_alarmTimer);_alarmTimer=null;}}
});

function scheduleAlarm(){
  if(_alarmTimer){clearTimeout(_alarmTimer);_alarmTimer=null;}
  var parts=ALARM_TIME.split(':');
  var now=new Date(), target=new Date();
  target.setHours(Number(parts[0]),Number(parts[1]),0,0);
  if(target<=now) target.setDate(target.getDate()+1);
  _alarmTimer=setTimeout(function(){fireAlarm();scheduleAlarm();},target-now);
}

function fireAlarm(){
  self.registration.showNotification('근무 트래커',{
    body:'오늘 출퇴근 시간을 입력해주세요 🕐',
    icon:'/work-tracker/icon-192.png',badge:'/work-tracker/icon-192.png',
    vibrate:[200,100,200,100,200],tag:'work-tracker-alarm',
    requireInteraction:true,data:{url:'/work-tracker/'}
  });
}

self.addEventListener('notificationclick',function(e){
  e.notification.close();
  var target=(e.notification.data&&e.notification.data.url)||'/work-tracker/';
  e.waitUntil(
    self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cls){
      for(var i=0;i<cls.length;i++){if(cls[i].url.indexOf('/work-tracker')!==-1) return cls[i].focus();}
      return self.clients.openWindow(target);
    })
  );
});
