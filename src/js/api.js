// ChatTeman - api.js
// Wrapper request ke ChatTemanAPI (OSSN component) di yayanheeh.my.id.
// Base URL & helper autentikasi Bearer JWT.

var CHATTEMAN_API_BASE = 'https://yayanheeh.my.id/chatapi/v1';

/**
 * Panggil satu endpoint ChatTemanAPI.
 *
 * @param {string} method  'GET' | 'POST' | dst
 * @param {string} path    contoh: 'auth/login', 'nearby/list'
 * @param {object} [opts]
 * @param {object} [opts.body]   dikirim sebagai JSON (untuk POST/PUT)
 * @param {object} [opts.query]  dikirim sebagai query string (untuk GET)
 * @param {boolean} [opts.auth]  true jika endpoint butuh Authorization Bearer
 * @returns {Promise<object>} payload JSON: { success, message, data|errors }
 */
async function chattemanApiRequest(method, path, opts) {
  opts = opts || {};

  var url = CHATTEMAN_API_BASE + '/' + path;

  if (opts.query) {
    var qs = Object.keys(opts.query)
      .filter(function (k) {
        return opts.query[k] !== undefined && opts.query[k] !== null && opts.query[k] !== '';
      })
      .map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(opts.query[k]);
      })
      .join('&');
    if (qs) {
      url += '?' + qs;
    }
  }

  var headers = {
    'Accept': 'application/json',
  };
  if (opts.body) {
    headers['Content-Type'] = 'application/json';
  }
  if (opts.auth) {
    var token = chattemanAuthGetAccessToken();
    if (!token) {
      // Tidak ada token sama sekali -> anggap unauthorized tanpa perlu fetch
      return { success: false, message: 'Belum login.', __unauthorized: true };
    }
    headers['Authorization'] = 'Bearer ' + token;
  }

  var response;
  try {
    response = await fetch(url, {
      method: method,
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (networkErr) {
    return {
      success: false,
      message: 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda.',
      __networkError: true,
    };
  }

  var payload;
  try {
    payload = await response.json();
  } catch (parseErr) {
    return {
      success: false,
      message: 'Respons server tidak valid (status ' + response.status + ').',
    };
  }

  if (response.status === 401) {
    payload.__unauthorized = true;
  }

  return payload;
}
