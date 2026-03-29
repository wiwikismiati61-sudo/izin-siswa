import React, { useState } from 'react';
import { Upload, Download, Save, Database, UserPlus, X, Eye, EyeOff, Trash2 } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, onSnapshot, deleteDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, getApp } from 'firebase/app';
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
  userRole?: 'admin' | 'viewer' | 'entry' | null;
}

const MasterData: React.FC<MasterDataProps> = ({ handleImportSiswa, handleRestore, handleExportExcel, handleBackup, userRole }) => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'viewer' | 'entry'>('admin');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  React.useEffect(() => {
    if (userRole !== 'admin') return;
    
    const unsub = onSnapshot(collection(db, 'admin_emails'), (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'admin_emails');
    });
    return () => unsub();
  }, [userRole]);

  const handleDeleteUser = (emailId: string) => {
    setUserToDelete(emailId);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(db, 'admin_emails', userToDelete));
      
      // Also try to delete from users collection if exists
      const q = query(collection(db, 'users'), where('email', '==', userToDelete));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, 'users', docSnap.id));
      });
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Gagal menghapus user.");
      setUserToDelete(null);
    }
  };

  const handleRoleChange = async (emailId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'admin_emails', emailId), { role: newRole });
      
      // Also try to update users collection if exists
      const q = query(collection(db, 'users'), where('email', '==', emailId));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (docSnap) => {
        await updateDoc(doc(db, 'users', docSnap.id), { role: newRole });
      });
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Gagal mengubah role user.");
    }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formattedEmail = username.includes('@') ? username.toLowerCase() : `${username.toLowerCase()}@sistem.local`;

    try {
      // Use a secondary app to create the user without signing out the current admin
      let secondaryApp;
      try {
        secondaryApp = getApp("SecondaryApp");
      } catch (e) {
        secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      }
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formattedEmail, password);
      
      // Write to users collection using the main app (which is still logged in as admin)
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: formattedEmail,
        username: username.toLowerCase(),
        role: role,
        createdAt: serverTimestamp()
      });

      // Also add to admin_emails just in case
      await setDoc(doc(db, 'admin_emails', formattedEmail), {
        email: formattedEmail,
        username: username.toLowerCase(),
        role: role,
        addedAt: serverTimestamp()
      });

      // Sign out the secondary app
      await signOut(secondaryAuth);

      setSuccess("User berhasil didaftarkan!");
      setUsername('');
      setPassword('');
      setTimeout(() => {
        setShowRegisterModal(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      if (err.code !== 'auth/email-already-in-use') {
        console.error("Register Error:", err);
      }
      
      if (err.code === 'auth/email-already-in-use') {
        // The user already exists in Auth. We can't get their UID easily, 
        // but we can add their email to admin_emails so they get admin access when they log in.
        try {
          await setDoc(doc(db, 'admin_emails', formattedEmail), {
            email: formattedEmail,
            username: username.toLowerCase(),
            role: role,
            addedAt: serverTimestamp()
          });
          setSuccess("User sudah ada, akses berhasil ditambahkan!");
          setUsername('');
          setPassword('');
          setTimeout(() => {
            setShowRegisterModal(false);
            setSuccess(null);
          }, 2000);
        } catch (dbErr) {
          console.error("Error adding to admin_emails:", dbErr);
          setError("Gagal memberikan akses ke user yang sudah terdaftar.");
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

  if (userRole !== 'admin' && userRole !== 'entry') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-in fade-in duration-500">
        <div className="p-4 bg-rose-100 text-rose-600 rounded-full">
          <X size={48} />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Akses Ditolak</h2>
        <p className="text-slate-500 text-center max-w-md">
          Halaman Master Data hanya dapat diakses oleh Administrator dan Entry Data. Silakan hubungi admin utama jika Anda membutuhkan akses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Master Data</h2>
        <p className="text-slate-500 text-xs font-medium">Kelola data sistem, impor, ekspor, dan pencadangan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {userRole === 'admin' && (
          <ActionCard
            title="Daftar User Baru"
            description="Tambahkan akses login (email & password) untuk admin baru."
            icon={<UserPlus size={24} />}
            onClick={() => setShowRegisterModal(true)}
            color="indigo"
          />
        )}
        {userRole === 'admin' && (
          <ActionCard
            title="Impor Data Siswa"
            description="Masukkan data siswa baru menggunakan file Excel (.xlsx, .xls)."
            icon={<Upload size={24} />}
            isUpload
            accept=".xlsx, .xls"
            onChange={handleImportSiswa}
            color="indigo"
          />
        )}
        <ActionCard
          title="Ekspor Laporan"
          description="Unduh seluruh log absensi ke dalam format Excel."
          icon={<Download size={24} />}
          onClick={handleExportExcel}
          color="emerald"
        />
        {userRole === 'admin' && (
          <ActionCard
            title="Backup Data"
            description="Simpan seluruh data (Siswa & Absensi) ke file JSON lokal."
            icon={<Save size={24} />}
            onClick={handleBackup}
            color="amber"
          />
        )}
        {userRole === 'admin' && (
          <ActionCard
            title="Restore Data"
            description="Pulihkan data sistem dari file backup JSON sebelumnya."
            icon={<Database size={24} />}
            isUpload
            accept=".json"
            onChange={handleRestore}
            color="rose"
          />
        )}
      </div>

      {/* User List Section */}
      {userRole === 'admin' && (
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-800">Daftar Akses User</h3>
              <p className="text-sm text-slate-500 font-medium">Kelola hak akses pengguna aplikasi</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm font-bold text-slate-700">{u.email}</td>
                    <td className="p-4">
                      <select
                        value={u.role || 'admin'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      >
                        <option value="admin">Full Access</option>
                        <option value="viewer">Hanya Views</option>
                        <option value="entry">Entry Data (Tidak Boleh Delete)</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Akses"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {usersList.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500 font-medium">
                      Belum ada data user tambahan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  {success}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">User Name</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="admin123"
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

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Role Akses</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'viewer' | 'entry')}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="admin">Full Access (Admin)</option>
                  <option value="entry">Entry Data (Tidak Boleh Delete)</option>
                  <option value="viewer">Hanya Views (Viewer)</option>
                </select>
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

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-lg font-black">Konfirmasi Hapus</h3>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 font-medium mb-6">
                Apakah Anda yakin ingin menghapus akses untuk <span className="font-bold text-slate-800">{userToDelete}</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-rose-200"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterData;
