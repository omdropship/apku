// ChatTeman - app.js
// Inisialisasi Framework7 minimal untuk tahap "kerangka project kosong".
// Belum ada fitur (login, chat, nearby, dll) - itu akan ditambahkan
// pada tahap berikutnya.

/* global Framework7 */

var app = new Framework7({
  el: '#app',
  name: 'ChatTeman',
  theme: 'auto',
});

// Indikator sederhana online / offline, sekadar bukti bahwa
// UI lokal tetap berjalan meskipun tanpa koneksi internet.
function updateNetworkStatus() {
  var el = document.getElementById('network-status');
  if (!el) return;

  if (navigator.onLine) {
    el.textContent = 'Online';
    el.className = 'chip online';
  } else {
    el.textContent = 'Offline (UI tetap berjalan)';
    el.className = 'chip offline';
  }
}

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
document.addEventListener('DOMContentLoaded', updateNetworkStatus);
