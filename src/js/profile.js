// ChatTeman - profile.js
// Profil (lihat/edit), daftar teman, permintaan pertemanan, dan blokir.
// Upload foto avatar belum diimplementasi di tahap ini (butuh input file
// + multipart/form-data terpisah dari wrapper JSON di api.js) -- placeholder
// dulu, dikerjakan setelah UI dasar semua halaman selesai.

/**
 * Ambil data profil. Tanpa guid = profil sendiri.
 * @param {string} [guid]
 * @returns {Promise<{ok: boolean, message: string, profile: object|null}>}
 */
async function chattemanProfileFetch(guid) {
  var res = await chattemanApiRequest('GET', 'profile/show', {
    auth: true,
    query: guid ? { id: guid } : undefined,
  });

  if (!res.success) {
    return { ok: false, message: res.message || 'Gagal memuat profil.', profile: null, __unauthorized: res.__unauthorized };
  }

  return { ok: true, message: res.message || 'OK', profile: res.data || {} };
}

/**
 * Update profil sendiri (nama, bio, dst).
 * @param {object} fields
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function chattemanProfileEdit(fields) {
  var res = await chattemanApiRequest('POST', 'profile/edit', {
    auth: true,
    body: fields,
  });

  if (!res.success) {
    return { ok: false, message: res.message || 'Gagal menyimpan profil.', __unauthorized: res.__unauthorized };
  }

  return { ok: true, message: res.message || 'Profil disimpan.' };
}

/**
 * Aksi pertemanan generik: 'add' (kirim/terima permintaan) atau 'remove'
 * (tolak/batalkan/hapus teman) -- sesuai pola POST friends/{action}.
 * @param {'add'|'remove'} action
 * @param {string} guid
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function chattemanFriendAction(action, guid) {
  var res = await chattemanApiRequest('POST', 'friends/' + action, {
    auth: true,
    body: { guid: guid },
  });

  if (!res.success) {
    return { ok: false, message: res.message || 'Gagal memproses pertemanan.', __unauthorized: res.__unauthorized };
  }

  return { ok: true, message: res.message || 'OK' };
}

async function chattemanFriendsFetchList() {
  var res = await chattemanApiRequest('GET', 'friends/list', { auth: true });
  if (!res.success) {
    return { ok: false, message: res.message || 'Gagal memuat daftar teman.', people: [], __unauthorized: res.__unauthorized };
  }
  return { ok: true, message: res.message || 'OK', people: res.data || [] };
}

async function chattemanFriendsFetchRequests() {
  var res = await chattemanApiRequest('GET', 'friends/requests', { auth: true });
  if (!res.success) {
    return { ok: false, message: res.message || 'Gagal memuat permintaan.', people: [], __unauthorized: res.__unauthorized };
  }
  return { ok: true, message: res.message || 'OK', people: res.data || [] };
}

async function chattemanFriendsFetchSent() {
  var res = await chattemanApiRequest('GET', 'friends/sent', { auth: true });
  if (!res.success) {
    return { ok: false, message: res.message || 'Gagal memuat permintaan terkirim.', people: [], __unauthorized: res.__unauthorized };
  }
  return { ok: true, message: res.message || 'OK', people: res.data || [] };
}

/**
 * Aksi blokir generik: 'add' (blokir) atau 'remove' (buka blokir).
 * @param {'add'|'remove'} action
 * @param {string} guid
 */
async function chattemanBlockAction(action, guid) {
  var res = await chattemanApiRequest('POST', 'block/' + action, {
    auth: true,
    body: { guid: guid },
  });

  if (!res.success) {
    return { ok: false, message: res.message || 'Gagal memproses blokir.', __unauthorized: res.__unauthorized };
  }

  return { ok: true, message: res.message || 'OK' };
}

async function chattemanBlockFetchList() {
  var res = await chattemanApiRequest('GET', 'block/list', { auth: true });
  if (!res.success) {
    return { ok: false, message: res.message || 'Gagal memuat daftar blokir.', people: [], __unauthorized: res.__unauthorized };
  }
  return { ok: true, message: res.message || 'OK', people: res.data || [] };
}
