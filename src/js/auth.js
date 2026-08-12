// ChatTeman - auth.js
// Login, register, penyimpanan token JWT (access + refresh opsional), logout.
// Token disimpan di localStorage (khusus di dalam APK/WebView) supaya
// sesi tetap ada saat app dibuka ulang.

var CHATTEMAN_TOKEN_KEY = 'chatteman_access_token';
var CHATTEMAN_REFRESH_KEY = 'chatteman_refresh_token';
var CHATTEMAN_USER_KEY = 'chatteman_user';

function chattemanAuthGetAccessToken() {
  return localStorage.getItem(CHATTEMAN_TOKEN_KEY);
}

function chattemanAuthGetUser() {
  var raw = localStorage.getItem(CHATTEMAN_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function chattemanAuthIsLoggedIn() {
  return !!chattemanAuthGetAccessToken();
}

// Bentuk response auth/login dari backend belum 100% dipastikan seragam
// (bisa data.token, data.access_token, atau bersarang di data.data / data.result).
// Ekstraksi dibuat fleksibel supaya tidak gampang patah kalau bentuknya
// sedikit beda dari yang kita duga.
function chattemanAuthExtractSessionData(res) {
  var d = res.data || res.result || res;
  var token = d.access_token || d.token || (d.data && (d.data.access_token || d.data.token));
  var refreshToken = d.refresh_token || d.refreshToken || null;
  var user = d.user || (d.data && d.data.user) || {};
  return { token: token, refreshToken: refreshToken, user: user };
}

function chattemanAuthSaveSession(session) {
  localStorage.setItem(CHATTEMAN_TOKEN_KEY, session.token || '');
  if (session.refreshToken) {
    localStorage.setItem(CHATTEMAN_REFRESH_KEY, session.refreshToken);
  }
  localStorage.setItem(CHATTEMAN_USER_KEY, JSON.stringify(session.user || {}));
}

function chattemanAuthClearSession() {
  localStorage.removeItem(CHATTEMAN_TOKEN_KEY);
  localStorage.removeItem(CHATTEMAN_REFRESH_KEY);
  localStorage.removeItem(CHATTEMAN_USER_KEY);
}

/**
 * Login ke ChatTemanAPI.
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function chattemanAuthLogin(username, password) {
  var res = await chattemanApiRequest('POST', 'auth/login', {
    body: { username: username, password: password },
  });

  if (!res.success) {
    return { ok: false, message: res.message || res.error || 'Login gagal.' };
  }

  var session = chattemanAuthExtractSessionData(res);
  if (!session.token) {
    return { ok: false, message: 'Login berhasil tapi token tidak ditemukan di response server.' };
  }

  chattemanAuthSaveSession(session);
  return { ok: true, message: res.message || 'Login berhasil.' };
}

/**
 * Cek ketersediaan username (dipakai saat mengetik di form register).
 * @returns {Promise<{ok: boolean, available: boolean, message: string}>}
 */
async function chattemanAuthCheckUsername(username) {
  var res = await chattemanApiRequest('GET', 'auth/check-username', {
    query: { username: username },
  });

  if (!res.success) {
    return { ok: false, available: false, message: res.message || 'Gagal memeriksa username.' };
  }

  var available = res.data && typeof res.data.available === 'boolean'
    ? res.data.available
    : !!res.available;

  return { ok: true, available: available, message: res.message || '' };
}

/**
 * Daftar akun baru, lalu langsung login otomatis.
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function chattemanAuthRegister(username, email, password) {
  var res = await chattemanApiRequest('POST', 'auth/register', {
    body: { username: username, email: email, password: password },
  });

  if (!res.success) {
    return { ok: false, message: res.message || res.error || 'Pendaftaran gagal.' };
  }

  // Beberapa backend langsung mengembalikan token saat register, sebagian
  // lain butuh login terpisah -- coba pakai token dari register dulu,
  // baru fallback ke auth/login otomatis kalau belum ada.
  var session = chattemanAuthExtractSessionData(res);
  if (session.token) {
    chattemanAuthSaveSession(session);
    return { ok: true, message: res.message || 'Pendaftaran berhasil.' };
  }

  var loginResult = await chattemanAuthLogin(username, password);
  if (!loginResult.ok) {
    return { ok: true, message: 'Akun berhasil dibuat, silakan masuk.', needsLogin: true };
  }
  return { ok: true, message: 'Pendaftaran berhasil.' };
}

function chattemanAuthLogout() {
  // Endpoint auth/logout butuh Bearer token yang masih ada, tapi kita
  // tetap hapus sesi lokal walau request ke server gagal/offline.
  chattemanApiRequest('POST', 'auth/logout', { auth: true }).catch(function () {});
  chattemanAuthClearSession();
}
