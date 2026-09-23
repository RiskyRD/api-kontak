# Aplikasi Kontak — Laravel API & React Frontend

Proyek ini adalah aplikasi manajemen kontak dengan autentikasi token. Backend berada di folder `kontak-api` dan frontend berada di folder `frontend`.

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Backend | PHP 8.3+, Laravel 13, Laravel Sanctum |
| Database | SQLite |
| Frontend | React 19, Vite |
| Autentikasi | Bearer token (Sanctum) |

## Prasyarat

Pasang perangkat berikut terlebih dahulu:

- PHP 8.3 atau lebih baru
- Composer
- Node.js dan npm

Periksa instalasinya dari PowerShell:

```powershell
php -v
composer -V
node -v
npm -v
```

## Menjalankan Proyek

Jalankan backend dan frontend pada dua terminal terpisah.

### 1. Siapkan dan jalankan backend

Masuk ke folder backend dan instal dependensi PHP:

```powershell
cd kontak-api
composer install
```

Salin konfigurasi lingkungan jika file `.env` belum ada, lalu buat application key:

```powershell
Copy-Item .env.example .env
php artisan key:generate
```

Proyek menggunakan SQLite. Pastikan konfigurasi berikut ada di `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=api_kontak
DB_USERNAME=root
DB_PASSWORD=
```

File database yang digunakan adalah `database/database.sqlite`. Jalankan migration untuk membuat tabel `users`, `personal_access_tokens`, `contacts`, dan `contact_phones`:

```powershell
php artisan migrate
```

Nyalakan server Laravel:

```powershell
php artisan serve
```

API kini tersedia di `http://127.0.0.1:8000/api`.

### 2. Siapkan dan jalankan frontend

Buka terminal kedua dari folder utama proyek, lalu jalankan:

```powershell
cd frontend
npm install
```

Buat file `frontend/.env` dan isi alamat API berikut:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Jalankan development server:

```powershell
npm run dev
```

Buka alamat yang ditampilkan Vite (biasanya `http://localhost:5173`) di browser. Daftarkan akun, login, lalu kelola kontak.

Untuk membuat versi produksi frontend:

```powershell
npm run build
```

Hasil build dibuat di folder `frontend/dist`.

## Alur Pembuatan Backend API

Bagian ini menjelaskan susunan kode API yang ada pada proyek.

### 1. Membuat proyek dan memasang Sanctum

```powershell
composer create-project laravel/laravel kontak-api
cd kontak-api
composer require laravel/sanctum
php artisan install:api
```

Sanctum menyediakan tabel token dan middleware `auth:sanctum` untuk rute yang hanya dapat dipanggil setelah login.

### 2. Membuat model dan migration kontak

```powershell
php artisan make:model Contact -m
php artisan make:model ContactPhone -m
```

Migration `contacts` menyimpan `nama`, `alamat`, dan `tanggal_lahir`. Migration `contact_phones` menyimpan `jenis`, `nomor_telepon`, serta foreign key `kontak_id` yang mengarah ke kontak. Penghapusan kontak akan menghapus nomor telepon terkait melalui `onDelete('cascade')`.

Relasi Eloquent didefinisikan sebagai berikut:

```php
// app/Models/Contact.php
public function phones() {
    return $this->hasMany(ContactPhone::class, 'kontak_id');
}

// app/Models/ContactPhone.php
public function contact() {
    return $this->belongsTo(Contact::class, 'kontak_id');
}
```

Setelah migration siap, jalankan `php artisan migrate`.

### 3. Membuat controller autentikasi

```powershell
php artisan make:controller Api/AuthController
```

`AuthController` melakukan tiga hal utama:

1. `register`: validasi nama, email unik, dan password minimal enam karakter; membuat user; lalu menghasilkan token Sanctum.
2. `login`: memeriksa email serta password dengan `Auth::attempt`, kemudian menghasilkan token baru.
3. `logout`: seharusnya menghapus token yang sedang digunakan.

Untuk melengkapi endpoint logout yang sudah didaftarkan, tambahkan method ini pada `AuthController`:

```php
public function logout(Request $request) {
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Logout Berhasil']);
}
```

### 4. Membuat controller kontak

```powershell
php artisan make:controller Api/ContactController --api
```

Controller yang ada memakai `Contact::with('phones')` agar data kontak dan semua nomor teleponnya dikirim bersamaan. Saat menyimpan, payload divalidasi dan array `phones` dibuat menggunakan `createMany()`.

### 5. Mendaftarkan rute API

Rute berada di `kontak-api/routes/api.php`. Rute register dan login bersifat publik. Rute kontak dan logout dibungkus middleware `auth:sanctum`, sehingga header token wajib dikirim.

