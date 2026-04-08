"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TicketData = {
  id: number;
  ticket_code: string;
  entry_time: string;
  exit_time: string | null;
  total_price: number | null;
  qr_data_url?: string;
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const downloadTicketPdf = (ticketCode: string) => {
    const pdfUrl = `/api/tickets/${ticketCode}/pdf`;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `ticket-${ticketCode}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleMasukParkir = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tickets", { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal membuat tiket");
      }

      const createdTicket: TicketData = json.data;
      setTicket(createdTicket);

      // auto download PDF
      downloadTicketPdf(createdTicket.ticket_code);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm sm:p-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Parking Management
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-zinc-100 sm:text-3xl">
          Tiket Masuk Parkir
        </h1>
        <p className="text-sm leading-relaxed text-zinc-300">
          Tekan tombol di bawah untuk membuat tiket masuk. Sistem akan
          mengunduh tiket dalam format PDF yang berisi ticket code dan QR.
        </p>
        <p className="mb-6 text-sm leading-relaxed text-zinc-300">
          Simpan PDF sebagai dokumen tiket untuk proses pembayaran.
        </p>

        <button
          onClick={handleMasukParkir}
          disabled={loading}
          className="w-full rounded-lg bg-zinc-100 py-3 text-sm font-semibold text-zinc-900 transition duration-200 hover:bg-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:text-zinc-200"
        >
          {loading ? "Memproses Permintaan..." : "Buat Tiket Masuk"}
        </button>

        {error && <p className="mt-4 text-sm text-zinc-300">{error}</p>}

        {ticket && (
          <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800 p-4 sm:p-5">
            <p className="text-sm font-semibold text-zinc-100">
              Tiket berhasil dibuat
            </p>
            <p className="mt-2 break-all text-sm text-zinc-200">
              <b>Ticket Code:</b> {ticket.ticket_code}
            </p>
            <p className="text-sm text-zinc-200">
              <b>Entry Time:</b>{" "}
              {new Date(ticket.entry_time).toLocaleString("id-ID")}
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              PDF tiket sudah diunduh. Jika unduhan tidak muncul, cek pop-up
              blocker browser atau coba ulangi.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => downloadTicketPdf(ticket.ticket_code)}
                className="w-full rounded-lg border border-zinc-500 bg-zinc-900 py-2 text-sm font-semibold text-zinc-100 transition duration-200 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 sm:flex-1"
              >
                Download PDF Tiket
              </button>
              <button
                type="button"
                onClick={() => router.push("/pay")}
                className="w-full rounded-lg bg-zinc-100 py-2 text-sm font-semibold text-zinc-900 transition duration-200 hover:bg-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 sm:flex-1"
              >
                Lanjut ke Pembayaran
              </button>
            </div>

            {ticket.qr_data_url && (
              <div className="mt-4 flex justify-center sm:justify-start">
                <img
                  src={ticket.qr_data_url}
                  alt="QR Ticket"
                  className="h-40 w-40 rounded border border-zinc-500 bg-zinc-900 p-2 sm:h-44 sm:w-44"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
