import React, { useState, useMemo } from 'react';
import { IzinWaliMurid, Siswa } from '../types';
import { CheckCircle2, FileText, XCircle, Search, Calendar } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface RekapIzinWaliProps {
  izinData: IzinWaliMurid[];
  onViewEvidence: (src: string) => void;
  userRole?: 'admin' | 'viewer' | null;
}

const RekapIzinWali: React.FC<RekapIzinWaliProps> = ({ izinData, onViewEvidence, userRole }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'done'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    return izinData.filter(item => {
      const matchStatus = filterStatus === 'all' ? true : filterStatus === 'pending' ? !item.statusInput : item.statusInput;
      const matchSearch = item.namaSiswa.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.kelas.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [izinData, filterStatus, searchQuery]);

  const handleInputKeAbsensi = async (izin: IzinWaliMurid) => {
    setProcessingId(izin.id);
    try {
      // 1. Tambahkan ke absensi_log
      const currentUser = auth.currentUser;
      const penanggungJawab = currentUser?.email || currentUser?.displayName || 'Admin';

      const newAbsensi = {
        tanggal: izin.tanggal,
        kelas: izin.kelas,
        nama: izin.namaSiswa,
        keterangan: izin.jenisIzin,
        bukti: izin.lampiran,
        penanggungJawab,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'absensi_log'), newAbsensi);

      // 2. Update statusInput di izin_wali
      const izinRef = doc(db, 'izin_wali', izin.id);
      await updateDoc(izinRef, { statusInput: true });

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'izin_wali');
      alert('Gagal memproses data. Silakan coba lagi.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = izinData.filter(i => !i.statusInput).length;
  const doneCount = izinData.filter(i => i.statusInput).length;
  const totalCount = izinData.length;

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-in fade-in duration-500">
        <div className="p-4 bg-rose-100 text-rose-600 rounded-full">
          <XCircle size={48} />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Akses Ditolak</h2>
        <p className="text-slate-500 text-center max-w-md">
          Halaman Rekap Izin Wali hanya dapat diakses oleh Administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Rekap Izin Wali Murid</h2>
          <p className="text-slate-500 text-sm font-medium">Daftar permohonan izin/sakit dari wali murid</p>
        </div>
        <div className="flex gap-4 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-center px-4 border-r border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
            <p className="text-xl font-black text-slate-700">{totalCount}</p>
          </div>
          <div className="text-center px-4 border-r border-slate-100">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Belum Diinput</p>
            <p className="text-xl font-black text-amber-600">{pendingCount}</p>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Sudah Diinput</p>
            <p className="text-xl font-black text-emerald-600">{doneCount}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari siswa/kelas..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Belum Diinput</option>
            <option value="done">Sudah Diinput</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Siswa & Kelas</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Wali & Kontak</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-center">Lampiran</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <Calendar size={14} className="text-slate-400" />
                        {item.tanggal}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{item.namaSiswa}</div>
                      <div className="text-xs text-slate-500 font-medium">Kelas {item.kelas}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-700">{item.namaWali}</div>
                      <div className="text-xs text-slate-500 font-medium">{item.telpWali}</div>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold mb-1 bg-slate-100 text-slate-600">
                        {item.jenisIzin}
                      </div>
                      <div className="text-sm text-slate-600 line-clamp-2" title={item.keterangan}>
                        {item.keterangan}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => onViewEvidence(item.lampiran)}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors inline-flex"
                        title="Lihat Surat Izin"
                      >
                        <FileText size={16} />
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      {item.statusInput ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <CheckCircle2 size={12} /> Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                          <XCircle size={12} /> Menunggu
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {!item.statusInput && (
                        <button
                          onClick={() => handleInputKeAbsensi(item)}
                          disabled={processingId === item.id}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingId === item.id ? 'Memproses...' : 'Input ke Absensi'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    Tidak ada data izin yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RekapIzinWali;
