// ChatTeman - app.js
// Inisialisasi Framework7 + navigasi semua halaman (login, register,
// nearby/radar, pesan, profil). Navigasi masih toggle div sederhana
// (belum pakai Framework7 Router) supaya tetap konsisten dengan gaya
// project ini: sesederhana mungkin, tanpa lapisan tambahan yang tidak
// perlu di tahap ini.

/* global Framework7,
   chattemanAuthIsLoggedIn, chattemanAuthGetUser, chattemanAuthLogin,
   chattemanAuthRegister, chattemanAuthCheckUsername, chattemanAuthLogout,
   chattemanAuthClearSession,
   chattemanNearbyUpdateLocation, chattemanNearbyFetchList,
   chattemanMessagesFetchList, chattemanMessagesFetchConversation, chattemanMessagesSend,
   chattemanProfileFetch, chattemanProfileEdit, chattemanProfileUploadAvatar, chattemanFriendAction,
   chattemanFriendsFetchList, chattemanFriendsFetchRequests, chattemanFriendsFetchSent,
   chattemanBlockAction, chattemanBlockFetchList,
   chattemanRealtimeConnect, chattemanRealtimeDisconnect, chattemanRealtimeOnNewMessage,
   chattemanRealtimeOnPresence, chattemanRealtimeCheckPresence, chattemanRealtimeCheckPresenceBatch,
   chattemanRealtimeOnTyping, chattemanRealtimeEmitTyping,
   chattemanToast, chattemanEscapeHtml */

// Lucide menggambar ulang <i data-lucide="..."> jadi elemen <svg> --
// dipanggil sekali saat load (untuk ikon statis di index.html), dan lagi
// tiap kali HTML baru berisi data-lucide disuntik lewat innerHTML (ikon
// di state kosong/loading yang dirender dinamis oleh JS).
function chattemanRefreshIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

var app = new Framework7({
  el: '#app',
  name: 'ChatTeman',
  theme: 'auto',
});

// ---------- Elemen halaman ----------
var $pageLogin = document.getElementById('page-login');
var $pageRegister = document.getElementById('page-register');
var $pageNearby = document.getElementById('page-nearby');
var $pageMessages = document.getElementById('page-messages');
var $pageChat = document.getElementById('page-chat');
var $pageProfile = document.getElementById('page-profile');
var $tabbar = document.getElementById('ct-tabbar');
var $nearbyTabbar = document.getElementById('nearby-tabbar');

var ALL_PAGES = [$pageLogin, $pageRegister, $pageNearby, $pageMessages, $pageChat, $pageProfile];

function hideAllPages() {
  ALL_PAGES.forEach(function (el) { el.style.display = 'none'; });
}

function setActiveTab(name) {
  $tabbar.querySelectorAll('.ct-tab').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.tab === name);
  });
}

function setActiveNearbyTab(name) {
  $nearbyTabbar.querySelectorAll('.ct-tab').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.nearbyTab === name);
  });
}

function chattemanShowLoginPage() {
  hideAllPages();
  $pageLogin.style.display = '';
  $tabbar.style.display = 'none';
  $nearbyTabbar.style.display = 'none';
}

function chattemanShowRegisterPage() {
  hideAllPages();
  $pageRegister.style.display = '';
  $tabbar.style.display = 'none';
  $nearbyTabbar.style.display = 'none';
}

function chattemanShowNearbyPage() {
  hideAllPages();
  $pageNearby.style.display = '';
  $tabbar.style.display = 'none';
  $nearbyTabbar.style.display = 'flex';
  setActiveNearbyTab('terdekat');
}

function chattemanShowMessagesPage() {
  hideAllPages();
  $pageMessages.style.display = '';
  $tabbar.style.display = 'flex';
  $nearbyTabbar.style.display = 'none';
  setActiveTab('messages');
  chattemanLoadMessagesList();
}

