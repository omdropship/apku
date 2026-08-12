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
   chattemanNearbyUpdateLocation, chattemanNearbyFetchList, chattemanNearbyLikeUser,
   chattemanMessagesFetchList, chattemanMessagesFetchConversation, chattemanMessagesSend,
   chattemanProfileFetch, chattemanProfileEdit, chattemanFriendAction,
   chattemanFriendsFetchList, chattemanFriendsFetchRequests, chattemanFriendsFetchSent,
   chattemanBlockAction, chattemanBlockFetchList,
   chattemanToast, chattemanEscapeHtml */

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

var ALL_PAGES = [$pageLogin, $pageRegister, $pageNearby, $pageMessages, $pageChat, $pageProfile];

function hideAllPages() {
  ALL_PAGES.forEach(function (el) { el.style.display = 'none'; });
}

function setActiveTab(name) {
  document.querySelectorAll('.ct-tab').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.tab === name);
  });
}

function chattemanShowLoginPage() {
  hideAllPages();
  $pageLogin.style.display = '';
  $tabbar.style.display = 'none';
}

function chattemanShowRegisterPage() {
  hideAllPages();
  $pageRegister.style.display = '';
  $tabbar.style.display = 'none';
}

function chattemanShowNearbyPage() {
  hideAllPages();
  $pageNearby.style.display = '';
  $tabbar.style.display = 'flex';
  setActiveTab('nearby');
}

function chattemanShowMessagesPage() {
  hideAllPages();
  $pageMessages.style.display = '';
  $tabbar.style.display = 'flex';
  setActiveTab('messages');
  chattemanLoadMessagesList();
}

function chattemanShowProfilePage() {
  hideAllPages();
  $pageProfile.style.display = '';
  $tabbar.style.display = 'flex';
  setActiveTab('profile');
  chattemanCloseProfilePanels();
  chattemanLoadOwnProfile();
}

function chattemanShowChatPage(guid, name) {
  hideAllPages();
  $pageChat.style.display = '';
  $tabbar.style.display = 'none';
  document.getElementById('chat-name').textContent = name || 'Pengguna';
  var $avatar = document.getElementById('chat-avatar');
  $avatar.textContent = (name || '?').charAt(0).toUpperCase();
  chattemanOpenConversation(guid, name);
}

document.querySelectorAll('.ct-tab').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var tab = btn.dataset.tab;
    if (tab === 'nearby') chattemanShowNearbyPage();
    if (tab === 'messages') chattemanShowMessagesPage();
    if (tab === 'profile') chattemanShowProfilePage();
  });
});

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

document.getElementById('go-to-register').addEventListener('click', function (e) {
  e.preventDefault();
  chattemanShowRegisterPage();
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
  chattemanAuthLogout();
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  chattemanShowLoginPage();
});

// ================= NEARBY (RADAR / SWIPE) =================
var chattemanNearbyQueue = [];

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

document.getElementById('refresh-list-btn').addEventListener('click', function () {
  chattemanLoadNearbyList();
});

function chattemanNearbyInitials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

function chattemanRenderSwipeStack() {
  var $stack = document.getElementById('nearby-swipe-stack');
  var user = chattemanNearbyQueue[0];

  if (!user) {
    $stack.innerHTML =
      '<div class="ct-swipe-empty">' +
        '<div class="emoji">🔭</div>' +
        '<strong>Belum ada orang baru di sekitarmu</strong>' +
        '<p>Coba perbarui lokasi atau muat ulang daftar.</p>' +
      '</div>';
    return;
  }

  var name = chattemanEscapeHtml(user.name || user.username || 'Pengguna');
  var distance = (typeof user.distance === 'number') ? user.distance + ' km' : '';
  var age = user.age ? (user.age + ' th') : '';
  var online = user.online
    ? '<span class="online-dot"></span> Online'
    : (distance || age ? '' : 'Offline');
  var photoHtml = user.photo
    ? '<img src="' + chattemanEscapeHtml(user.photo) + '" alt="" />'
    : chattemanNearbyInitials(name);

  $stack.innerHTML =
    '<div class="ct-swipe-card">' +
      '<div class="ct-card-photo">' + photoHtml + '</div>' +
      '<div class="ct-card-gradient"></div>' +
      '<div class="ct-card-info">' +
        '<div class="name-row"><strong>' + name + '</strong>' + (age ? '<span>' + age + '</span>' : '') + '</div>' +
        '<div class="meta">' + [distance, online].filter(Boolean).join(' &middot; ') + '</div>' +
      '</div>' +
    '</div>';
}

