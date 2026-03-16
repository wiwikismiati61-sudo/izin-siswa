import React, { useState } from 'react';
import { LogIn, ShieldAlert } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if the logged in user is the authorized admin
      const authorizedEmail = "wiwikismiati61@guru.smp.belajar.id";
      if (result.user.email !== authorizedEmail) {
        setError(`Akun ${result.user.email} tidak memiliki akses admin. Silakan gunakan akun yang terdaftar.`);
        // Note: We don't sign out here, but the security rules will prevent writes
      } else {
        onLogin();
      }
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError("Domain ini belum terdaftar di Firebase Console. Silakan tambahkan 'izin-siswa.vercel.app' ke Authorized Domains di Firebase Auth.");
      } else {
        setError("Gagal login dengan Google. Pastikan koneksi internet stabil.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 w-full max-w-sm animate-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <LogIn size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Login Admin</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Gunakan akun Google untuk mengelola database</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex gap-3 items-start">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <p className="text-xs font-bold leading-relaxed">{error}</p>
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          )}
          <span>{loading ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
        </button>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
            Hanya Admin Terverifikasi
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