function chattemanShowProfilePage() {
  hideAllPages();
  $pageProfile.style.display = '';
  $tabbar.style.display = 'flex';
  $nearbyTabbar.style.display = 'none';
  setActiveTab('profile');
  chattemanCloseProfilePanels();
  chattemanLoadOwnProfile();
}

function chattemanShowChatPage(guid, name) {
  hideAllPages();
  $pageChat.style.display = '';
  $tabbar.style.display = 'none';
  $nearbyTabbar.style.display = 'none';
  document.getElementById('chat-name').textContent = name || 'Pengguna';
  var $avatar = document.getElementById('chat-avatar');
  $avatar.textContent = (name || '?').charAt(0).toUpperCase();
  chattemanOpenConversation(guid, name);
}

$tabbar.querySelectorAll('.ct-tab').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var tab = btn.dataset.tab;
    if (tab === 'nearby') chattemanShowNearbyPage();
    if (tab === 'messages') chattemanShowMessagesPage();
    if (tab === 'profile') chattemanShowProfilePage();
  });
});

$nearbyTabbar.querySelectorAll('.ct-tab').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var tab = btn.dataset.nearbyTab;
    if (tab === 'terdekat') { setActiveNearbyTab('terdekat'); return; }
    if (tab === 'pesan') { chattemanShowMessagesPage(); return; }
    if (tab === 'profil') { chattemanShowProfilePage(); return; }
    // 'temukan' & 'likes' belum ada halaman/API-nya -- placeholder saja
    // sesuai referensi, tidak mengubah fungsi Nearby yang sudah ada.
    chattemanToast('Segera hadir');
  });
});

// ---------- Indikator online/offline ----------
function chattemanUpdateNetworkStatus() {
  var el = document.getElementById('network-status');
  if (!el) return;
  el.innerHTML = navigator.onLine
    ? '<span class="ct-dot online"></span>Online'
    : '<span class="ct-dot offline"></span>Offline';
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
  chattemanRealtimeConnect();
  chattemanShowNearbyPage();
  chattemanLoadNearbyList();
});

document.getElementById('go-to-register').addEventListener('click', function (e) {
  e.preventDefault();
  chattemanShowRegisterPage();
});

document.getElementById('register-back-btn').addEventListener('click', function () {
  chattemanShowLoginPage();
});

document.getElementById('go-to-login').addEventListener('click', function (e) {
  e.preventDefault();
  chattemanShowLoginPage();
});

// ---------- Form Register ----------
var regUsernameTimer = null;
document.getElementById('reg-username').addEventListener('input', function () {
  var $hint = document.getElementById('reg-username-hint');
  var value = this.value.trim();
  clearTimeout(regUsernameTimer);
  if (!value) { $hint.textContent = ''; return; }
  $hint.textContent = 'Memeriksa...';
  $hint.className = 'field-hint';
  regUsernameTimer = setTimeout(async function () {
    var result = await chattemanAuthCheckUsername(value);
    if (!result.ok) { $hint.textContent = ''; return; }
    $hint.textContent = result.available ? 'Username tersedia' : 'Username sudah dipakai';
    $hint.className = 'field-hint ' + (result.available ? 'ok' : 'bad');
  }, 450);
});

document.getElementById('register-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  var username = document.getElementById('reg-username').value.trim();
  var email = document.getElementById('reg-email').value.trim();
  var password = document.getElementById('reg-password').value;
  var $error = document.getElementById('register-error');
  var $submit = document.getElementById('register-submit');

  $error.style.display = 'none';
  $submit.disabled = true;
  $submit.textContent = 'Memproses...';

  var result = await chattemanAuthRegister(username, email, password);

  $submit.disabled = false;
  $submit.textContent = 'Daftar';

  if (!result.ok) {
    $error.textContent = result.message;
    $error.style.display = '';
    return;
  }

  chattemanToast(result.message);

  if (result.needsLogin || !chattemanAuthIsLoggedIn()) {
    chattemanShowLoginPage();
    return;
  }

  chattemanShowNearbyPage();
  chattemanLoadNearbyList();
});

