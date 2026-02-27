import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { AbsensiEntry, Siswa, KeteranganStatus } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InputForm from './components/InputForm';
import ReportTable from './components/ReportTable';
import Peringatan from './components/Peringatan';
import { Menu, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '' });

  // Data State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'report' | 'peringatan'>('dashboard');
  const [masterSiswa, setMasterSiswa] = useState<Siswa[]>([]);
  const [dataAbsensi, setDataAbsensi] = useState<AbsensiEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<AbsensiEntry | null>(null);
  const [dashboardSelectedClass, setDashboardSelectedClass] = useState<string>('');
  
  // UI States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleteAll, setIsDeleteAll] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentForPrint, setStudentForPrint] = useState<any | null>(null); // Ganti `any` dengan tipe yang sesuai
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load Initial Data
  useEffect(() => {
    try {
      const savedAbsensi = localStorage.getItem('absensi_log_data');
      const savedSiswa = localStorage.getItem('absensi_master_siswa');
      if (savedAbsensi) setDataAbsensi(JSON.parse(savedAbsensi));
      if (savedSiswa) setMasterSiswa(JSON.parse(savedSiswa));
    } catch (error) {
      console.error("Gagal memuat data dari localStorage", error);
    }
  }, []);

  // Sync Data to Local Storage
  useEffect(() => {
    localStorage.setItem('absensi_log_data', JSON.stringify(dataAbsensi));
    localStorage.setItem('absensi_master_siswa', JSON.stringify(masterSiswa));
  }, [dataAbsensi, masterSiswa]);

  const handleLogin = () => {
    if (authForm.username && authForm.password) {
      setIsLoggedIn(true);
    }
  };

  const getPanggilanData = () => {
    const alphaMap: Record<string, { name: string; kelas: string; count: number }> = {};
    dataAbsensi.forEach(curr => {
      if (curr.keterangan === 'Alpha') {
        const key = `${curr.nama}|${curr.kelas}`;
        if (!alphaMap[key]) alphaMap[key] = { name: curr.nama, kelas: curr.kelas, count: 0 };
        alphaMap[key].count++;
      }
    });
    return Object.values(alphaMap).filter(s => s.count > 2);
  };

  const getSakitWarningData = () => {
    const countMap: Record<string, { name: string; kelas: string; count: number }> = {};
    dataAbsensi.forEach(curr => {
        if (curr.keterangan === 'Sakit') {
            const key = `${curr.nama}|${curr.kelas}`;
            if (!countMap[key]) countMap[key] = { name: curr.nama, kelas: curr.kelas, count: 0 };
            countMap[key].count++;
        }
    });
    return Object.values(countMap).filter(s => s.count > 4);
  };

  const getIzinWarningData = () => {
      const countMap: Record<string, { name: string; kelas: string; count: number }> = {};
      dataAbsensi.forEach(curr => {
          if (curr.keterangan === 'Izin') {
              const key = `${curr.nama}|${curr.kelas}`;
              if (!countMap[key]) countMap[key] = { name: curr.nama, kelas: curr.kelas, count: 0 };
              countMap[key].count++;
          }
      });
      return Object.values(countMap).filter(s => s.count > 4);
  };

  const handleImportSiswa = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (!evt.target?.result) return;
      const workbook = XLSX.read(evt.target.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Siswa>(sheet);
      const formatted = json.map(s => ({
        Nama: s.Nama || s.nama,
        Kelas: s.Kelas || s.kelas
      }));
      setMasterSiswa(formatted);
      alert('Impor Berhasil!');
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleImportAbsensi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        if (!evt.target?.result) return;
        const workbook = XLSX.read(evt.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<AbsensiEntry>(sheet, { raw: false, defval: '' });

        const newEntries: AbsensiEntry[] = [];
        const existingEntries = new Set(dataAbsensi.map(d => `${d.tanggal}|${d.nama}`));

        json.forEach((row, index) => {
            const tanggal = row.Tanggal || '';
            const nama = row.Nama || '';
            const kelas = row.Kelas || '';
            const status = (row.Status || '') as KeteranganStatus;

            if (!tanggal || !nama || !kelas || !status) {
                console.warn(`Skipping invalid row at index ${index}:`, row);
                return;
            }

            const key = `${tanggal}|${nama}`;
            if (!existingEntries.has(key)) {
                newEntries.push({
                    id: `${Date.now()}_${index}`,
                    tanggal,
                    nama,
                    kelas: String(kelas),
                    keterangan: status,
                    bukti: null
                });
                existingEntries.add(key);
            }
        });

        if (newEntries.length > 0) {
            setDataAbsensi(prev => [...newEntries, ...prev]);
            alert(`${newEntries.length} data baru berhasil diimpor!`);
        } else {
            alert("Tidak ada data baru untuk diimpor atau semua data sudah ada.");
        }
        
        e.target.value = ''; 
    };
    reader.readAsBinaryString(file);
  };

  const handleBackup = () => {
    const blob = new Blob([JSON.stringify({ master: masterSiswa, absensi: dataAbsensi })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Absensi_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (!evt.target?.result) return;
      try {
        const res = JSON.parse(evt.target.result as string);
        if (res.absensi) setDataAbsensi(res.absensi);
        if (res.master) setMasterSiswa(res.master);
        alert('Data Berhasil Dipulihkan!');
      } catch {
        alert('File tidak valid');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(dataAbsensi.map(d => ({
      Tanggal: d.tanggal,
      Nama: d.nama,
      Kelas: d.kelas,
      Status: d.keterangan
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Log Absensi");
    XLSX.writeFile(wb, `Laporan_Absensi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const executeDelete = () => {
    if (isDeleteAll) {
      setDataAbsensi([]);
    } else if (pendingDeleteId) {
      setDataAbsensi(prev => prev.filter(item => item.id !== pendingDeleteId));
    }
    setShowConfirmModal(false);
    setPendingDeleteId(null);
    setIsDeleteAll(false);
  };

  const handleEditClick = (entry: AbsensiEntry) => {
    setEditingEntry(entry);
    setActiveTab('input');
  };

  const handleSaveAbsensi = (entry: AbsensiEntry) => {
    setDataAbsensi(prev => {
      const exists = prev.find(item => item.id === entry.id);
      if (exists) {
        return prev.map(item => item.id === entry.id ? entry : item);
      }
      return [entry, ...prev];
    });
    setEditingEntry(null);
    setActiveTab('report');
  };

  if (!isLoggedIn) {
    return <Login authForm={authForm} setAuthForm={setAuthForm} handleLogin={handleLogin} />;
  }

  const sakitWarningCount = getSakitWarningData().length;
  const izinWarningCount = getIzinWarningData().length;
  const panggilanCount = getPanggilanData().length;
  const badgeCount = sakitWarningCount + izinWarningCount + panggilanCount;

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden" id="main-app-wrapper">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        editingEntry={editingEntry}
        badgeCount={badgeCount}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"></div>}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="md:hidden sticky top-0 bg-white/80 backdrop-blur-md z-20 p-4 border-b border-slate-200 flex justify-between items-center shadow-sm">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <Menu size={24} />
            </button>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">Si-Absensi</h1>
            <div className="w-10"></div>
        </header>

        <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto custom-scrollbar">
          {activeTab === 'dashboard' && (
            <Dashboard 
              dataAbsensi={dataAbsensi}
              masterSiswa={masterSiswa}
              handleImportSiswa={handleImportSiswa}
              handleRestore={handleRestore}
              handleExportExcel={handleExportExcel}
              handleBackup={handleBackup}
              dashboardSelectedClass={dashboardSelectedClass}
              setDashboardSelectedClass={setDashboardSelectedClass}
            />
          )}

          {activeTab === 'input' && (
            <InputForm 
              masterSiswa={masterSiswa} 
              editingEntry={editingEntry}
              onCancel={() => {
                setEditingEntry(null);
                setActiveTab('report');
              }}
              onSave={handleSaveAbsensi} 
            />
          )}

          {activeTab === 'report' && (
            <ReportTable 
              data={dataAbsensi}
              masterSiswa={masterSiswa} 
              onEdit={handleEditClick}
              onDelete={(id) => {
                setPendingDeleteId(id);
                setIsDeleteAll(false);
                setShowConfirmModal(true);
              }} 
              onClearAll={() => {
                setIsDeleteAll(true);
                setShowConfirmModal(true);
              }}
              onViewEvidence={(src) => setSelectedImage(src)}
              onImport={handleImportAbsensi}
            />
          )}

          {activeTab === 'peringatan' && (
            <Peringatan 
              sakitWarningData={getSakitWarningData()}
              izinWarningData={getIzinWarningData()}
              panggilanData={getPanggilanData()}
              setStudentForPrint={setStudentForPrint}
            />
          )}
        </main>

        {showConfirmModal && (
          <div className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm shadow-2xl text-center animate-in zoom-in duration-200">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{isDeleteAll ? 'Hapus Semua Data?' : 'Hapus Data?'}</h3>
              <p className="text-slate-500 text-sm mb-6">Tindakan ini tidak dapat dibatalkan dan akan menghapus data dari memori lokal.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 p-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 p-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
