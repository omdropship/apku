// ChatTeman - messages.js
// Daftar percakapan, isi satu percakapan, dan kirim pesan.
// Belum pakai Socket.IO realtime (masih sesuai prinsip "sesederhana
// mungkin" di tahap ini) -- daftar & percakapan di-refresh manual lewat
// polling ringan yang dipicu app.js saat halaman dibuka / pesan dikirim.

/**
 * Ambil daftar percakapan (GET messages/list).
 * @returns {Promise<{ok: boolean, message: string, conversations: Array}>}
 */
async function chattemanMessagesFetchList() {
  var res = await chattemanApiRequest('GET', 'messages/list', { auth: true });

  if (!res.success) {
    return {
      ok: false,
      message: res.message || 'Gagal memuat daftar pesan.',
      conversations: [],
      __unauthorized: res.__unauthorized,
    };
  }

  return { ok: true, message: res.message || 'OK', conversations: res.data || [] };
}

/**
 * Ambil isi satu percakapan dengan user tertentu (GET messages/conversation?with=).
 * @param {string} withGuid
 * @returns {Promise<{ok: boolean, message: string, messages: Array}>}
 */
async function chattemanMessagesFetchConversation(withGuid) {
  var res = await chattemanApiRequest('GET', 'messages/conversation', {
    auth: true,
    query: { with: withGuid },
  });

  if (!res.success) {
    return {
      ok: false,
      message: res.message || 'Gagal memuat percakapan.',
      messages: [],
      __unauthorized: res.__unauthorized,
    };
  }

  return { ok: true, message: res.message || 'OK', messages: res.data || [] };
}

/**
 * Kirim pesan (POST messages/send).
 * @param {string} toGuid
 * @param {string} text
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function chattemanMessagesSend(toGuid, text) {
  var res = await chattemanApiRequest('POST', 'messages/send', {
    auth: true,
    body: { to: toGuid, message: text },
  });

  if (!res.success) {
    return { ok: false, message: res.message || 'Gagal mengirim pesan.', __unauthorized: res.__unauthorized };
  }

  return { ok: true, message: res.message || 'Terkirim.' };
}

