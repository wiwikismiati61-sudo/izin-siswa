import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { AbsensiEntry, Siswa, KeteranganStatus, IzinWaliMurid } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InputForm from './components/InputForm';
import ReportTable from './components/ReportTable';
import Peringatan from './components/Peringatan';
import MasterData from './components/MasterData';
import CalendarPendidikan from './components/CalendarPendidikan';
import Login from './components/Login';
import FormIzinWali from './components/FormIzinWali';
import RekapIzinWali from './components/RekapIzinWali';
import { Menu, Trash2, X } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  writeBatch, 
  getDocs, 
  query, 
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'viewer' | 'entry' | null>(null);

  // Data State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form_izin' | 'rekap_izin' | 'input' | 'report' | 'peringatan' | 'master' | 'kalender'>('dashboard');
  const [masterSiswa, setMasterSiswa] = useState<Siswa[]>([]);
  const [dataAbsensi, setDataAbsensi] = useState<AbsensiEntry[]>([]);
  const [izinWaliData, setIzinWaliData] = useState<IzinWaliMurid[]>([]);
  const [editingEntry, setEditingEntry] = useState<AbsensiEntry | null>(null);
  const [dashboardSelectedClass, setDashboardSelectedClass] = useState<string>('');
  
  // UI States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleteAll, setIsDeleteAll] = useState(false);
  const [isDeleteDuplicates, setIsDeleteDuplicates] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentForPrint, setStudentForPrint] = useState<any | null>(null); // Ganti `any` dengan tipe yang sesuai
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth Listener
  useEffect(() => {
    const checkUserRole = async (user: any) => {
      const authorizedEmail = "wiwikismiati61@guru.smp.belajar.id";
      if (user.email === authorizedEmail) return 'admin';

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          return userDoc.data().role || 'viewer';
        }

        if (user.email) {
          const emailDoc = await getDoc(doc(db, 'admin_emails', user.email.toLowerCase()));
          if (emailDoc.exists()) {
            return emailDoc.data().role || 'admin';
          }
        }
      } catch (err) {
        console.error("Error checking user role:", err);
      }

      const isGoogle = user.providerData?.some((p: any) => p.providerId === 'google.com');
      if (isGoogle) return 'admin';

      return null;
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = await checkUserRole(user);
        if (role) {
          setUserRole(role as 'admin' | 'viewer' | 'entry');
          setIsLoggedIn(true);
        } else {
          await auth.signOut();
          setIsLoggedIn(false);
          setUserRole(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Data Migration & Sync
  useEffect(() => {
    if (!isAuthReady) return;

    // 1. Migration Logic
    const migrateData = async () => {
      const savedAbsensi = localStorage.getItem('absensi_log_data');
      const savedSiswa = localStorage.getItem('absensi_master_siswa');
      
      if (savedSiswa) {
        try {
          const siswaData: Siswa[] = JSON.parse(savedSiswa);
          const batch = writeBatch(db);
          siswaData.forEach((s) => {
            const newDoc = doc(collection(db, 'master_siswa'));
            batch.set(newDoc, s);
          });
          await batch.commit();
          localStorage.removeItem('absensi_master_siswa');
          console.log("Migration: Master Siswa migrated to Firebase");
        } catch (err) {
          console.error("Migration Error (Siswa):", err);
        }
      }

      if (savedAbsensi) {
        try {
          const absensiData: AbsensiEntry[] = JSON.parse(savedAbsensi);
          const batch = writeBatch(db);
          absensiData.forEach((entry) => {
            const newDoc = doc(collection(db, 'absensi_log'));
            const { id, ...rest } = entry;
            batch.set(newDoc, { ...rest, createdAt: serverTimestamp() });
          });
          await batch.commit();
          localStorage.removeItem('absensi_log_data');
          console.log("Migration: Absensi Log migrated to Firebase");
        } catch (err) {
          console.error("Migration Error (Absensi):", err);
        }
      }
    };

    if (isLoggedIn && auth.currentUser) {
      migrateData();
    }

    // 2. Real-time Listeners
    const qAbsensi = query(collection(db, 'absensi_log'), orderBy('tanggal', 'desc'));
    const unsubAbsensi = onSnapshot(qAbsensi, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AbsensiEntry[];
      setDataAbsensi(entries);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'absensi_log');
    });

    const unsubSiswa = onSnapshot(collection(db, 'master_siswa'), (snapshot) => {
      const siswa = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Siswa[];
      setMasterSiswa(siswa);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'master_siswa');
    });

    let unsubIzin: () => void = () => {};

    if (isLoggedIn) {
      const qIzin = query(collection(db, 'izin_wali'), orderBy('createdAt', 'desc'));
      unsubIzin = onSnapshot(qIzin, (snapshot) => {
        const izins = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as IzinWaliMurid[];
        setIzinWaliData(izins);

        // Auto-delete logic for izin_wali older than 1 month
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        izins.forEach(async (izin) => {
          const izinDate = new Date(izin.tanggal);
          if (izinDate < oneMonthAgo) {
            try {
              await deleteDoc(doc(db, 'izin_wali', izin.id));
            } catch (err) {
              console.error("Failed to auto-delete old izin:", err);
            }
          }
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'izin_wali');
      });
    } else {
      setIzinWaliData([]);
    }

    return () => {
      unsubAbsensi();
      unsubSiswa();
      unsubIzin();
    };
  }, [isAuthReady, isLoggedIn]);

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

  const handleImportSiswa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      if (!evt.target?.result) return;
      const workbook = XLSX.read(evt.target.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Siswa>(sheet);
      const formatted = json.map(s => ({
        Nama: s.Nama || s.nama,
        Kelas: String(s.Kelas || s.kelas)
      }));
      
      try {
        const batch = writeBatch(db);
        formatted.forEach(s => {
          const newDoc = doc(collection(db, 'master_siswa'));
          batch.set(newDoc, s);
        });
        await batch.commit();
        alert('Impor Berhasil!');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'master_siswa');
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleImportAbsensi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
        if (!evt.target?.result) return;
        const workbook = XLSX.read(evt.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<AbsensiEntry>(sheet, { raw: false, defval: '' });

        const newEntries: any[] = [];
        const existingEntries = new Set(dataAbsensi.map(d => `${d.tanggal}|${d.nama}`));

        json.forEach((row, index) => {
            const tanggal = row.Tanggal || '';
            const nama = row.Nama || '';
            const kelas = row.Kelas || '';
            const status = (row.Status || '') as KeteranganStatus;

            if (!tanggal || !nama || !kelas || !status) return;

            const key = `${tanggal}|${nama}`;
            if (!existingEntries.has(key)) {
                newEntries.push({
                    tanggal,
                    nama,
                    kelas: String(kelas),
                    keterangan: status,
                    bukti: null,
                    createdAt: serverTimestamp()
                });
                existingEntries.add(key);
            }
        });

        if (newEntries.length > 0) {
            try {
              const batch = writeBatch(db);
              newEntries.forEach(entry => {
                const newDoc = doc(collection(db, 'absensi_log'));
                batch.set(newDoc, entry);
              });
              await batch.commit();
              alert(`${newEntries.length} data baru berhasil diimpor!`);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, 'absensi_log');
            }
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

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      if (!evt.target?.result) return;
      try {
        const res = JSON.parse(evt.target.result as string);
        const batch = writeBatch(db);
        
        if (res.master) {
          res.master.forEach((s: any) => {
            const newDoc = doc(collection(db, 'master_siswa'));
            batch.set(newDoc, s);
          });
        }
        if (res.absensi) {
          res.absensi.forEach((entry: any) => {
            const newDoc = doc(collection(db, 'absensi_log'));
            const { id, ...rest } = entry;
            batch.set(newDoc, { ...rest, createdAt: serverTimestamp() });
          });
        }
        await batch.commit();
        alert('Data Berhasil Dipulihkan!');
      } catch (error) {
        alert('File tidak valid atau gagal memulihkan data');
        console.error(error);
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

  const executeDelete = async () => {
    try {
      if (isDeleteAll) {
        const batch = writeBatch(db);
        const snapshot = await getDocs(collection(db, 'absensi_log'));
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } else if (isDeleteDuplicates) {
        const seen = new Set<string>();
        const toDelete: string[] = [];
        
        // dataAbsensi is sorted by date desc
        dataAbsensi.forEach(entry => {
          const key = `${entry.tanggal}|${entry.nama}`;
          if (seen.has(key)) {
            if (entry.id) toDelete.push(entry.id);
          } else {
            seen.add(key);
          }
        });

        if (toDelete.length > 0) {
          const batch = writeBatch(db);
          toDelete.forEach(id => {
            batch.delete(doc(db, 'absensi_log', id));
          });
          await batch.commit();
          alert(`${toDelete.length} data ganda berhasil dihapus.`);
        } else {
          alert('Tidak ditemukan data ganda.');
        }
      } else if (pendingDeleteId) {
        await deleteDoc(doc(db, 'absensi_log', pendingDeleteId));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'absensi_log');
    }
    setShowConfirmModal(false);
    setPendingDeleteId(null);
    setIsDeleteAll(false);
    setIsDeleteDuplicates(false);
  };

  const handleEditClick = (entry: AbsensiEntry) => {
    setEditingEntry(entry);
    setActiveTab('input');
  };

  const handleSaveAbsensi = async (entry: AbsensiEntry) => {
    try {
      const currentUser = auth.currentUser;
      const penanggungJawab = currentUser?.email || currentUser?.displayName || 'Admin';

      if (entry.id) {
        const { id, ...data } = entry;
        await updateDoc(doc(db, 'absensi_log', id), {
          ...data,
          penanggungJawab: data.penanggungJawab || penanggungJawab
        });
      } else {
        await addDoc(collection(db, 'absensi_log'), {
          ...entry,
          penanggungJawab,
          createdAt: serverTimestamp()
        });
      }
      setEditingEntry(null);
      setActiveTab('report');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'absensi_log');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('dashboard');
  };

  const sakitWarningCount = getSakitWarningData().length;
  const izinWarningCount = getIzinWarningData().length;
  const panggilanCount = getPanggilanData().length;
  const badgeCount = sakitWarningCount + izinWarningCount + panggilanCount;
  const izinBadgeCount = izinWaliData.filter(i => !i.statusInput).length;

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden" id="main-app-wrapper">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        editingEntry={editingEntry}
        badgeCount={badgeCount}
        izinBadgeCount={izinBadgeCount}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        userRole={userRole}
      />

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"></div>}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="md:hidden sticky top-0 bg-white/80 backdrop-blur-md z-20 p-3 border-b border-slate-200 flex justify-between items-center shadow-sm">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Menu size={20} />
            </button>
            <h1 className="text-base font-black text-slate-800 tracking-tight">Si-Absensi</h1>
            <div className="w-8"></div>
        </header>

        <main className="flex-1 p-3 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
          {activeTab === 'dashboard' && (
            <Dashboard 
              dataAbsensi={dataAbsensi}
              masterSiswa={masterSiswa}
              dashboardSelectedClass={dashboardSelectedClass}
              setDashboardSelectedClass={setDashboardSelectedClass}
            />
          )}

          {activeTab === 'form_izin' && (
            <FormIzinWali masterSiswa={masterSiswa} />
          )}

          {activeTab === 'rekap_izin' && !isLoggedIn && (
            <Login onLogin={() => setIsLoggedIn(true)} />
          )}

          {activeTab === 'rekap_izin' && isLoggedIn && (
            <RekapIzinWali 
              izinData={izinWaliData} 
              onViewEvidence={setSelectedImage} 
              userRole={userRole}
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
                setIsDeleteDuplicates(false);
                setShowConfirmModal(true);
              }}
              onDeleteDuplicates={() => {
                setIsDeleteDuplicates(true);
                setIsDeleteAll(false);
                setShowConfirmModal(true);
              }}
              onViewEvidence={(src) => setSelectedImage(src)}
              onImport={handleImportAbsensi}
              isLoggedIn={isLoggedIn}
              userRole={userRole}
            />
          )}

          {activeTab === 'peringatan' && (
            <Peringatan 
              sakitWarningData={getSakitWarningData()}
              izinWarningData={getIzinWarningData()}
              panggilanData={getPanggilanData()}
              setStudentForPrint={setStudentForPrint}
              isLoggedIn={isLoggedIn}
            />
          )}

          {activeTab === 'kalender' && (
            <CalendarPendidikan isLoggedIn={isLoggedIn} userRole={userRole} />
          )}

          {(activeTab === 'input' || activeTab === 'master') && !isLoggedIn && (
            <Login onLogin={() => setIsLoggedIn(true)} />
          )}

          {(activeTab === 'input' || activeTab === 'master') && isLoggedIn && (
            <>
              {activeTab === 'input' && (
                <InputForm 
                  masterSiswa={masterSiswa} 
                  editingEntry={editingEntry}
                  onCancel={() => {
                    setEditingEntry(null);
                    setActiveTab('report');
                  }}
                  onSave={handleSaveAbsensi} 
                  onGoToRekapIzin={() => setActiveTab('rekap_izin')}
                  izinBadgeCount={izinBadgeCount}
                  userRole={userRole}
                />
              )}

              {activeTab === 'master' && (
                <MasterData
                  handleImportSiswa={handleImportSiswa}
                  handleRestore={handleRestore}
                  handleExportExcel={handleExportExcel}
                  handleBackup={handleBackup}
                  userRole={userRole}
                />
              )}
            </>
          )}
        </main>

        {selectedImage && (
          <div className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
            <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-4 -right-4 md:-top-6 md:-right-6 p-2 bg-white text-slate-900 rounded-full hover:bg-slate-200 transition-colors shadow-xl"
              >
                <X size={24} />
              </button>
              <img src={selectedImage} alt="Bukti Izin" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
              <div className="mt-4 flex gap-4">
                <a 
                  href={selectedImage} 
                  download="Surat_Izin.png"
                  className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2"
                >
                  Unduh Lampiran
                </a>
              </div>
            </div>
          </div>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm shadow-2xl text-center animate-in zoom-in duration-200">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">
                {isDeleteAll ? 'Hapus Semua Data?' : isDeleteDuplicates ? 'Hapus Data Ganda?' : 'Hapus Data?'}
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                {isDeleteDuplicates 
                  ? 'Sistem akan menyisakan satu data untuk setiap siswa pada tanggal yang sama.' 
                  : 'Tindakan ini tidak dapat dibatalkan dan akan menghapus data dari database.'}
              </p>
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
