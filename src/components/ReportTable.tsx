import React, { useState, useMemo } from 'react';
import { Upload, Trash2, Pencil, FileText, RotateCcw, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AbsensiEntry, Siswa } from '../types';

// Constants
const KELAS_LIST = [7, 8, 9];
const ABJAD_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

interface ReportTableProps {
  data: AbsensiEntry[];
  masterSiswa: Siswa[];
  onEdit: (entry: AbsensiEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onViewEvidence: (src: string) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ReportTable: React.FC<ReportTableProps> = ({ data, masterSiswa, onEdit, onDelete, onClearAll, onViewEvidence, onImport }) => {
  const [filterClass, setFilterClass] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const studentSummary = useMemo(() => {
    if (!selectedClass) return [];

    const studentsInClass = masterSiswa.filter(s => String(s.Kelas) === selectedClass);
    
    return studentsInClass.map(student => {
      const studentAbsences = data.filter(d => d.nama === student.Nama && String(d.kelas) === selectedClass);
      
      const sakit = studentAbsences.filter(d => d.keterangan === 'Sakit').length;
      const izin = studentAbsences.filter(d => d.keterangan === 'Izin').length;
      const alpha = studentAbsences.filter(d => d.keterangan === 'Alpha').length;
      
      return {
        nama: student.Nama,
        sakit,
        izin,
        alpha,
        total: sakit + izin + alpha,
      };
    }).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [selectedClass, masterSiswa, data]);

  const studentsInSelectedFilterClass = useMemo(() => {
    if (!filterClass) return [];
    return masterSiswa
        .filter(s => String(s.Kelas) === filterClass)
        .sort((a, b) => a.Nama.localeCompare(b.Nama));
  }, [filterClass, masterSiswa]);

  const handleExportSummaryExcel = () => {
    if (!selectedClass || studentSummary.length === 0) {
      alert("Pilih kelas dan pastikan ada data untuk diekspor.");
      return;
    }
  
    const dataToExport = studentSummary.map((summary, index) => ({
      'No': index + 1,
      'Nama Siswa': summary.nama,
      'Sakit': summary.sakit,
      'Izin': summary.izin,
      'Alpha': summary.alpha,
      'Total': summary.total,
    }));
  
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Rekap Kelas ${selectedClass}`);
    XLSX.writeFile(wb, `Rekap_Absensi_Kelas_${selectedClass}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleResetFilters = () => {
    setFilterClass('');
    setFilterStudent('');
    setFilterDate('');
  };
  
  const filteredData = data.filter(item => {
    const matchClass = filterClass ? item.kelas === filterClass : true;
    const matchStudent = filterStudent ? item.nama === filterStudent : true;
    const matchDate = filterDate ? item.tanggal === filterDate : true;
    return matchClass && matchStudent && matchDate;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h2 className="text-3xl font-black text-slate-900">Laporan Absensi</h2>
               <p className="text-slate-500 text-sm font-medium">Kelola dan lihat rincian data kehadiran siswa</p>
            </div>
            <div className="flex flex-wrap gap-2">
                 <label className="bg-white border border-indigo-200 text-indigo-700 p-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 shadow-sm transition-all">
                    <Upload size={14} /> Impor
                    <input type="file" accept=".xlsx, .xls" onChange={onImport} className="hidden" />
                 </label>
                 <button 
                   onClick={onClearAll}
                   className="bg-white border border-rose-200 text-rose-600 p-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-rose-50 hover:border-rose-300 shadow-sm transition-all"
                 >
                    <Trash2 size={14} /> Hapus Semua
                 </button>
            </div>
        </div>

        {/* NEW SECTION: Student Summary Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-black text-slate-800">Rekapitulasi Absensi per Siswa</h3>
                    <p className="text-slate-500 text-sm font-medium">Pilih kelas untuk melihat rincian per siswa.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select 
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        className="flex-1 md:flex-none w-full md:w-auto p-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Pilih Kelas</option>
                        {KELAS_LIST.flatMap(k => 
                            ABJAD_LIST.map(a => <option key={`${k}${a}`} value={`${k}${a}`}>Kelas {k}{a}</option>)
                        )}
                    </select>
                    <button
                        onClick={handleExportSummaryExcel}
                        disabled={!selectedClass || studentSummary.length === 0}
                        className="p-2.5 px-4 bg-white border border-emerald-200 text-emerald-700 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:shadow-none"
                        title="Unduh Rekap Kelas"
                    >
                        <Download size={16} /> Unduh Rekap
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-center">No</th>
                            <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                            <th className="p-4 font-bold text-emerald-600 uppercase tracking-wider text-center">Sakit</th>
                            <th className="p-4 font-bold text-amber-600 uppercase tracking-wider text-center">Izin</th>
                            <th className="p-4 font-bold text-rose-600 uppercase tracking-wider text-center">Alpha</th>
                            <th className="p-4 font-bold text-slate-800 uppercase tracking-wider text-center">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {selectedClass && studentSummary.length > 0 ? (
                            studentSummary.map((summary, index) => (
                            <tr key={summary.nama} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-center font-semibold text-slate-500">{index + 1}</td>
                                <td className="p-4 font-bold text-slate-800">{summary.nama}</td>
                                <td className="p-4 text-center font-bold text-emerald-600">{summary.sakit || '-'}</td>
                                <td className="p-4 text-center font-bold text-amber-600">{summary.izin || '-'}</td>
                                <td className="p-4 text-center font-bold text-rose-600">{summary.alpha || '-'}</td>
                                <td className="p-4 text-center font-black text-indigo-600">{summary.total}</td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                            <td colSpan={6} className="p-10 text-center text-slate-400 font-bold">
                                {selectedClass ? 'Tidak ada data siswa untuk kelas ini.' : 'Silakan pilih kelas terlebih dahulu.'}
                            </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>


        {/* EXISTING SECTION: Detailed Log */}
        <div>
            <h3 className="text-xl font-black text-slate-800 mb-4">Log Riwayat Absensi Keseluruhan</h3>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center hover:shadow-md transition-shadow">
                <select
                    value={filterClass}
                    onChange={e => {
                        setFilterClass(e.target.value);
                        setFilterStudent(''); // Reset student when class changes
                    }}
                    className="w-full md:w-auto flex-1 p-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                    <option value="">Semua Kelas</option>
                    {KELAS_LIST.flatMap(k =>
                        ABJAD_LIST.map(a => <option key={`${k}${a}`} value={`${k}${a}`}>Kelas {k}{a}</option>)
                    )}
                </select>
                <select
                    value={filterStudent}
                    onChange={e => setFilterStudent(e.target.value)}
                    disabled={!filterClass}
                    className="w-full md:w-auto flex-1 p-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                >
                    <option value="">{filterClass ? 'Semua Siswa' : 'Pilih kelas dahulu'}</option>
                    {studentsInSelectedFilterClass.map(s => (
                        <option key={s.Nama} value={s.Nama}>{s.Nama}</option>
                    ))}
                </select>
                <input
                    type="date"
                    className="w-full md:w-auto p-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-600 transition-all cursor-pointer"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                />
                <button
                    onClick={handleResetFilters}
                    className="p-2.5 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all w-full md:w-auto justify-center"
                    title="Reset Filter"
                >
                    <RotateCcw size={16} /> Reset
                </button>
            </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-6 font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                            <th className="p-6 font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                            <th className="p-6 font-bold text-slate-500 uppercase tracking-wider">Kelas</th>
                            <th className="p-6 font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                            <th className="p-6 font-bold text-slate-500 uppercase tracking-wider text-center">Bukti</th>
                            <th className="p-6 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.length > 0 ? filteredData.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="p-6 font-semibold text-slate-500 whitespace-nowrap">{item.tanggal}</td>
                                <td className="p-6 font-bold text-slate-800">{item.nama}</td>
                                <td className="p-6 font-bold text-indigo-600">{item.kelas}</td>
                                <td className="p-6 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${ 
                                        item.keterangan === 'Sakit' ? 'bg-emerald-100 text-emerald-600' :
                                        item.keterangan === 'Izin' ? 'bg-amber-100 text-amber-600' :
                                        'bg-rose-100 text-rose-600'
                                    }`}>
                                        {item.keterangan}
                                    </span>
                                </td>
                                <td className="p-6 text-center">
                                    {item.bukti ? (
                                        <button 
                                          onClick={() => onViewEvidence(item.bukti!)}
                                          className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center justify-center gap-1 mx-auto"
                                        >
                                            <FileText size={14} /> Lihat
                                        </button>
                                    ) : (
                                        <span className="text-slate-300">-</span>
                                    )}
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => onEdit(item)}
                                          className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button 
                                          onClick={() => onDelete(item.id)}
                                          className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="p-10 text-center text-slate-400 font-bold">
                                    Data tidak ditemukan.
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

export default ReportTable;
