import React, { useState } from 'react';
import { Upload, Download, Save, Database, UserPlus, X, Eye, EyeOff } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const ActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isUpload?: boolean;
  accept?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  color: 'indigo' | 'emerald' | 'amber' | 'rose';
}> = ({ title, description, icon, onClick, isUpload, accept, onChange, color }) => {
  const colorStyles = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 group-hover:bg-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200 group-hover:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-200 group-hover:bg-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-200 group-hover:bg-rose-100',
  };

  const content = (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col items-start text-left cursor-pointer group">
      <div className={`p-3 rounded-xl mb-4 transition-colors border ${colorStyles[color]}`}>
        {icon}
      </div>
      <h3 className="text-lg font-black text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed">{description}</p>
    </div>
  );

  if (isUpload) {
    return (
      <label className="block h-full cursor-pointer">
        {content}
        <input type="file" accept={accept} onChange={onChange} className="hidden" />
      </label>
    );
  }

  return (
    <button onClick={onClick} className="block w-full h-full text-left">
      {content}
    </button>
  );
};

interface MasterDataProps {
  handleImportSiswa: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportExcel: () => void;
  handleBackup: () => void;
}

const MasterData: React.FC<MasterDataProps> = ({ handleImportSiswa, handleRestore, handleExportExcel, handleBackup }) => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Use a secondary app to create the user without signing out the current admin
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      
      // Write to users collection using the main app (which is still logged in as admin)
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        role: 'admin',
        createdAt: serverTimestamp()
      });

      // Also add to admin_emails just in case
      await setDoc(doc(db, 'admin_emails', email.toLowerCase()), {
        email: email.toLowerCase(),
        addedAt: serverTimestamp()
      });

      // Sign out the secondary app
      await signOut(secondaryAuth);

      setSuccess(true);
      setEmail('');
      setPassword('');
      setTimeout(() => {
        setShowRegisterModal(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Register Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        // The user already exists in Auth. We can't get their UID easily, 
        // but we can add their email to admin_emails so they get admin access when they log in.
        try {
          await setDoc(doc(db, 'admin_emails', email.toLowerCase()), {
            email: email.toLowerCase(),
            addedAt: serverTimestamp()
          });
          setSuccess(true);
          setEmail('');
          setPassword('');
          setTimeout(() => {
            setShowRegisterModal(false);
            setSuccess(false);
          }, 2000);
        } catch (dbErr) {
          console.error("Error adding to admin_emails:", dbErr);
          setError("Gagal memberikan akses admin ke email yang sudah terdaftar.");
        }
      } else if (err.code === 'auth/weak-password') {
        setError("Password terlalu lemah (minimal 6 karakter).");
      } else {
        setError("Gagal mendaftarkan user baru. Pastikan koneksi stabil.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Master Data</h2>
        <p className="text-slate-500 text-xs font-medium">Kelola data sistem, impor, ekspor, dan pencadangan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <ActionCard
          title="Daftar User Baru"
          description="Tambahkan akses login (email & password) untuk admin baru."
          icon={<UserPlus size={24} />}
          onClick={() => setShowRegisterModal(true)}
          color="indigo"
        />
        <ActionCard
          title="Impor Data Siswa"
          description="Masukkan data siswa baru menggunakan file Excel (.xlsx, .xls)."
          icon={<Upload size={24} />}
          isUpload
          accept=".xlsx, .xls"
          onChange={handleImportSiswa}
          color="indigo"
        />
        <ActionCard
          title="Ekspor Laporan"
          description="Unduh seluruh log absensi ke dalam format Excel."
          icon={<Download size={24} />}
          onClick={handleExportExcel}
          color="emerald"
        />
        <ActionCard
          title="Backup Data"
          description="Simpan seluruh data (Siswa & Absensi) ke file JSON lokal."
          icon={<Save size={24} />}
          onClick={handleBackup}
          color="amber"
        />
        <ActionCard
          title="Restore Data"
          description="Pulihkan data sistem dari file backup JSON sebelumnya."
          icon={<Database size={24} />}
          isUpload
          accept=".json"
          onChange={handleRestore}
          color="rose"
        />
      </div>

      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800">Daftar User Baru</h3>
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRegisterUser} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 text-sm font-bold rounded-xl border border-rose-100">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl border border-emerald-100">
                  User berhasil didaftarkan!
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="admin@sekolah.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm shadow-indigo-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Mendaftarkan...' : 'Daftarkan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterData;