// ---------- Logout ----------
document.getElementById('logout-btn').addEventListener('click', function () {
  chattemanRealtimeDisconnect();
  chattemanAuthLogout();
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  chattemanShowLoginPage();
});

// ================= NEARBY (GRID 3 KOLOM) =================

document.getElementById('update-location-btn').addEventListener('click', async function () {
  var $btn = this;
  var $status = document.getElementById('nearby-status');

  $btn.disabled = true;
  $status.style.display = 'none';

  var result = await chattemanNearbyUpdateLocation();

  $btn.disabled = false;

  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }

  $status.textContent = result.message;
  $status.className = 'ct-status-msg chip ' + (result.ok ? 'online' : 'offline');
  $status.style.display = '';

  if (result.ok) chattemanLoadNearbyList();
});

var chattemanNearbyRadius = 1; // km -- default sesuai chip aktif "1km" di HTML

function chattemanNearbyInitials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

// Tap kartu grid = langsung buka pesan pribadi dengan orang itu (bukan
// kirim suka lagi) -- pakai halaman chat yang sudah ada persis seperti
// saat tap item di daftar Pesan.
function chattemanNearbyGridCardTap(guid, name) {
  if (!guid) return;
  chattemanShowChatPage(guid, name);
}

function chattemanRenderNearbyGrid(users) {
  var $grid = document.getElementById('nearby-grid');

  if (!users || users.length === 0) {
    $grid.innerHTML =
      '<div class="ct-nearby-empty">' +
        '<div class="emoji"><i data-lucide="compass"></i></div>' +
        '<strong>Belum ada orang baru di sekitarmu</strong>' +
        '<p>Coba perbarui lokasi atau ganti radius.</p>' +
      '</div>';
    chattemanRefreshIcons();
    return;
  }

  $grid.innerHTML = users.map(function (user) {
    var guid = user.guid || user.id || '';
    var name = chattemanEscapeHtml(user.name || user.username || 'Pengguna');
    var age = user.age ? (', ' + user.age) : '';
    var dot = user.online ? '<span class="ct-dot online"></span>' : '';
    var photoHtml = user.photo
      ? '<img src="' + chattemanEscapeHtml(user.photo) + '" alt="" loading="lazy" />'
      : chattemanNearbyInitials(name);

    return (
      '<div class="ct-nearby-card" data-guid="' + chattemanEscapeHtml(guid) + '" data-name="' + name + '">' +
        '<div class="ct-nearby-photo">' + photoHtml + '</div>' +
        '<div class="ct-nearby-meta">' + name + age + dot + '</div>' +
      '</div>'
    );
  }).join('');
}

async function chattemanLoadNearbyList() {
  var $status = document.getElementById('nearby-status');
  var $grid = document.getElementById('nearby-grid');

  $grid.innerHTML = '<div class="ct-nearby-empty"><div class="emoji ct-spin"><i data-lucide="loader-circle"></i></div>Memuat...</div>';
  chattemanRefreshIcons();

  var result = await chattemanNearbyFetchList({ radius: chattemanNearbyRadius });

  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }

  if (!result.ok) {
    $status.textContent = result.message;
    $status.className = 'ct-status-msg chip offline';
    $status.style.display = '';
    chattemanRenderNearbyGrid([]);
    return;
  }

  $status.style.display = 'none';
  chattemanRenderNearbyGrid(result.users);
}

document.getElementById('nearby-grid').addEventListener('click', function (e) {
  var $card = e.target.closest('.ct-nearby-card');
  if (!$card) return;
  chattemanNearbyGridCardTap($card.dataset.guid, $card.dataset.name);
});

document.getElementById('radius-filter').addEventListener('click', function (e) {
  var $chip = e.target.closest('.ct-radius-chip');
  if (!$chip) return;

  document.querySelectorAll('#radius-filter .ct-radius-chip').forEach(function (c) {
    c.classList.toggle('active', c === $chip);
  });

  chattemanNearbyRadius = parseFloat($chip.dataset.radius) || 1;
  chattemanLoadNearbyList();
});

