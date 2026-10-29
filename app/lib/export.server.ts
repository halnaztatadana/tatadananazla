import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { store, type Transaction, type ExportHistory, formatRupiah } from './store';

export interface ExportOptions {
  userId: string;
  format: 'pdf' | 'xlsx';
  period: string; // e.g. "2026-10"
  filters?: {
    categoryId?: string;
    walletId?: string;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function generateExportReport(options: ExportOptions): {
  success: boolean;
  downloadUrl: string;
  expiresAt: string;
  historyId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
} {
  const profile = store.profiles.get(options.userId);
  if (!profile) throw new Error('User not found');

  // Filter transactions
  let txList = Array.from(store.transactions.values()).filter(
    (t) => t.user_id === options.userId
  );

  if (options.period) {
    txList = txList.filter((t) => t.date_wib.startsWith(options.period));
  }

  if (options.filters?.categoryId) {
    txList = txList.filter((t) => t.category_id === options.filters?.categoryId);
  }

  if (options.filters?.walletId) {
    txList = txList.filter((t) => t.wallet_id === options.filters?.walletId);
  }

  if (options.filters?.type) {
    txList = txList.filter((t) => t.type === options.filters?.type);
  }

  if (options.filters?.search) {
    const q = options.filters.search.toLowerCase();
    txList = txList.filter((t) => t.notes.toLowerCase().includes(q));
  }

  // Sort by date desc
  txList.sort((a, b) => new Date(b.date_wib).getTime() - new Date(a.date_wib).getTime());

  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 60 * 1000); // 30-min ephemeral expiration
  const fileExt = options.format === 'pdf' ? 'pdf' : 'xlsx';
  const fileName = `tatadana_laporan_${options.period || 'semua'}_${Date.now()}.${fileExt}`;
  const downloadUrl = `https://storage.tatadana.local/reports/${options.userId}/${fileName}?token=ephemeral_sig_${Date.now()}`;
  const historyId = `exp_${Date.now()}`;

  let buffer: Buffer;
  let mimeType: string;

  if (options.format === 'pdf') {
    const doc = new jsPDF();

    // Header Orange Fintech Brand
    doc.setFillColor(249, 115, 22); // #F97316
    doc.rect(0, 0, 210, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TataDana — Laporan Keuangan Pribadi', 14, 16);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nama: ${profile.full_name}`, 14, 34);
    doc.text(`Periode: ${options.period || 'Semua Waktu'}`, 14, 40);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`, 14, 46);

    // Summary calculations
    const totalPemasukan = txList
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPengeluaran = txList
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const netCashflow = totalPemasukan - totalPengeluaran;

    doc.setFont('helvetica', 'bold');
    doc.text(`Total Pemasukan: ${formatRupiah(totalPemasukan)}`, 120, 34);
    doc.text(`Total Pengeluaran: ${formatRupiah(totalPengeluaran)}`, 120, 40);
    doc.text(`Net Cashflow: ${formatRupiah(netCashflow)}`, 120, 46);

    // Table data
    const tableRows = txList.map((tx) => {
      const cat = store.categories.get(tx.category_id);
      const wal = store.wallets.get(tx.wallet_id);
      const sign = tx.type === 'income' ? '+ ' : tx.type === 'expense' ? '- ' : '';
      return [
        new Date(tx.date_wib).toLocaleDateString('id-ID'),
        tx.type.toUpperCase(),
        cat ? `${cat.emoji} ${cat.name}` : '-',
        wal ? wal.name : '-',
        tx.notes || '-',
        `${sign}${formatRupiah(tx.amount)}`,
      ];
    });

    autoTable(doc, {
      startY: 54,
      head: [['Tanggal', 'Jenis', 'Kategori', 'Dompet', 'Catatan', 'Nominal']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        5: { halign: 'right', fontStyle: 'bold' },
      },
    });

    const pdfArrayBuffer = doc.output('arraybuffer');
    buffer = Buffer.from(pdfArrayBuffer);
    mimeType = 'application/pdf';
  } else {
    // Excel Generation (.xlsx)
    const excelRows = txList.map((tx) => {
      const cat = store.categories.get(tx.category_id);
      const wal = store.wallets.get(tx.wallet_id);
      return {
        ID: tx.id,
        Tanggal: new Date(tx.date_wib).toISOString().slice(0, 10),
        Jenis: tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer',
        Kategori: cat ? cat.name : '-',
        Dompet: wal ? wal.name : '-',
        Catatan: tx.notes,
        Nominal: tx.amount,
        Sumber: tx.source,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi');

    buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  // Record history
  const history: ExportHistory = {
    id: historyId,
    user_id: options.userId,
    file_name: fileName,
    file_url: downloadUrl,
    file_type: options.format,
    period: options.period,
    expires_at: expires.toISOString(),
    created_at: now.toISOString(),
  };
  store.exportHistories.set(historyId, history);

  return {
    success: true,
    downloadUrl,
    expiresAt: expires.toISOString(),
    historyId,
    buffer,
    fileName,
    mimeType,
  };
}
