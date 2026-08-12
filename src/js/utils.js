// ChatTeman - utils.js
// Helper kecil dipakai bareng oleh auth.js / nearby.js / app.js.

/**
 * Escape teks untuk aman dimasukkan ke dalam innerHTML (mencegah XSS
 * sederhana dari data user seperti nama/username).
 */
function chattemanEscapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Tampilkan toast singkat via Framework7 (fallback ke alert jika app
 * belum siap).
 */
function chattemanToast(message) {
  if (typeof app !== 'undefined' && app && app.toast) {
    app.toast.show({
      text: chattemanEscapeHtml(message),
      closeTimeout: 2500,
    });
  } else {
    alert(message);
  }
}
