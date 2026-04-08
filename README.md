# Web Parking System

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=22&pause=1400&color=2563EB&center=true&vCenter=true&width=760&lines=Web+Parking+System+%F0%9F%9A%97;Ticket+%E2%86%92+Payment+%E2%86%92+Gate+Open+%F0%9F%85%BF%EF%B8%8F)](https://git.io/typing-svg)

Mini project alur parkir berbasis **Next.js** dan **PostgreSQL**.
Mencakup pembuatan tiket, pembuatan QR/PDF tiket, simulasi pembayaran, dan proses keluar.

## Features

- Generate tiket parkir dengan `ticket_code` unik
- Simpan `entry_time`, `exit_time`, dan `total_price` di PostgreSQL
- Generate QR code dari data tiket
- Download tiket PDF (Ticket Code, Entry Time, QR)
- Halaman `/pay` untuk upload gambar QR dan decode
- Input `ticket_code` manual sebagai fallback jika scan QR gagal
- Aturan tarif:
  - Jam pertama: `5000`
  - Jam berikutnya: `3000/jam`
- Status akhir:
  - **Pembayaran Berhasil**
  - **Pintu Terbuka**

## Demo Flow

`🚗 Entry` -> `🎟️ Ticket` -> `📱 QR/PDF` -> `💳 Payment` -> `🚪 Gate Open`

### Aturan Input Pembayaran (Mini Project)

- Tiket didistribusikan dalam bentuk **PDF yang diunduh** (tanpa alur print fisik).
- Di halaman `/pay`, upload **gambar QR** (disarankan screenshot QR dari PDF tiket).
- Upload file PDF langsung memang tidak dipakai pada scope mini project ini.
- Jika QR tidak terdeteksi, masukkan `ticket_code` secara manual.

### Batasan Sistem

- Scanner QR di halaman `/pay` menerima **file gambar**.
- Untuk scope mini project, pembayaran menggunakan gambar QR dari hasil screenshot PDF tiket.
- Pemindaian QR langsung dari file PDF tidak diaktifkan.
- Fallback resmi: input manual `ticket_code`.

## Alur Penggunaan

1. Klik **Buat Tiket Masuk** di halaman utama.
2. Sistem otomatis mengunduh tiket dalam format PDF.
3. Buka halaman `/pay`, lalu upload gambar QR (screenshot dari PDF) atau isi `ticket_code` manual.
4. Klik **Hitung Durasi dan Tarif**, lalu verifikasi status **Pintu Terbuka**.

## Tech Stack

- Next.js (App Router)
- PostgreSQL
- `pg`, `qrcode`, `pdf-lib`, `jsqr`

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```env
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parking_db
```

3. Run development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## API Endpoints

- `POST /api/tickets` -> create ticket + QR data
- `GET /api/tickets/[code]` -> get ticket details
- `GET /api/tickets/[code]/pdf` -> download ticket PDF
- `POST /api/pay` -> calculate fee + update `exit_time` and `total_price` (idempotent: jika tiket sudah dibayar, endpoint mengembalikan data pembayaran yang sudah ada)

## Project Structure

```bash
app/
  page.tsx
  pay/page.tsx
  api/tickets/route.js
  api/tickets/[code]/route.js
  api/tickets/[code]/pdf/route.js
  api/pay/route.js
lib/db.js
```
