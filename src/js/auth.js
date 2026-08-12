// ChatTeman - auth.js
// Login, penyimpanan token JWT (access + refresh), dan logout.
// Token disimpan di localStorage (khusus di dalam APK/WebView, bukan
// artifact browser Claude) supaya sesi tetap ada saat app dibuka ulang.

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

function chattemanAuthSaveSession(data) {
  localStorage.setItem(CHATTEMAN_TOKEN_KEY, data.access_token);
  localStorage.setItem(CHATTEMAN_REFRESH_KEY, data.refresh_token);
  localStorage.setItem(CHATTEMAN_USER_KEY, JSON.stringify(data.user || {}));
}

function chattemanAuthClearSession() {
  localStorage.removeItem(CHATTEMAN_TOKEN_KEY);
  localStorage.removeItem(CHATTEMAN_REFRESH_KEY);
  localStorage.removeItem(CHATTEMAN_USER_KEY);
}

/**
 * Login ke ChatTemanAPI.
 * @param {string} username username atau email
 * @param {string} password
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function chattemanAuthLogin(username, password) {
  var res = await chattemanApiRequest('POST', 'auth/login', {
    body: { username: username, password: password },
  });

  if (!res.success) {
    return { ok: false, message: res.message || 'Login gagal.' };
  }

  chattemanAuthSaveSession(res.data);
  return { ok: true, message: res.message || 'Login berhasil.' };
}

function chattemanAuthLogout() {
  // Endpoint auth/logout butuh Bearer token yang masih ada, tapi kita
  // tetap hapus sesi lokal walau request ke server gagal/offline.
  chattemanApiRequest('POST', 'auth/logout', { auth: true }).catch(function () {});
  chattemanAuthClearSession();
}