// ================= PESAN (DAFTAR + CHAT) =================
var chattemanOnlineMap = {}; // { guid: true/false } -- status online terakhir yang diketahui

function chattemanRenderMessagesList(conversations) {
  var $list = document.getElementById('messages-list');

  if (!conversations || conversations.length === 0) {
    $list.innerHTML =
      '<div class="ct-empty-state"><div class="emoji"><i data-lucide="message-circle"></i></div>Belum ada percakapan.<br/>Mulai dari kartu di halaman Terdekat.</div>';
    return;
  }

  $list.innerHTML = conversations.map(function (c) {
    var name = chattemanEscapeHtml(c.name || c.username || 'Pengguna');
    var guid = c.guid || c.id || '';
    var preview = chattemanEscapeHtml(c.last_message || c.message || '');
    var time = chattemanEscapeHtml(c.time || c.last_time || '');
    var unread = c.unread_count || c.unread || 0;

    // Status online: pakai data terbaru dari event presence kalau ada,
    // kalau belum ada fallback ke field 'online' dari response messages/list.
    if (typeof chattemanOnlineMap[guid] === 'undefined' && typeof c.online !== 'undefined') {
      chattemanOnlineMap[guid] = !!c.online;
    }
    var isOnline = !!chattemanOnlineMap[guid];

    var avatarInner = c.photo
      ? '<img class="ct-avatar" src="' + chattemanEscapeHtml(c.photo) + '" alt="" />'
      : '<div class="ct-avatar">' + chattemanNearbyInitials(name) + '</div>';

    var avatarHtml =
      '<div class="ct-avatar-wrap" data-online-guid="' + chattemanEscapeHtml(guid) + '">' +
        avatarInner +
        (isOnline ? '<span class="ct-online-badge"></span>' : '') +
      '</div>';

    return (
      '<div class="ct-conv-item" data-guid="' + chattemanEscapeHtml(guid) + '" data-name="' + name + '">' +
        avatarHtml +
        '<div class="ct-conv-body">' +
          '<div class="ct-conv-top">' +
            '<span class="ct-conv-name">' + name + '</span>' +
            '<span class="ct-conv-time">' + time + '</span>' +
          '</div>' +
          '<div class="ct-conv-preview">' + (preview || 'Belum ada pesan') + '</div>' +
        '</div>' +
        (unread > 0 ? '<span class="ct-conv-unread">' + unread + '</span>' : '') +
      '</div>'
    );
  }).join('');

  chattemanRefreshIcons();
}

// Update badge titik hijau di item daftar pesan secara langsung (tanpa
// render ulang seluruh daftar) begitu ada event presence masuk.
function chattemanUpdateMessageListPresence(guid, isOnline) {
  var $wrap = document.querySelector('.ct-avatar-wrap[data-online-guid="' + CSS.escape(String(guid)) + '"]');
  if (!$wrap) return;
  var $existingBadge = $wrap.querySelector('.ct-online-badge');
  if (isOnline && !$existingBadge) {
    var badge = document.createElement('span');
    badge.className = 'ct-online-badge';
    $wrap.appendChild(badge);
  } else if (!isOnline && $existingBadge) {
    $existingBadge.remove();
  }
}

