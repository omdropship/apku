// ChatTeman - nearby.js
// Ambil & kirim lokasi, ambil daftar user terdekat dari ChatTemanAPI.
// Pakai navigator.geolocation bawaan WebView (bukan plugin Capacitor
// terpisah) supaya tetap sesuai prinsip "sesederhana mungkin" di tahap ini.
// CATATAN: kalau nanti prompt izin lokasi tidak muncul di HP asli, kita
// perlu tambah plugin @capacitor/geolocation - baru dikerjakan kalau
// memang dibutuhkan.

/**
 * Minta lokasi device saat ini lewat browser Geolocation API.
 * @returns {Promise<{latitude:number, longitude:number}>}
 */
function chattemanNearbyGetCurrentPosition() {
  return new Promise(function (resolve, reject) {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung di perangkat ini.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      function (err) {
        reject(new Error('Gagal mengambil lokasi: ' + err.message));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

/**
 * Kirim lokasi saat ini ke server (POST nearby/update).
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function chattemanNearbyUpdateLocation() {
  var pos;
  try {
    pos = await chattemanNearbyGetCurrentPosition();
  } catch (e) {
    return { ok: false, message: e.message };
  }

  var res = await chattemanApiRequest('POST', 'nearby/update', {
    auth: true,
    body: { latitude: pos.latitude, longitude: pos.longitude },
  });

  if (!res.success) {
    return { ok: false, message: res.message || 'Gagal memperbarui lokasi.', __unauthorized: res.__unauthorized };
  }
  return { ok: true, message: res.message || 'Lokasi berhasil diperbarui.' };
}

/**
 * Ambil daftar user terdekat (GET nearby/list).
 * @param {object} [filters] { radius, gender, min_age, max_age }
 * @returns {Promise<{ok: boolean, message: string, users: Array}>}
 */
async function chattemanNearbyFetchList(filters) {
  filters = filters || {};

  var res = await chattemanApiRequest('GET', 'nearby/list', {
    auth: true,
    query: {
      radius: filters.radius || 25,
      gender: filters.gender || 'all',
      min_age: filters.min_age || '',
      max_age: filters.max_age || '',
    },
  });

  if (!res.success) {
    return {
      ok: false,
      message: res.message || 'Gagal mengambil daftar terdekat.',
      users: [],
      __unauthorized: res.__unauthorized,
    };
  }

  return { ok: true, message: res.message || 'OK', users: res.data || [] };
}

/**
 * "Suka" seseorang dari kartu grid Nearby -- kirim permintaan pertemanan
 * (POST friends/add) lewat helper generik chattemanFriendAction di
 * profile.js. Dipisah jadi fungsi sendiri di sini supaya app.js cukup
 * panggil satu nama fungsi yang jelas konteksnya: "like dari nearby".
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function chattemanNearbyLikeUser(guid) {
  return chattemanFriendAction('add', guid);
}
