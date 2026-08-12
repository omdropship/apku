// ChatTeman - app.js
// Inisialisasi Framework7 + logika halaman Login & Nearby.
// Navigasi masih sederhana (toggle 2 div), belum pakai Framework7 Router
// supaya tetap ringan sesuai tahap project ini.

/* global Framework7, chattemanAuthIsLoggedIn, chattemanAuthGetUser,
   chattemanAuthLogin, chattemanAuthLogout, chattemanNearbyUpdateLocation,
   chattemanNearbyFetchList, chattemanToast, chattemanEscapeHtml */

var app = new Framework7({
  el: '#app',
  name: 'ChatTeman',
  theme: 'auto',
});

var $pageLogin = document.getElementById('page-login');
var $pageNearby = document.getElementById('page-nearby');

function chattemanShowLoginPage() {
  $pageLogin.style.display = '';
  $pageNearby.style.display = 'none';
}

function chattemanShowNearbyPage() {
  $pageLogin.style.display = 'none';
  $pageNearby.style.display = '';

  var user = chattemanAuthGetUser();
  var $username = document.getElementById('nearby-username');
  $username.textContent = (user && (user.name || user.username)) || 'ChatTeman';
}

// ---------- Indikator online/offline ----------
function chattemanUpdateNetworkStatus() {
  var el = document.getElementById('network-status');
  if (!el) return;
  if (navigator.onLine) {
    el.textContent = 'Online';
    el.className = 'chip online';
  } else {
    el.textContent = 'Offline';
    el.className = 'chip offline';
  }
}
window.addEventListener('online', chattemanUpdateNetworkStatus);
window.addEventListener('offline', chattemanUpdateNetworkStatus);

// ---------- Form Login ----------
document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  var username = document.getElementById('login-username').value.trim();
  var password = document.getElementById('login-password').value;
  var $error = document.getElementById('login-error');
  var $submit = document.getElementById('login-submit');

  $error.style.display = 'none';
  $submit.disabled = true;
  $submit.textContent = 'Memproses...';

  var result = await chattemanAuthLogin(username, password);

  $submit.disabled = false;
  $submit.textContent = 'Masuk';

  if (!result.ok) {
    $error.textContent = result.message;
    $error.style.display = '';
    return;
  }

  chattemanToast(result.message);
  chattemanShowNearbyPage();
  chattemanLoadNearbyList();
});

// ---------- Logout ----------
document.getElementById('logout-btn').addEventListener('click', function () {
  chattemanAuthLogout();
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('nearby-list').innerHTML = '';
  chattemanShowLoginPage();
});

// ---------- Perbarui lokasi ----------
document.getElementById('update-location-btn').addEventListener('click', async function () {
  var $btn = this;
  var $status = document.getElementById('nearby-status');

  $btn.disabled = true;
  $btn.textContent = 'Mengambil lokasi...';
  $status.style.display = 'none';

  var result = await chattemanNearbyUpdateLocation();

  $btn.disabled = false;
  $btn.textContent = 'Perbarui Lokasi Saya';

  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }

  $status.textContent = result.message;
  $status.className = result.ok ? 'chip online' : 'chip offline';
  $status.style.display = '';

  if (result.ok) {
    chattemanLoadNearbyList();
  }
});

// ---------- Muat ulang daftar ----------
document.getElementById('refresh-list-btn').addEventListener('click', function () {
  chattemanLoadNearbyList();
});

// ---------- Render & load daftar nearby ----------
function chattemanRenderNearbyList(users) {
  var $list = document.getElementById('nearby-list');

  if (!users || users.length === 0) {
    $list.innerHTML = '<p class="nearby-empty">Belum ada orang terdekat yang ditemukan.</p>';
    return;
  }

  $list.innerHTML = users.map(function (u) {
    var name = chattemanEscapeHtml(u.name || u.username || 'Pengguna');
    var distance = (typeof u.distance === 'number') ? u.distance + ' km' : '-';
    var age = u.age ? (u.age + ' th') : '';
    var online = u.online ? '<span class="chip online">Online</span>' : '';
    var photo = u.photo
      ? '<img src="' + chattemanEscapeHtml(u.photo) + '" alt="" class="nearby-avatar" />'
      : '<div class="nearby-avatar nearby-avatar-fallback">' + name.charAt(0).toUpperCase() + '</div>';

    return (
      '<div class="nearby-card">' +
        photo +
        '<div class="nearby-card-info">' +
          '<strong>' + name + '</strong>' +
          '<p>' + distance + (age ? ' &middot; ' + age : '') + '</p>' +
          online +
        '</div>' +
      '</div>'
    );
  }).join('');
}

async function chattemanLoadNearbyList() {
  var $status = document.getElementById('nearby-status');
  var $list = document.getElementById('nearby-list');

  $list.innerHTML = '<p class="nearby-empty">Memuat...</p>';

  var result = await chattemanNearbyFetchList({ radius: 25 });

  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }

  if (!result.ok) {
    $status.textContent = result.message;
    $status.className = 'chip offline';
    $status.style.display = '';
    $list.innerHTML = '';
    return;
  }

  chattemanRenderNearbyList(result.users);
}

// ---------- Bootstrap ----------
document.addEventListener('DOMContentLoaded', function () {
  chattemanUpdateNetworkStatus();

  if (chattemanAuthIsLoggedIn()) {
    chattemanShowNearbyPage();
    chattemanLoadNearbyList();
  } else {
    chattemanShowLoginPage();
  }
});
