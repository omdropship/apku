# ChatTeman

Kerangka project kosong: **GitHub → GitHub Actions → Capacitor → Gradle → APK Android**.

Tahap ini **belum ada fitur** (login, chat, nearby, dll). Tujuannya cuma satu:
APK kosong berhasil dibuat dan bisa di-install di HP Android, dan tetap bisa
dibuka saat HP offline (karena semua HTML/CSS/JS dibundle lokal ke dalam APK,
bukan membuka `https://chatteman.com`).

## Struktur folder

```
ChatTeman/
├── .github/workflows/android.yml   # GitHub Actions: build APK otomatis
├── scripts/build.js                # Susun folder www/ (tanpa bundler)
├── src/
│   ├── css/app.css                 # Style dasar + indikator online/offline
│   ├── css/theme.css               # TODO tema (belum diisi)
│   ├── js/app.js                   # Init Framework7 + cek online/offline
│   ├── js/{api,auth,nearby,messages,utils}.js  # TODO placeholder
│   ├── pages/{home,nearby,messages,profile}.html # TODO placeholder (belum di-routing)
│   └── assets/{icons,images}/      # kosong, siap dipakai nanti
├── index.html                      # Entry point Framework7 (lokal)
├── package.json
├── capacitor.config.json           # webDir: "www", TANPA server.url
├── .gitignore
└── README.md
```

Folder `www/` (hasil build) dan `android/` (project native) **tidak di-commit**
ke Git — keduanya dibuat otomatis setiap kali workflow jalan, supaya repo tetap
ringan dan tidak ada risiko file generated yang basi/ketinggalan versi.

## Kenapa strukturnya begini

- **Tanpa bundler (Webpack/Vite).** `scripts/build.js` cuma menyalin file
  `index.html` + `src/` ke `www/`, lalu menyalin bundle Framework7
  (`framework7-bundle.min.css/js`) dari `node_modules` ke
  `www/assets/framework7/`. Ini sengaja dibuat sesederhana mungkin sesuai
  permintaan — tidak ada build step rumit yang bisa jadi sumber error.
- **`android/` tidak di-commit**, dibuat via `npx cap add android` di setiap
  run CI. Ini menghindari risiko file Gradle/Gradle-Wrapper yang saya tulis
  manual jadi tidak sinkron dengan versi Capacitor yang dipakai — dengan cara
  ini, Capacitor CLI sendiri yang men-generate project Android yang valid dan
  konsisten dengan versi dependency di `package.json`.
- **Versi dependency pakai caret (`^`)**, mengarah ke rilis stabil terbaru
  dari major version yang teruji kompatibel:
  - Node.js 20 LTS
  - Capacitor 6.x (perlu JDK 17 & Android Gradle Plugin 8.x — otomatis
    ditentukan oleh `cap add android`)
  - Framework7 8.x (dipakai lewat bundle siap pakai, tanpa perlu bundler)
  - JDK 17 (Temurin), Android SDK via `android-actions/setup-android`

## ⚠️ Catatan penting soal verifikasi

Saya menyusun dan memeriksa semua file ini (struktur, sintaks JSON/JS/XML,
path antar-file) di lingkungan sandbox **tanpa akses internet**, jadi saya
**tidak bisa menjalankan** `npm install`, `npx cap sync`, atau
`./gradlew assembleDebug` secara nyata di sini untuk membuktikan build-nya
100% hijau. Build sesungguhnya akan tervalidasi saat GitHub Actions jalan
(yang punya akses internet penuh). Kalau ada error versi/dependency saat CI
jalan, kirim log error-nya ke saya dan saya bantu perbaiki.

## Cara deploy

1. Buat repository baru di GitHub (public/private, bebas).
2. Upload seluruh isi folder `ChatTeman/` ini ke repo tersebut (via `git push`
   atau upload manual).
3. Buka tab **Actions** di repo GitHub.
4. Jalankan workflow **"Build Android APK"** (klik *Run workflow*, atau cukup
   push ke branch `main` — workflow otomatis jalan).
5. Tunggu sampai semua step selesai (biasanya beberapa menit).
6. Buka run yang sudah selesai → bagian **Artifacts** → download `app-debug`
   (isinya `app-debug.apk`).
7. Pindahkan APK ke HP Android, izinkan install dari sumber tidak dikenal,
   lalu install. Coba buka dalam kondisi HP offline untuk memastikan UI lokal
   tetap tampil.

Kalau tahap ini sudah sukses, kabari saya — kita lanjut isi UI Framework7
sedikit demi sedikit sesuai instruksi berikutnya.