async function chattemanLoadMessagesList() {
  var $status = document.getElementById('messages-status');
  var $list = document.getElementById('messages-list');
  $list.innerHTML = '<div class="ct-empty-state">Memuat...</div>';

  var result = await chattemanMessagesFetchList();

  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }

  if (!result.ok) {
    $status.textContent = result.message;
    $status.className = 'ct-status-msg chip offline';
    $status.style.display = '';
    $list.innerHTML = '';
    return;
  }

  $status.style.display = 'none';
  chattemanRenderMessagesList(result.conversations);

  var guids = result.conversations.map(function (c) { return c.guid || c.id; }).filter(Boolean);
  chattemanRealtimeCheckPresenceBatch(guids, function (onlineMap) {
    Object.keys(onlineMap).forEach(function (guid) {
      chattemanOnlineMap[guid] = !!onlineMap[guid];
      chattemanUpdateMessageListPresence(guid, !!onlineMap[guid]);
    });
  });

  var totalUnread = result.conversations.reduce(function (sum, c) {
    return sum + (c.unread_count || c.unread || 0);
  }, 0);
  var badgeText = totalUnread > 99 ? '99+' : String(totalUnread);
  [document.getElementById('messages-tab-badge'), document.getElementById('nearby-tab-messages-badge')].forEach(function ($badge) {
    if (!$badge) return;
    if (totalUnread > 0) {
      $badge.textContent = badgeText;
      $badge.style.display = 'flex';
    } else {
      $badge.style.display = 'none';
    }
  });
}

document.getElementById('messages-list').addEventListener('click', function (e) {
  var item = e.target.closest('.ct-conv-item');
  if (!item) return;
  chattemanShowChatPage(item.dataset.guid, item.dataset.name);
});

var chattemanCurrentChatGuid = null;

function chattemanRenderChatBody(messages) {
  var $body = document.getElementById('chat-body');
  var myGuid = (chattemanAuthGetUser() || {}).guid;

  if (!messages || messages.length === 0) {
    $body.innerHTML = '<div class="ct-empty-state"><div class="emoji"><i data-lucide="message-square-plus"></i></div>Mulai obrolan pertamamu.</div>';
    chattemanRefreshIcons();
    return;
  }

  $body.innerHTML = messages.map(function (m) {
    var mine = myGuid && (m.from === myGuid || m.sender === myGuid || m.is_mine);
    var text = chattemanEscapeHtml(m.message || m.text || '');
    var time = chattemanEscapeHtml(m.time || m.created_at || '');
    return (
      '<div class="ct-bubble ' + (mine ? 'me' : 'them') + '">' +
        text +
        (time ? '<span class="ct-bubble-time">' + time + '</span>' : '') +
      '</div>'
    );
  }).join('');

  $body.scrollTop = $body.scrollHeight;
}

async function chattemanOpenConversation(guid, name) {
  chattemanCurrentChatGuid = guid;
  clearTimeout(chattemanTypingHideTimer);
  var $body = document.getElementById('chat-body');
  var $statusEl = document.getElementById('chat-status');
  $body.innerHTML = '<div class="ct-empty-state">Memuat percakapan...</div>';
  $statusEl.textContent = '...';

  chattemanRealtimeCheckPresence(guid, function (isOnline) {
    if (chattemanCurrentChatGuid === guid) {
      chattemanLastKnownPresence = !!isOnline;
      $statusEl.innerHTML = isOnline
        ? '<span class="ct-dot online"></span>Online'
        : '<span class="ct-dot offline"></span>Offline';
    }
  });

  var result = await chattemanMessagesFetchConversation(guid);

  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }

  if (!result.ok) {
    $body.innerHTML = '<div class="ct-empty-state">' + chattemanEscapeHtml(result.message) + '</div>';
    return;
  }

  chattemanRenderChatBody(result.messages);
}

document.getElementById('chat-back-btn').addEventListener('click', function () {
  chattemanCurrentChatGuid = null;
  clearTimeout(chattemanTypingHideTimer);
  chattemanShowMessagesPage();
});

document.getElementById('chat-input').addEventListener('input', function () {
  if (chattemanCurrentChatGuid) {
    chattemanRealtimeEmitTyping(chattemanCurrentChatGuid);
  }
});

