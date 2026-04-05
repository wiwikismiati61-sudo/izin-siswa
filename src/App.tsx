import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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
  getDoc,
  limit
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const errorStr = this.state.error?.message || "";
      let isQuotaError = false;
      try {
        const parsed = JSON.parse(errorStr);
        if (parsed.error && parsed.error.toLowerCase().includes("quota")) {
          isQuotaError = true;
        }
      } catch (e) {
        if (errorStr.toLowerCase().includes("quota")) {
          isQuotaError = true;
        }
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-200">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-4">
              {isQuotaError ? "Kuota Firestore Habis" : "Terjadi Kesalahan"}
            </h1>
            <p className="text-slate-600 mb-8 leading-relaxed">
              {isQuotaError 
                ? "Batas penggunaan gratis Firestore untuk hari ini telah tercapai. Kuota akan direset secara otomatis besok pagi. Silakan coba lagi nanti."
                : "Aplikasi mengalami masalah teknis. Silakan muat ulang halaman atau hubungi administrator."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              Muat Ulang Halaman
            </button>
            {isQuotaError && (
              <p className="mt-6 text-xs text-slate-400 font-medium italic">
                Info: Detail kuota dapat dilihat di konsol Firebase (Spark Plan).
              </p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'viewer' | 'entry' | null>(null);

  // Data State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form_izin' | 'rekap_izin' | 'input' | 'report' | 'peringatan' | 'master' | 'kalender'>('dashboard');
  const [masterSiswa, setMasterSiswa] = useState<Siswa[]>([]);
  const [izinWaliData, setIzinWaliData] = useState<IzinWaliMurid[]>([]);
  const [editingEntry, setEditingEntry] = useState<AbsensiEntry | null>(null);
  const [dashboardSelectedClass, setDashboardSelectedClass] = useState<string>('');
  const [errorToThrow, setErrorToThrow] = useState<Error | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [warningData, setWarningData] = useState<{sakit: any[], izin: any[], alpha: any[]}>({sakit: [], izin: [], alpha: []});
  const [isWarningLoading, setIsWarningLoading] = useState(false);
  
  // UI States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleteAll, setIsDeleteAll] = useState(false);
  const [isDeleteDuplicates, setIsDeleteDuplicates] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentForPrint, setStudentForPrint] = useState<any | null>(null); // Ganti `any` dengan tipe yang sesuai
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (errorToThrow) {
    throw errorToThrow;
  }

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

    // Optimized: Fetch master_siswa from bundle first to save reads
    const fetchSiswa = async () => {
      try {
        const cached = localStorage.getItem('master_siswa_cache');
        if (cached) {
          setMasterSiswa(JSON.parse(cached));
          setIsDataLoading(false);
          return;
        }

        // Try to fetch from bundle first (1 read instead of 800)
        const bundleDoc = await getDoc(doc(db, 'master_data', 'siswa_bundle'));
        if (bundleDoc.exists()) {
          const siswa = bundleDoc.data().students as Siswa[];
          setMasterSiswa(siswa);
          localStorage.setItem('master_siswa_cache', JSON.stringify(siswa));
          setIsDataLoading(false);
          return;
        }

        // Fallback to full collection fetch if bundle doesn't exist
        const snapshot = await getDocs(query(collection(db, 'master_siswa'), limit(800)));
        const siswa = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Siswa[];
        setMasterSiswa(siswa);
        localStorage.setItem('master_siswa_cache', JSON.stringify(siswa));
        
        // If admin, create the bundle for future users
        if (userRole === 'admin') {
          await setDoc(doc(db, 'master_data', 'siswa_bundle'), { students: siswa, updatedAt: serverTimestamp() });
        }
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.LIST, 'master_siswa');
        } catch (e: any) {
          setErrorToThrow(e);
        }
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchSiswa();

    let unsubIzin: () => void = () => {};

    if (isLoggedIn && (userRole === 'admin' || userRole === 'entry')) {
      // Optimized: Only fetch the last 50 izin requests
      const qIzin = query(collection(db, 'izin_wali'), orderBy('createdAt', 'desc'), limit(50));
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
        try {
          handleFirestoreError(error, OperationType.LIST, 'izin_wali');
        } catch (e: any) {
          setErrorToThrow(e);
        }
      });
    } else {
      setIzinWaliData([]);
    }

    return () => {
      unsubIzin();
    };
  }, [isAuthReady, isLoggedIn, userRole, activeTab]);

  // Fetch warning data when peringatan tab is active
  useEffect(() => {
    if (activeTab !== 'peringatan') return;

    const fetchWarningData = async () => {
      setIsWarningLoading(true);
      try {
        // Fetch last 500 entries to calculate warnings
        const q = query(collection(db, 'absensi_log'), orderBy('tanggal', 'desc'), limit(500));
        const snapshot = await getDocs(q);
        const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AbsensiEntry[];
        
        const alphaMap: Record<string, { name: string; kelas: string; count: number }> = {};
        const sakitMap: Record<string, { name: string; kelas: string; count: number }> = {};
        const izinMap: Record<string, { name: string; kelas: string; count: number }> = {};

        entries.forEach(curr => {
          const key = `${curr.nama}|${curr.kelas}`;
          if (curr.keterangan === 'Alpha') {
            if (!alphaMap[key]) alphaMap[key] = { name: curr.nama, kelas: curr.kelas, count: 0 };
            alphaMap[key].count++;
          } else if (curr.keterangan === 'Sakit') {
            if (!sakitMap[key]) sakitMap[key] = { name: curr.nama, kelas: curr.kelas, count: 0 };
            sakitMap[key].count++;
          } else if (curr.keterangan === 'Izin') {
            if (!izinMap[key]) izinMap[key] = { name: curr.nama, kelas: curr.kelas, count: 0 };
            izinMap[key].count++;
          }
        });

        setWarningData({
          alpha: Object.values(alphaMap).filter(s => s.count > 2),
          sakit: Object.values(sakitMap).filter(s => s.count > 4),
          izin: Object.values(izinMap).filter(s => s.count > 4)
        });
      } catch (error) {
        console.error("Error fetching warning data:", error);
      } finally {
        setIsWarningLoading(false);
      }
    };

    fetchWarningData();
  }, [activeTab]);

  const handleRefreshSiswa = async () => {
    setIsDataLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'master_siswa'), limit(800)));
      const siswa = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Siswa[];
      setMasterSiswa(siswa);
      localStorage.setItem('master_siswa_cache', JSON.stringify(siswa));
      
      // Update bundle
      await setDoc(doc(db, 'master_data', 'siswa_bundle'), { students: siswa, updatedAt: serverTimestamp() });
      
      alert("Data siswa berhasil diperbarui!");
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, 'master_siswa');
      } catch (e: any) {
        setErrorToThrow(e);
      }
    } finally {
      setIsDataLoading(false);
    }
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
        
        // Update bundle after import
        const snapshot = await getDocs(query(collection(db, 'master_siswa'), limit(800)));
        const siswa = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Siswa[];
        await setDoc(doc(db, 'master_data', 'siswa_bundle'), { students: siswa, updatedAt: serverTimestamp() });
        setMasterSiswa(siswa);
        localStorage.setItem('master_siswa_cache', JSON.stringify(siswa));
        
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

        try {
          // Fetch last 500 records to check for duplicates
          const snapshot = await getDocs(query(collection(db, 'absensi_log'), orderBy('tanggal', 'desc'), limit(500)));
          const existingData = snapshot.docs.map(doc => doc.data()) as AbsensiEntry[];
          const existingEntries = new Set(existingData.map(d => `${d.tanggal}|${d.nama}`));

          const newEntries: any[] = [];
          json.forEach((row) => {
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
              const batch = writeBatch(db);
              newEntries.forEach(entry => {
                  const newDoc = doc(collection(db, 'absensi_log'));
                  batch.set(newDoc, entry);
              });
              await batch.commit();
              alert(`${newEntries.length} data baru berhasil diimpor!`);
          } else {
              alert('Tidak ada data baru untuk diimpor atau semua data sudah ada.');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'absensi_log');
        }
        e.target.value = ''; 
    };
    reader.readAsBinaryString(file);
  };

  const handleBackup = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, 'absensi_log'), orderBy('tanggal', 'desc'), limit(1000)));
      const absensi = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AbsensiEntry[];
      
      const blob = new Blob([JSON.stringify({ master: masterSiswa, absensi: absensi })], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_Absensi_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup error:", error);
      alert("Gagal melakukan backup data.");
    }
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
        
        // Update bundle after restore
        const snapshot = await getDocs(query(collection(db, 'master_siswa'), limit(800)));
        const siswa = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Siswa[];
        await setDoc(doc(db, 'master_data', 'siswa_bundle'), { students: siswa, updatedAt: serverTimestamp() });
        setMasterSiswa(siswa);
        localStorage.setItem('master_siswa_cache', JSON.stringify(siswa));

        alert('Data Berhasil Dipulihkan!');
      } catch (error) {
        alert('File tidak valid atau gagal memulihkan data');
        console.error(error);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportExcel = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, 'absensi_log'), orderBy('tanggal', 'desc'), limit(1000)));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AbsensiEntry[];
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Log Absensi");

      // Set column widths
      worksheet.columns = [
        { width: 35 }, // A: Nama Siswa
        { width: 10 }, // B: Kelas
        { width: 15 }, // C: Tanggal
        { width: 15 }, // D: Status
        { width: 30 }  // E: Keterangan
      ];

      // --- KOP SURAT ---
      worksheet.mergeCells('B1:E1');
      const kop1 = worksheet.getCell('B1');
      kop1.value = 'PEMERINTAH KOTA PASURUAN';
      kop1.font = { name: 'Arial', size: 14, bold: true };
      kop1.alignment = { horizontal: 'center' };

      worksheet.mergeCells('B2:E2');
      const kop2 = worksheet.getCell('B2');
      kop2.value = 'SMP NEGERI 7';
      kop2.font = { name: 'Arial', size: 18, bold: true };
      kop2.alignment = { horizontal: 'center' };

      worksheet.mergeCells('B3:E3');
      const kop3 = worksheet.getCell('B3');
      kop3.value = 'Jalan Simpang Slamet Riadi Nomor 2, Kota Pasuruan, Jawa Timur, 67139';
      kop3.font = { name: 'Arial', size: 10 };
      kop3.alignment = { horizontal: 'center' };

      worksheet.mergeCells('B4:E4');
      const kop4 = worksheet.getCell('B4');
      kop4.value = 'Telepon (0343) 426845';
      kop4.font = { name: 'Arial', size: 10 };
      kop4.alignment = { horizontal: 'center' };

      worksheet.mergeCells('B5:E5');
      const kop5 = worksheet.getCell('B5');
      kop5.value = 'Pos-el smp7pas@yahoo.co.id , Laman www.smpn7pasuruan.sch.id';
      kop5.font = { name: 'Arial', size: 10, italic: true };
      kop5.alignment = { horizontal: 'center' };

      // Blue line
      worksheet.mergeCells('A6:E6');
      const lineCell = worksheet.getCell('A6');
      lineCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' }
      };
      worksheet.getRow(6).height = 3;

      // Title
      worksheet.mergeCells('A8:E8');
      const titleCell = worksheet.getCell('A8');
      titleCell.value = 'LAPORAN ABSENSI SISWA';
      titleCell.font = { name: 'Arial', size: 20, bold: true };
      titleCell.alignment = { horizontal: 'center' };

      // Fetch and add Logo
      try {
        const response = await fetch('https://iili.io/KDFk4fI.png');
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const logoId = workbook.addImage({
            buffer: arrayBuffer,
            extension: 'png',
          });
          
          worksheet.addImage(logoId, {
            tl: { col: 0, row: 0 },
            br: { col: 1, row: 5 },
            editAs: 'oneCell'
          });
        }
      } catch (error) {
        console.error("Failed to load logo", error);
      }

      // Table Header
      const headerRow = worksheet.getRow(10);
      headerRow.values = ['NAMA SISWA', 'KELAS', 'TANGGAL', 'STATUS', 'KETERANGAN'];
      headerRow.height = 25;
      
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4F81BD' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Table Data
      data.forEach((item, index) => {
        const row = worksheet.addRow([
          item.nama.toUpperCase(),
          item.kelas,
          item.tanggal,
          item.keterangan,
          ''
        ]);

        const isEven = index % 2 === 1;

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle' };
          
          if (isEven) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F7FF' } // Light blue for alternating rows
            };
          }
        });
      });

      // Signature Area
      const lastRow = worksheet.rowCount + 2;
      
      // Left side
      worksheet.getCell(`A${lastRow}`).value = 'Mengetahui';
      worksheet.getCell(`A${lastRow + 1}`).value = 'Kepala Sekolah';
      worksheet.getCell(`A${lastRow + 5}`).value = 'NUR FADILAH, S.Pd';
      worksheet.getCell(`A${lastRow + 5}`).font = { bold: true, underline: true };
      worksheet.getCell(`A${lastRow + 6}`).value = 'NIP. 19860410 201001 2 030';

      // Right side
      const today = new Date();
      const formattedDate = `${today.getDate()} ${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][today.getMonth()]} ${today.getFullYear()}`;
      
      worksheet.getCell(`D${lastRow}`).value = `Pasuruan, ${formattedDate}`;
      worksheet.getCell(`D${lastRow + 1}`).value = 'Guru BK';
      worksheet.getCell(`D${lastRow + 5}`).value = 'WIWIK ISMIATI, S.Pd';
      worksheet.getCell(`D${lastRow + 5}`).font = { bold: true, underline: true };
      worksheet.getCell(`D${lastRow + 6}`).value = 'NIP. 19831116 200904 2 003';

      // Generate and save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Laporan_Absensi_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const executeDelete = async () => {
    try {
      if (isDeleteAll) {
        const batch = writeBatch(db);
        const snapshot = await getDocs(collection(db, 'absensi_log'));
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } else if (isDeleteDuplicates) {
        const snapshot = await getDocs(query(collection(db, 'absensi_log'), orderBy('tanggal', 'desc'), limit(1000)));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AbsensiEntry[];
        
        const seen = new Set<string>();
        const toDelete: string[] = [];
        
        data.forEach(entry => {
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
      try {
        handleFirestoreError(error, OperationType.DELETE, 'absensi_log');
      } catch (e: any) {
        setErrorToThrow(e);
      }
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

  const sakitWarningCount = warningData.sakit.length;
  const izinWarningCount = warningData.izin.length;
  const panggilanCount = warningData.alpha.length;
  const badgeCount = sakitWarningCount + izinWarningCount + panggilanCount;
  const izinBadgeCount = izinWaliData.filter(i => !i.statusInput).length;

  return (
    <ErrorBoundary>
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
                masterSiswa={masterSiswa}
                dashboardSelectedClass={dashboardSelectedClass}
                setDashboardSelectedClass={setDashboardSelectedClass}
                setErrorToThrow={setErrorToThrow}
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
                data={[]}
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
                setErrorToThrow={setErrorToThrow}
              />
            )}

            {activeTab === 'peringatan' && (
              <Peringatan 
                sakitWarningData={warningData.sakit}
                izinWarningData={warningData.izin}
                panggilanData={warningData.alpha}
                setStudentForPrint={setStudentForPrint}
                isLoggedIn={isLoggedIn}
                isLoading={isWarningLoading}
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
                    onRefreshSiswa={handleRefreshSiswa}
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
    </ErrorBoundary>
  );
}

export default App;
