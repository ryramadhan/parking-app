"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";

type DecodedResult = {
  raw: string;
  ticketCode: string | null;
};

type PayResult = {
  hours: number;
  total_price: number;
  entry_time: string;
};

export default function PayPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<DecodedResult | null>(null);
  const [manualTicketCode, setManualTicketCode] = useState("");
  const [scanSource, setScanSource] = useState<"image" | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const extractTicketCode = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      return parsed?.ticket_code ?? parsed?.ticketCode ?? null;
    } catch {
      return raw || null;
    }
  };

  const decodeQrFromImage = async (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Canvas tidak tersedia");

    // Upscale image to improve decode success from screenshots.
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (!qr) {
      throw new Error(
        "QR tidak terdeteksi. Pastikan gambar/PDF jelas, tidak blur, dan QR tidak terpotong.",
      );
    }

    return qr.data;
  };

  const decodeQrFromFile = async (file: File) => {
    setError("");
    setDecoded(null);
    setScanSource(null);

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);

    const img = new Image();
    img.src = imageUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Gagal membaca gambar"));
    });

    const raw = await decodeQrFromImage(img);
    setScanSource("image");

    const ticketCode = extractTicketCode(raw);
    setDecoded({ raw, ticketCode });
    if (ticketCode) {
      setManualTicketCode(ticketCode);
    }
  };

  const resetPay = () => {
    setPreview(null);
    setDecoded(null);
    setManualTicketCode("");
    setScanSource(null);
    setPayResult(null);
    setError("");
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await decodeQrFromFile(file);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal decode QR");
    }
  };

  const [payResult, setPayResult] = useState<PayResult | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const handleHitungTarif = async () => {
    const ticketCode = manualTicketCode.trim();
    if (!ticketCode) {
      setError("Ticket code wajib diisi atau dibaca dari QR.");
      return;
    }
    setPayLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_code: ticketCode }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghitung tarif");
      }
      setPayResult(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm sm:p-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Payment Processing
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-zinc-100 sm:text-3xl">
          Pembayaran Parkir
        </h1>
        <p className="mb-5 text-sm leading-relaxed text-zinc-300">
          Upload gambar QR (screenshot dari PDF tiket) untuk membaca ticket
          code. Jika proses scan tidak berhasil, masukkan ticket code secara
          manual lalu lanjutkan perhitungan tarif.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="mb-4 block w-full rounded-lg border border-zinc-500 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition duration-200 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-zinc-900 file:transition file:duration-200 hover:file:bg-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        />

        {preview && (
          <div className="flex justify-center sm:justify-start">
            <img
              src={preview}
              alt="QR preview"
              className="h-40 w-40 rounded border border-zinc-500 bg-zinc-900 p-2 object-contain sm:h-52 sm:w-52"
            />
          </div>
        )}

        {scanSource && decoded?.ticketCode && (
          <p className="mt-3 text-sm text-zinc-300">
            QR berhasil dibaca dari{" "}
            <span className="font-semibold">file gambar</span>
            .
          </p>
        )}

        {error && <p className="mt-4 text-sm text-zinc-300">{error}</p>}

        <div className="mt-4">
          <label
            htmlFor="ticket-code"
            className="mb-1 block text-sm font-medium text-zinc-200"
          >
            Ticket Code
          </label>
          <input
            id="ticket-code"
            type="text"
            value={manualTicketCode}
            onChange={(e) => setManualTicketCode(e.target.value.toUpperCase())}
            placeholder="Contoh: TKT-20260408-AB12CD"
            className="w-full rounded-lg border border-zinc-500 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          />
        </div>

        {decoded && (
          <>
            <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-200">
              <p className="break-words">
                <b>Data QR:</b> {decoded.raw}
              </p>
              <p>
                <b>Ticket Code:</b> {decoded.ticketCode ?? "-"}
              </p>
            </div>
            <button
              onClick={handleHitungTarif}
              disabled={payLoading}
              className="mt-4 w-full rounded-lg bg-zinc-100 py-2 text-sm font-semibold text-zinc-900 transition duration-200 hover:bg-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:text-zinc-200"
            >
              {payLoading ? "Memproses..." : "Hitung Durasi dan Tarif"}
            </button>
          </>
        )}

        {!decoded && (
          <button
            onClick={handleHitungTarif}
            disabled={payLoading}
            className="mt-4 w-full rounded-lg bg-zinc-100 py-2 text-sm font-semibold text-zinc-900 transition duration-200 hover:bg-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:text-zinc-200"
          >
            {payLoading ? "Memproses..." : "Hitung Durasi dan Tarif"}
          </button>
        )}

        {payResult && (
          <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-sm text-zinc-200 sm:p-5">
            <p>
              <b>Entry Time:</b>{" "}
              {new Date(payResult.entry_time).toLocaleString("id-ID")}
            </p>
            <p>
              <b>Durasi:</b> {payResult.hours} jam
            </p>
            <p>
              <b>Total Harga:</b> Rp{" "}
              {payResult.total_price.toLocaleString("id-ID")}
            </p>
            <p className="mt-3 font-semibold text-zinc-100">
              Pembayaran Berhasil
            </p>
            <p className="text-zinc-300">Status akses keluar: Pintu terbuka</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.push("/")}
                className="w-full rounded-lg bg-zinc-100 py-2 text-sm font-semibold text-zinc-900 transition duration-200 hover:bg-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 sm:flex-1"
              >
                Kembali ke Beranda
              </button>
              <button
                onClick={resetPay}
                className="w-full rounded-lg border border-zinc-500 bg-zinc-900 py-2 text-sm font-semibold text-zinc-100 transition duration-200 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 sm:flex-1"
              >
                Bayar Tiket Lain
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