async function chattemanLoadNearbyList() {
  var $status = document.getElementById('nearby-status');
  var $stack = document.getElementById('nearby-swipe-stack');

  $stack.innerHTML = '<div class="ct-swipe-empty"><div class="emoji">⏳</div>Memuat...</div>';

  var result = await chattemanNearbyFetchList({ radius: 25 });

  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }

  if (!result.ok) {
    $status.textContent = result.message;
    $status.className = 'ct-status-msg chip offline';
    $status.style.display = '';
    chattemanNearbyQueue = [];
    chattemanRenderSwipeStack();
    return;
  }

  $status.style.display = 'none';
  chattemanNearbyQueue = result.users.slice();
  chattemanRenderSwipeStack();
}

document.getElementById('swipe-pass-btn').addEventListener('click', function () {
  if (!chattemanNearbyQueue.length) return;
  chattemanNearbyQueue.shift();
  chattemanRenderSwipeStack();
});

document.getElementById('swipe-like-btn').addEventListener('click', async function () {
  var user = chattemanNearbyQueue[0];
  if (!user) return;
  var guid = user.guid || user.id;

  chattemanNearbyQueue.shift();
  chattemanRenderSwipeStack();

  if (!guid) return;
  var result = await chattemanNearbyLikeUser(guid);
  if (result.__unauthorized) {
    chattemanAuthClearSession();
    chattemanShowLoginPage();
    return;
  }
  chattemanToast(result.ok ? 'Permintaan pertemanan terkirim' : result.message);
});

// ================= PESAN (DAFTAR + CHAT) =================
function chattemanRenderMessagesList(conversations) {
  var $list = document.getElementById('messages-list');

  if (!conversations || conversations.length === 0) {
    $list.innerHTML =
      '<div class="ct-empty-state"><div class="emoji">💬</div>Belum ada percakapan.<br/>Mulai dari kartu di halaman Terdekat.</div>';
    return;
  }

  $list.innerHTML = conversations.map(function (c) {
    var name = chattemanEscapeHtml(c.name || c.username || 'Pengguna');
    var guid = c.guid || c.id || '';
    var preview = chattemanEscapeHtml(c.last_message || c.message || '');
    var time = chattemanEscapeHtml(c.time || c.last_time || '');
    var unread = c.unread_count || c.unread || 0;
    var avatar = c.photo
      ? '<img class="ct-avatar" src="' + chattemanEscapeHtml(c.photo) + '" alt="" />'
      : '<div class="ct-avatar">' + chattemanNearbyInitials(name) + '</div>';

    return (
      '<div class="ct-conv-item" data-guid="' + chattemanEscapeHtml(guid) + '" data-name="' + name + '">' +
        avatar +
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

  var totalUnread = result.conversations.reduce(function (sum, c) {
    return sum + (c.unread_count || c.unread || 0);
  }, 0);
  var $badge = document.getElementById('messages-tab-badge');
  if (totalUnread > 0) {
    $badge.textContent = totalUnread > 99 ? '99+' : String(totalUnread);
    $badge.style.display = 'flex';
  } else {
    $badge.style.display = 'none';
  }
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
    $body.innerHTML = '<div class="ct-empty-state"><div class="emoji">👋</div>Mulai obrolan pertamamu.</div>';
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
  var $body = document.getElementById('chat-body');
  $body.innerHTML = '<div class="ct-empty-state">Memuat percakapan...</div>';

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
  chattemanShowMessagesPage();
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
