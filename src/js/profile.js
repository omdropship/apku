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

/**
 * Upload foto profil (POST upload/avatar, multipart/form-data).
 * Dipisah dari chattemanApiRequest di api.js karena wrapper itu selalu
 * mengirim JSON -- upload file butuh FormData & TANPA header
 * Content-Type manual (browser yang mengisi boundary-nya sendiri).
 * @param {File} file
 * @returns {Promise<{ok: boolean, message: string, photo: string|null}>}
 */
async function chattemanProfileUploadAvatar(file) {
  var token = chattemanAuthGetAccessToken();
  if (!token) {
    return { ok: false, message: 'Belum login.', __unauthorized: true, photo: null };
  }

  var formData = new FormData();
  // Nama field 'avatar' mengikuti dugaan paling umum dipakai backend
  // OSSN untuk upload gambar -- kalau backend ternyata pakai nama field
  // lain (mis. 'photo' / 'file'), sesuaikan baris ini.
  formData.append('avatar', file);

  var response;
  try {
    response = await fetch(CHATTEMAN_API_BASE + '/upload/avatar', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData,
    });
  } catch (networkErr) {
    return { ok: false, message: 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda.', photo: null };
  }

  if (response.status === 401) {
    return { ok: false, message: 'Sesi berakhir, silakan masuk kembali.', __unauthorized: true, photo: null };
  }

  var payload;
  try {
    payload = await response.json();
  } catch (parseErr) {
    return { ok: false, message: 'Respons server tidak valid (status ' + response.status + ').', photo: null };
  }

  if (!payload.success) {
    return { ok: false, message: payload.message || 'Gagal mengunggah foto.', photo: null };
  }

  var photo = (payload.data && (payload.data.photo || payload.data.url || payload.data.avatar)) || null;
  return { ok: true, message: payload.message || 'Foto profil diperbarui.', photo: photo };
}
