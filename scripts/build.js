/**
 * ChatTeman - build.js
 *
 * Script build sederhana (TANPA bundler seperti Webpack/Vite).
 * Tugasnya cuma satu: menyusun folder www/ berisi semua file statis
 * (HTML/CSS/JS lokal) yang akan dibundle Capacitor ke dalam APK.
 *
 * Langkah:
 * 1. Hapus & buat ulang folder www/
 * 2. Copy index.html + src/ ke www/
 * 3. Cari file bundle Framework7 (css & js) dan framework7-icons
 *    di dalam node_modules, lalu copy ke www/assets/framework7/
 *
 * Dibuat tanpa dependency tambahan (cuma pakai modul bawaan Node.js)
 * supaya tetap sederhana dan mudah dipahami.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const NODE_MODULES = path.join(ROOT, 'node_modules');

function log(msg) {
  console.log(`[build] ${msg}`);
}

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// Cari semua file di dalam `dir` yang namanya cocok dengan regex,
// tanpa masuk ke dalam folder node_modules bersarang yang tidak perlu.
function findFiles(dir, regex, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch (e) {
      continue;
    }
    if (stat.isDirectory()) {
      findFiles(full, regex, results);
    } else if (regex.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

function copyFramework7Assets() {
  const destDir = path.join(WWW, 'assets', 'framework7');
  fs.mkdirSync(destDir, { recursive: true });

  // Framework7 core bundle (css + js, sudah termasuk semua komponen)
  const f7Dir = path.join(NODE_MODULES, 'framework7');
  const f7Css = findFiles(f7Dir, /^framework7-bundle(\.min)?\.css$/i);
  const f7Js = findFiles(f7Dir, /^framework7-bundle(\.min)?\.js$/i);

  if (f7Css.length === 0 || f7Js.length === 0) {
    throw new Error(
      'Tidak menemukan file bundle Framework7 di node_modules/framework7. ' +
      'Pastikan `npm install` sudah dijalankan.'
    );
  }

  fs.copyFileSync(f7Css[0], path.join(destDir, 'framework7-bundle.min.css'));
  fs.copyFileSync(f7Js[0], path.join(destDir, 'framework7-bundle.min.js'));
  log(`Framework7 CSS disalin dari ${path.relative(ROOT, f7Css[0])}`);
  log(`Framework7 JS disalin dari ${path.relative(ROOT, f7Js[0])}`);

  // Framework7 icons (font icon, opsional tapi biasa dipakai bareng Framework7)
  const iconsDir = path.join(NODE_MODULES, 'framework7-icons');
  const iconsCss = findFiles(iconsDir, /^framework7-icons\.css$/i);
  if (iconsCss.length > 0) {
    fs.copyFileSync(iconsCss[0], path.join(destDir, 'framework7-icons.css'));
    // Copy folder fonts yang biasanya ada di samping file css icons
    const iconsRootDir = path.dirname(iconsCss[0]);
    const fontsDir = path.join(iconsRootDir, 'fonts');
    if (fs.existsSync(fontsDir)) {
      copyRecursive(fontsDir, path.join(destDir, 'fonts'));
    }
    log(`Framework7 Icons disalin dari ${path.relative(ROOT, iconsCss[0])}`);
  } else {
    log('Framework7 Icons tidak ditemukan, dilewati (opsional).');
  }
}

function copySocketIoAssets() {
  const destDir = path.join(WWW, 'assets', 'socketio');
  fs.mkdirSync(destDir, { recursive: true });

  const socketDir = path.join(NODE_MODULES, 'socket.io-client');
  const socketJs = findFiles(socketDir, /^socket\.io(\.min)?\.js$/i);

  if (socketJs.length === 0) {
    log('PERINGATAN: bundle socket.io-client tidak ditemukan di node_modules, chat real-time dilewati.');
    return;
  }

  fs.copyFileSync(socketJs[0], path.join(destDir, 'socket.io.min.js'));
  log(`Socket.IO client disalin dari ${path.relative(ROOT, socketJs[0])}`);
}

function copyLucideAssets() {
  const destDir = path.join(WWW, 'assets', 'lucide');
  fs.mkdirSync(destDir, { recursive: true });

  const lucideDir = path.join(NODE_MODULES, 'lucide');
  const lucideJs = findFiles(lucideDir, /^lucide\.min\.js$/i);

  if (lucideJs.length === 0) {
    log('PERINGATAN: bundle lucide (lucide.min.js) tidak ditemukan di node_modules, ikon dilewati.');
    return;
  }

  fs.copyFileSync(lucideJs[0], path.join(destDir, 'lucide.min.js'));
  log(`Lucide icons disalin dari ${path.relative(ROOT, lucideJs[0])}`);
}

function main() {
  log('Membersihkan folder www/ ...');
  rmrf(WWW);
  fs.mkdirSync(WWW, { recursive: true });

  log('Menyalin index.html ...');
  copyRecursive(path.join(ROOT, 'index.html'), path.join(WWW, 'index.html'));

  log('Menyalin folder src/ ...');
  copyRecursive(path.join(ROOT, 'src'), WWW);

  log('Menyalin bundle Framework7 dari node_modules ...');
  copyFramework7Assets();

  log('Menyalin bundle Socket.IO client dari node_modules ...');
  copySocketIoAssets();

  log('Menyalin bundle Lucide icons dari node_modules ...');
  copyLucideAssets();

  log('Selesai. Folder www/ siap dipakai Capacitor (webDir).');
}

main();