```php
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('contacts', ContactController::class);
});
```

## Endpoint API

Gunakan header berikut pada seluruh endpoint yang membutuhkan autentikasi:

```http
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
```

| Method | Endpoint | Autentikasi | Keterangan |
| --- | --- | --- | --- |
| POST | `/api/register` | Tidak | Membuat akun dan token |
| POST | `/api/login` | Tidak | Login dan memperoleh token |
| POST | `/api/logout` | Ya | Logout (tambahkan method `logout` seperti di atas) |
| GET | `/api/contacts` | Ya | Daftar kontak beserta nomor telepon |
| POST | `/api/contacts` | Ya | Menambah kontak |
| GET | `/api/contacts/{id}` | Ya | Detail kontak |
| DELETE | `/api/contacts/{id}` | Ya | Menghapus kontak |

Contoh register:

```json
POST /api/register
{
  "name": "Budi",
  "email": "budi@example.com",
  "password": "rahasia"
}
```

Contoh membuat kontak:

```json
POST /api/contacts
{
  "nama": "Budi Santoso",
  "alamat": "Jl. Merdeka No. 10",
  "tanggal_lahir": "2004-05-20",
  "phones": [
    { "jenis": "HP", "nomor_telepon": "08123456789" },
    { "jenis": "Rumah", "nomor_telepon": "021123456" }
  ]
}
```

> Catatan: `Route::apiResource()` juga mendaftarkan route `PUT/PATCH /api/contacts/{id}`, tetapi method `update()` belum ada pada `ContactController`. Endpoint pembaruan belum dapat digunakan sampai method tersebut diimplementasikan.

## Alur Pembuatan Frontend

### 1. Membuat aplikasi React dengan Vite

```powershell
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

Titik masuk aplikasi ada di `src/main.jsx`, yang merender komponen utama `App`.

### 2. Menyimpan alamat API pada environment variable

Alamat API tidak ditulis langsung di komponen. File `src/api.js` mengambil nilai `VITE_API_URL` dan membuat fungsi `apiFetch()`.

```js
const API_URL = import.meta.env.VITE_API_URL;
```

Dengan cara ini, alamat API dapat diganti melalui `.env` tanpa mengubah kode React. Setelah mengubah `.env`, restart `npm run dev`.

### 3. Membuat helper request terautentikasi

`apiFetch()` membaca token dari `localStorage`, memasangnya sebagai header `Authorization`, memproses JSON, dan mengubah response gagal menjadi error JavaScript.

```js
const token = localStorage.getItem('token');
headers: {
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
}
```

### 4. Membuat halaman autentikasi

Di `src/App.jsx`, state `view` menentukan apakah form menampilkan Login atau Register. Ketika form dikirim, aplikasi memanggil `/login` atau `/register`, lalu menyimpan `data.token` ke `localStorage`. State `token` berubah dan dashboard kontak tampil.

### 5. Membuat dashboard kontak

Saat token tersedia, `useEffect` memanggil `loadContacts()` untuk mengambil `GET /contacts`. Form tambah kontak mengirim data utama dan array nomor telepon opsional. Pengguna dapat menambah atau menghapus baris nomor telepon sebelum menyimpan kontak. Setiap kartu kontak memiliki tombol Delete yang memanggil `DELETE /contacts/{id}`.

### 6. Menambahkan tampilan dan validasi

Styling berada di `src/App.css` serta `src/index.css`. Error dari API ditampilkan lewat state `error`, misalnya ketika login gagal atau data kontak belum lengkap.

## Struktur Folder

```text
.
├── kontak-api/
│   ├── app/Http/Controllers/Api/  # AuthController dan ContactController
│   ├── app/Models/                # Contact dan ContactPhone
│   ├── database/migrations/        # Struktur tabel SQLite
│   └── routes/api.php              # Endpoint API
└── frontend/
    ├── src/App.jsx                 # UI autentikasi dan dashboard kontak
    ├── src/api.js                  # Helper fetch API dan Bearer token
    └── src/App.css                 # Styling aplikasi
```

## Troubleshooting

- **Frontend menampilkan `Request failed` atau gagal menghubungi API:** pastikan `php artisan serve` aktif dan `VITE_API_URL` tepat.
- **Muncul masalah CORS di browser:** pastikan API menerima origin `http://localhost:5173`. Bila konfigurasi CORS belum tersedia, publish dengan `php artisan config:publish cors`, lalu masukkan origin tersebut ke `allowed_origins` dalam `config/cors.php`.
- **Database atau tabel belum ada:** jalankan `php artisan migrate` dari folder `kontak-api`.
- **Token tidak berlaku:** logout, hapus `token` dari Local Storage browser, lalu login kembali.