document.getElementById('chat-input-row').addEventListener('submit', async function (e) {
  e.preventDefault();
  var $input = document.getElementById('chat-input');
  var text = $input.value.trim();
  if (!text || !chattemanCurrentChatGuid) return;

  $input.value = '';
  var result = await chattemanMessagesSend(chattemanCurrentChatGuid, text);

  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }

  if (!result.ok) {
    chattemanToast(result.message);
    return;
  }

  chattemanOpenConversation(chattemanCurrentChatGuid, document.getElementById('chat-name').textContent);
});

// ================= PROFIL =================
var chattemanOwnProfile = null;

function chattemanApplyProfileToHeader(profile) {
  var name = profile.name || profile.username || 'Pengguna';
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-username').textContent = '@' + (profile.username || '-');
  document.getElementById('profile-bio').textContent = profile.bio || '';
  document.getElementById('stat-friends').textContent = profile.friend_count || (profile.friends ? profile.friends.length : 0) || 0;

  var $avatar = document.getElementById('profile-avatar');
  if (profile.photo) {
    $avatar.innerHTML = '<img src="' + chattemanEscapeHtml(profile.photo) + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />';
  } else {
    $avatar.textContent = chattemanNearbyInitials(name);
  }
}

async function chattemanLoadOwnProfile() {
  var result = await chattemanProfileFetch();

  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }

  if (!result.ok) {
    chattemanToast(result.message);
    return;
  }

  chattemanOwnProfile = result.profile;
  chattemanApplyProfileToHeader(result.profile);

  document.getElementById('edit-name').value = result.profile.name || '';
  document.getElementById('edit-bio').value = result.profile.bio || '';

  chattemanRefreshProfileCounts();
}

async function chattemanRefreshProfileCounts() {
  var friendsResult = await chattemanFriendsFetchList();
  if (friendsResult.ok) document.getElementById('count-friends').textContent = friendsResult.people.length + ' ›';

  var requestsResult = await chattemanFriendsFetchRequests();
  if (requestsResult.ok) document.getElementById('count-requests').textContent = requestsResult.people.length + ' ›';

  var sentResult = await chattemanFriendsFetchSent();
  if (sentResult.ok) document.getElementById('count-sent').textContent = sentResult.people.length + ' ›';

  var blockedResult = await chattemanBlockFetchList();
  if (blockedResult.ok) document.getElementById('count-blocked').textContent = blockedResult.people.length + ' ›';
}

function chattemanCloseProfilePanels() {
  document.getElementById('profile-panel').style.display = 'none';
  document.getElementById('edit-profile-panel').style.display = 'none';
}

function chattemanRenderPeopleList(containerId, people, kind) {
  var $list = document.getElementById(containerId);

  if (!people || people.length === 0) {
    $list.innerHTML = '<div class="ct-empty-state">Belum ada data di sini.</div>';
    return;
  }

  $list.innerHTML = people.map(function (p) {
    var name = chattemanEscapeHtml(p.name || p.username || 'Pengguna');
    var guid = p.guid || p.id || '';
    var avatar = p.photo
      ? '<img class="ct-avatar" src="' + chattemanEscapeHtml(p.photo) + '" alt="" />'
      : '<div class="ct-avatar">' + chattemanNearbyInitials(name) + '</div>';

    var actionsHtml = '';
    if (kind === 'friends') {
      actionsHtml = '<button class="button button-small" data-action="remove" data-guid="' + guid + '">Hapus</button>';
    } else if (kind === 'requests') {
      actionsHtml =
        '<button class="button button-small ct-btn-primary" data-action="add" data-guid="' + guid + '">Terima</button>' +
        '<button class="button button-small" data-action="remove" data-guid="' + guid + '">Tolak</button>';
    } else if (kind === 'sent') {
      actionsHtml = '<button class="button button-small" data-action="remove" data-guid="' + guid + '">Batalkan</button>';
    } else if (kind === 'blocked') {
      actionsHtml = '<button class="button button-small" data-action="unblock" data-guid="' + guid + '">Buka Blokir</button>';
    }

    return (
      '<div class="ct-conv-item">' +
        avatar +
        '<div class="ct-conv-body"><span class="ct-conv-name">' + name + '</span></div>' +
        '<div class="ct-people-actions">' + actionsHtml + '</div>' +
      '</div>'
    );
  }).join('');
}

