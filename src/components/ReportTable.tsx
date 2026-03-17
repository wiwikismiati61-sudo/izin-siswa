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
  onDeleteDuplicates: () => void;
  isLoggedIn: boolean;
}

const ReportTable: React.FC<ReportTableProps> = ({ data, masterSiswa, onEdit, onDelete, onClearAll, onViewEvidence, onImport, onDeleteDuplicates, isLoggedIn }) => {
  const [filterClass, setFilterClass] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [summaryStartDate, setSummaryStartDate] = useState('');
  const [summaryEndDate, setSummaryEndDate] = useState('');

  const studentSummary = useMemo(() => {
    if (!selectedClass) return [];

    const studentsInClass = masterSiswa.filter(s => String(s.Kelas) === selectedClass);
    
    // Get unique students by name to avoid duplicates in the summary table
    const uniqueStudentNames = Array.from(new Set(studentsInClass.map(s => s.Nama)));
    const uniqueStudents = uniqueStudentNames.map(name => studentsInClass.find(s => s.Nama === name)!);

    return uniqueStudents.map(student => {
      const studentAbsences = data.filter(d => {
        const matchName = d.nama === student.Nama;
        const matchClass = String(d.kelas) === selectedClass;
        const matchStartDate = summaryStartDate ? d.tanggal >= summaryStartDate : true;
        const matchEndDate = summaryEndDate ? d.tanggal <= summaryEndDate : true;
        return matchName && matchClass && matchStartDate && matchEndDate;
      });
      
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
  }, [selectedClass, masterSiswa, data, summaryStartDate, summaryEndDate]);

  const studentsInSelectedFilterClass = useMemo(() => {
    if (!filterClass) return [];
    const filtered = masterSiswa.filter(s => String(s.Kelas) === filterClass);
    // Get unique students by name
    const uniqueNames = Array.from(new Set(filtered.map(s => s.Nama)));
    return uniqueNames
        .map(name => filtered.find(s => s.Nama === name)!)
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
  
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchClass = filterClass ? item.kelas === filterClass : true;
      const matchStudent = filterStudent ? item.nama === filterStudent : true;
      const matchDate = filterDate ? item.tanggal === filterDate : true;
      return matchClass && matchStudent && matchDate;
    });
  }, [data, filterClass, filterStudent, filterDate]);

  const groupedData = useMemo(() => {
    const groups: any = {};
    // Sort by date desc within groups
    const sorted = [...filteredData].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    
    sorted.forEach(item => {
      if (!groups[item.nama]) groups[item.nama] = {};
      if (!groups[item.nama][item.kelas]) groups[item.nama][item.kelas] = {};
      if (!groups[item.nama][item.kelas][item.keterangan]) groups[item.nama][item.kelas][item.keterangan] = [];
      groups[item.nama][item.kelas][item.keterangan].push(item);
    });
    return groups;
  }, [filteredData]);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h2 className="text-3xl font-black text-slate-900">Laporan Absensi</h2>
               <p className="text-slate-500 text-sm font-medium">Kelola dan lihat rincian data kehadiran siswa</p>
            </div>
            <div className="flex flex-wrap gap-2">
                 <label className={`p-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                   isLoggedIn 
                     ? "bg-white border border-indigo-200 text-indigo-700 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300" 
                     : "bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed"
                 }`}>
                    <Upload size={14} /> Impor
                    <input type="file" accept=".xlsx, .xls" onChange={onImport} className="hidden" disabled={!isLoggedIn} />
                 </label>
                 <button 
                   onClick={onDeleteDuplicates}
                   disabled={!isLoggedIn}
                   className={`p-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                     isLoggedIn 
                       ? "bg-white border border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300" 
                       : "bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed"
                   }`}
                 >
                    <RotateCcw size={14} /> Hapus Data Ganda
                 </button>
                 <button 
                   onClick={onClearAll}
                   disabled={!isLoggedIn}
                   className={`p-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                     isLoggedIn 
                       ? "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300" 
                       : "bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed"
                   }`}
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
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <input 
                            type="date"
                            value={summaryStartDate}
                            onChange={e => setSummaryStartDate(e.target.value)}
                            className="p-1.5 bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
                            title="Tanggal Mulai"
                        />
                        <span className="text-slate-300 font-black">-</span>
                        <input 
                            type="date"
                            value={summaryEndDate}
                            onChange={e => setSummaryEndDate(e.target.value)}
                            className="p-1.5 bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
                            title="Tanggal Akhir"
                        />
                    </div>
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
            <h3 className="text-base font-black text-slate-800 mb-4">Log Riwayat Absensi Keseluruhan</h3>
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
            <div className="bg-[#A04040] p-4 text-center relative">
                <h3 className="text-base font-black text-white tracking-tight">Log Riwayat Absensi</h3>
                <div className="absolute bottom-2 right-4 text-white/50">
                    <RotateCcw size={20} />
                </div>
            </div>
            
            <div className="p-0">
                {Object.keys(groupedData).length > 0 ? (
                    Object.keys(groupedData).sort().map(studentName => (
                        <div key={studentName} className="border-b border-slate-100">
                            {/* Student Level */}
                            <div 
                                onClick={() => toggleNode(studentName)}
                                className="bg-[#E59999] p-3 px-6 flex items-center gap-3 cursor-pointer hover:bg-[#D88888] transition-colors"
                            >
                                <div className="w-4 h-4 flex items-center justify-center border border-white/50 rounded-sm text-white text-[10px] font-bold">
                                    {expandedNodes[studentName] ? '−' : '+'}
                                </div>
                                <span className="font-black text-white uppercase tracking-wide">{studentName}</span>
                            </div>

                            {expandedNodes[studentName] && Object.keys(groupedData[studentName]).map(className => (
                                <div key={className}>
                                    {/* Class Level */}
                                    <div 
                                        onClick={() => toggleNode(`${studentName}-${className}`)}
                                        className="bg-[#F5CACA] p-2 px-10 flex items-center gap-3 cursor-pointer hover:bg-[#EBBBBB] transition-colors"
                                    >
                                        <div className="w-4 h-4 flex items-center justify-center border border-white/50 rounded-sm text-white text-[10px] font-bold">
                                            {expandedNodes[`${studentName}-${className}`] ? '−' : '+'}
                                        </div>
                                        <span className="font-bold text-slate-700">{className}</span>
                                    </div>

                                    {expandedNodes[`${studentName}-${className}`] && Object.keys(groupedData[studentName][className]).map(status => (
                                        <div key={status}>
                                            {/* Status Level */}
                                            <div 
                                                onClick={() => toggleNode(`${studentName}-${className}-${status}`)}
                                                className="bg-white p-2 px-14 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="w-4 h-4 flex items-center justify-center border border-slate-300 rounded-sm text-slate-400 text-[10px] font-bold">
                                                    {expandedNodes[`${studentName}-${className}-${status}`] ? '−' : '+'}
                                                </div>
                                                <span className={`font-bold ${
                                                    status === 'Sakit' ? 'text-emerald-600' :
                                                    status === 'Izin' ? 'text-amber-600' :
                                                    'text-rose-600'
                                                }`}>{status} ({groupedData[studentName][className][status].length})</span>
                                            </div>

                                            {expandedNodes[`${studentName}-${className}-${status}`] && (
                                                <div className="bg-white divide-y divide-slate-50">
                                                    {groupedData[studentName][className][status].map((item: AbsensiEntry) => (
                                                        <div key={item.id} className="p-2 px-20 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-sm font-semibold text-slate-500">{item.tanggal}</span>
                                                                {item.bukti && (
                                                                    <button 
                                                                        onClick={() => onViewEvidence(item.bukti!)}
                                                                        className="text-indigo-600 hover:text-indigo-800"
                                                                        title="Lihat Bukti"
                                                                    >
                                                                        <FileText size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {isLoggedIn && (
                                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button 
                                                                        onClick={() => onEdit(item)}
                                                                        className="p-1 text-slate-400 hover:text-indigo-600"
                                                                    >
                                                                        <Pencil size={14} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => onDelete(item.id)}
                                                                        className="p-1 text-slate-400 hover:text-rose-500"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <div className="p-20 text-center text-slate-400 font-bold italic">
                        Data tidak ditemukan. Silakan sesuaikan filter pencarian.
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ReportTable;
