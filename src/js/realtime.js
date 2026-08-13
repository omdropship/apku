// ChatTeman - realtime.js
// Koneksi Socket.IO untuk pesan masuk & status online real-time.
// Kalau server socket down/offline, fitur lain (login, nearby, kirim
// pesan manual via REST) tetap jalan normal -- ini murni tambahan.

var CHATTEMAN_SOCKET_URL = 'https://yayanheeh.my.id';
var chattemanSocket = null;
var chattemanNewMessageListeners = [];
var chattemanPresenceListeners = [];

function chattemanRealtimeOnNewMessage(callback) {
  chattemanNewMessageListeners.push(callback);
}

function chattemanRealtimeOnPresence(callback) {
  chattemanPresenceListeners.push(callback);
}

var chattemanTypingListeners = [];

function chattemanRealtimeOnTyping(callback) {
  chattemanTypingListeners.push(callback);
}

var chattemanTypingEmitTimer = null;
function chattemanRealtimeEmitTyping(toGuid) {
  if (!chattemanSocket || !chattemanSocket.connected || !toGuid) return;
  // Throttle: cukup kirim event "sedang mengetik" tiap ~2 detik sekali
  // selama user masih mengetik, bukan di setiap keystroke.
  if (chattemanTypingEmitTimer) return;
  chattemanSocket.emit('typing', { to: String(toGuid) });
  chattemanTypingEmitTimer = setTimeout(function () {
    chattemanTypingEmitTimer = null;
  }, 2000);
}

function chattemanRealtimeConnect() {
  if (chattemanSocket || typeof io === 'undefined') return;

  var token = chattemanAuthGetAccessToken();
  if (!token) return;

  chattemanSocket = io(CHATTEMAN_SOCKET_URL, {
    path: '/socket/',
    auth: { token: token },
    transports: ['websocket', 'polling'],
    reconnection: true,
  });

  chattemanSocket.on('connect', function () {
    console.log('[ChatTeman] Socket connected, id=' + chattemanSocket.id);
  });

  chattemanSocket.on('disconnect', function (reason) {
    console.warn('[ChatTeman] Socket disconnected: ' + reason);
  });

  chattemanSocket.on('new_message', function (msg) {
    chattemanNewMessageListeners.forEach(function (cb) { cb(msg); });
  });

  chattemanSocket.on('presence', function (data) {
    chattemanPresenceListeners.forEach(function (cb) { cb(data); });
  });

  chattemanSocket.on('typing', function (data) {
    chattemanTypingListeners.forEach(function (cb) { cb(data); });
  });

  // Server socket gagal connect -- fitur lain (REST) tetap jalan normal,
  // tapi kita log ke console supaya kelihatan kalau lagi debug (sebelumnya
  // didiamkan total, jadi tidak ada jejak sama sekali kalau gagal connect).
  chattemanSocket.on('connect_error', function (err) {
    console.warn('[ChatTeman] Socket connect error: ' + (err && err.message ? err.message : err));
  });
}

function chattemanRealtimeCheckPresence(guid, callback) {
  if (!chattemanSocket || !chattemanSocket.connected || !guid) return;
  chattemanSocket.emit('check_presence', [String(guid)], function (result) {
    if (result && callback) callback(!!result[String(guid)]);
  });
}

/**
 * Cek status online beberapa orang sekaligus (dipakai buat daftar pesan)
 * supaya tidak kirim satu-satu ke server.
 * @param {string[]} guids
 * @param {(onlineMap: Object<string, boolean>) => void} callback
 */
function chattemanRealtimeCheckPresenceBatch(guids, callback) {
  if (!chattemanSocket || !chattemanSocket.connected || !guids || !guids.length) return;
  var stringGuids = guids.map(String);
  chattemanSocket.emit('check_presence', stringGuids, function (result) {
    if (result && callback) callback(result);
  });
}

function chattemanRealtimeDisconnect() {
  if (chattemanSocket) {
    chattemanSocket.disconnect();
    chattemanSocket = null;
  }
}