var PROFILE_PANEL_TITLES = {
  friends: 'Teman',
  requests: 'Permintaan Masuk',
  sent: 'Terkirim',
  blocked: 'Diblokir',
};

async function chattemanOpenProfilePanel(kind) {
  chattemanCloseProfilePanels();
  document.getElementById('profile-panel').style.display = '';
  document.getElementById('profile-panel-title').textContent = PROFILE_PANEL_TITLES[kind] || '';
  document.getElementById('profile-panel-list').innerHTML = '<div class="ct-empty-state">Memuat...</div>';
  document.getElementById('profile-panel-list').dataset.kind = kind;

  var result;
  if (kind === 'friends') result = await chattemanFriendsFetchList();
  else if (kind === 'requests') result = await chattemanFriendsFetchRequests();
  else if (kind === 'sent') result = await chattemanFriendsFetchSent();
  else if (kind === 'blocked') result = await chattemanBlockFetchList();

  if (!result) return;

  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }

  chattemanRenderPeopleList('profile-panel-list', result.people, kind);
}

document.getElementById('menu-friends').addEventListener('click', function () { chattemanOpenProfilePanel('friends'); });
document.getElementById('menu-requests').addEventListener('click', function () { chattemanOpenProfilePanel('requests'); });
document.getElementById('menu-sent').addEventListener('click', function () { chattemanOpenProfilePanel('sent'); });
document.getElementById('menu-blocked').addEventListener('click', function () { chattemanOpenProfilePanel('blocked'); });
document.getElementById('profile-panel-close').addEventListener('click', chattemanCloseProfilePanels);

document.getElementById('profile-panel-list').addEventListener('click', async function (e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) return;
  var guid = btn.dataset.guid;
  var action = btn.dataset.action;
  var kind = this.dataset.kind;

  btn.disabled = true;

  var result;
  if (kind === 'blocked') {
    result = await chattemanBlockAction('remove', guid);
  } else {
    result = await chattemanFriendAction(action, guid);
  }

  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }

  chattemanToast(result.message);
  chattemanOpenProfilePanel(kind);
  chattemanRefreshProfileCounts();
});

// ---------- Upload foto profil ----------
document.getElementById('avatar-edit-btn').addEventListener('click', function () {
  document.getElementById('avatar-file-input').click();
});

document.getElementById('avatar-file-input').addEventListener('change', async function () {
  var file = this.files && this.files[0];
  this.value = ''; // reset supaya bisa pilih file yang sama lagi nanti
  if (!file) return;

  chattemanToast('Mengunggah foto...');
  var result = await chattemanProfileUploadAvatar(file);

  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }

  chattemanToast(result.message);
  if (result.ok) chattemanLoadOwnProfile();
});

// ---------- Edit profil ----------
document.getElementById('menu-edit-profile').addEventListener('click', function () {
  chattemanCloseProfilePanels();
  document.getElementById('edit-profile-panel').style.display = '';
});
document.getElementById('edit-profile-close').addEventListener('click', chattemanCloseProfilePanels);

document.getElementById('edit-profile-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  var $status = document.getElementById('edit-profile-status');
  var name = document.getElementById('edit-name').value.trim();
  var bio = document.getElementById('edit-bio').value.trim();

  $status.style.display = 'none';

  var fields = { name: name, bio: bio };
  // Backend profile/edit sebagian butuh field firstname & email dikirim
  // ulang apa adanya (lihat catatan di main.js versi web) -- kalau data
  // itu ada di profil yang sudah dimuat, sertakan supaya tidak ke-reset.
  if (chattemanOwnProfile && chattemanOwnProfile.email) fields.email = chattemanOwnProfile.email;
  if (chattemanOwnProfile && chattemanOwnProfile.firstname) fields.firstname = name;

  var result = await chattemanProfileEdit(fields);

  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }

  $status.textContent = result.message;
  $status.className = 'ct-status-msg chip ' + (result.ok ? 'online' : 'offline');
  $status.style.display = '';

  if (result.ok) {
    chattemanToast(result.message);
    chattemanLoadOwnProfile();
  }
});

