// 근무 트래커 Service Worker
var ALARM_TIME = '18:00';
var _alarmTimer = null;

self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
});

// 메시지 수신 (앱 → SW)
self.addEventListener('message', function(e) {
  if (e.data.type === 'SET_ALARM') {
    ALARM_TIME = e.data.time;
    scheduleAlarm();
  }
  if (e.data.type === 'SHOW_NOTIF') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: '/work-tracker/icon-192.png',
      badge: '/work-tracker/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'work-tracker',
      requireInteraction: false,
      data: { url: '/work-tracker/' }
    });
  }
  if (e.data.type === 'CANCEL_ALARM') {
    if (_alarmTimer) { clearTimeout(_alarmTimer); _alarmTimer = null; }
  }
});

// 알람 스케줄 (SW 내부)
function scheduleAlarm() {
  if (_alarmTimer) { clearTimeout(_alarmTimer); _alarmTimer = null; }
  var parts = ALARM_TIME.split(':');
  var now = new Date();
  var target = new Date();
  target.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  var ms = target - now;
  _alarmTimer = setTimeout(function() {
    fireAlarm();
    scheduleAlarm(); // 매일 반복
  }, ms);
}

function fireAlarm() {
  self.registration.showNotification('근무 트래커', {
    body: '오늘 출퇴근 시간을 입력해주세요 🕐',
    icon: '/work-tracker/icon-192.png',
    badge: '/work-tracker/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'work-tracker-alarm',
    requireInteraction: true,
    data: { url: '/work-tracker/' }
  });
}

// 알림 클릭 시 앱으로 이동
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || '/work-tracker/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cls) {
      for (var i = 0; i < cls.length; i++) {
        if (cls[i].url.indexOf('/work-tracker') !== -1) {
          return cls[i].focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});

// 백그라운드 동기화 (알람 재스케줄용)
self.addEventListener('sync', function(e) {
  if (e.tag === 'reschedule-alarm') {
    scheduleAlarm();
  }
});