var chattemanTypingHideTimer = null;
function chattemanShowTypingIndicator() {
  var $statusEl = document.getElementById('chat-status');
  $statusEl.innerHTML = '<span class="ct-typing-dots"><span></span><span></span><span></span></span>mengetik...';
  $statusEl.classList.add('is-typing');

  var $body = document.getElementById('chat-body');
  if (!document.getElementById('typing-bubble')) {
    var bubble = document.createElement('div');
    bubble.id = 'typing-bubble';
    bubble.className = 'ct-bubble them typing';
    bubble.innerHTML = '<span class="ct-typing-dots"><span></span><span></span><span></span></span>';
    $body.appendChild(bubble);
    $body.scrollTop = $body.scrollHeight;
  }

  clearTimeout(chattemanTypingHideTimer);
  chattemanTypingHideTimer = setTimeout(chattemanHideTypingIndicator, 3000);
}

function chattemanHideTypingIndicator() {
  var $statusEl = document.getElementById('chat-status');
  $statusEl.classList.remove('is-typing');
  $statusEl.innerHTML = chattemanLastKnownPresence
    ? '<span class="ct-dot online"></span>Online'
    : '<span class="ct-dot offline"></span>Offline';

  var $bubble = document.getElementById('typing-bubble');
  if ($bubble) $bubble.remove();
}

var chattemanLastKnownPresence = false;

chattemanRealtimeOnTyping(function (data) {
  var fromGuid = data && (data.from || data.guid);
  if (!chattemanCurrentChatGuid || String(fromGuid) !== String(chattemanCurrentChatGuid)) return;
  if ($pageChat.style.display === 'none') return;
  chattemanShowTypingIndicator();
});

chattemanRealtimeOnPresence(function (data) {
  if (!data) return;
  var guid = data.guid || data.id;
  if (!guid) return;

  chattemanOnlineMap[guid] = !!data.online;
  chattemanUpdateMessageListPresence(guid, !!data.online);

  if (chattemanCurrentChatGuid && String(guid) === String(chattemanCurrentChatGuid)) {
    chattemanLastKnownPresence = !!data.online;
    var $statusEl = document.getElementById('chat-status');
    if ($statusEl && !$statusEl.classList.contains('is-typing')) {
      $statusEl.innerHTML = data.online
        ? '<span class="ct-dot online"></span>Online'
        : '<span class="ct-dot offline"></span>Offline';
    }
  }
});

// ---------- Realtime: pesan masuk otomatis update chat & badge ----------
chattemanRealtimeOnNewMessage(function (msg) {
  var fromGuid = msg.from || msg.sender || msg.guid;

  // Kalau lagi buka percakapan sama orang ini, langsung muat ulang isi chat
  if ($pageChat.style.display !== 'none' && chattemanCurrentChatGuid && String(fromGuid) === String(chattemanCurrentChatGuid)) {
    chattemanOpenConversation(chattemanCurrentChatGuid, document.getElementById('chat-name').textContent);
  }

  // Refresh daftar pesan + badge unread di tab bar (aman dipanggil walau
  // halaman Pesan sedang tidak aktif, cuma update data di background)
  chattemanLoadMessagesList();
});

// ---------- Bootstrap ----------
document.addEventListener('DOMContentLoaded', function () {
  chattemanRefreshIcons();
  chattemanUpdateNetworkStatus();

  if (chattemanAuthIsLoggedIn()) {
    chattemanRealtimeConnect();
    chattemanShowNearbyPage();
    chattemanLoadNearbyList();
  } else {
    chattemanShowLoginPage();
  }
});
