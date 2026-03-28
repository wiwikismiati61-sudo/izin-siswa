import React, { useState } from 'react';
import { LogIn, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const role = await checkUserRole(result.user);
      if (!role) {
        setError(`Akun ${result.user.email} tidak memiliki akses.`);
        await auth.signOut();
      } else {
        onLogin();
      }
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError(`Domain ini belum terdaftar di Firebase Console. Silakan tambahkan domain aplikasi ini ke Authorized Domains di Firebase Auth.`);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Popup login ditutup sebelum selesai. Silakan coba lagi.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup login diblokir oleh browser. Silakan izinkan popup untuk situs ini.");
      } else {
        setError(`Gagal login dengan Google (${err.code || err.message}). Pastikan koneksi internet stabil.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    setError(null);
    try {
      const formattedEmail = username.includes('@') ? username.toLowerCase() : `${username.toLowerCase()}@sistem.local`;
      const result = await signInWithEmailAndPassword(auth, formattedEmail, password);
      
      const role = await checkUserRole(result.user);
      if (!role) {
        setError(`Akun ${result.user.email} tidak memiliki akses.`);
        await auth.signOut();
      } else {
        onLogin();
      }
    } catch (err: any) {
      console.error("Email Login Error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Username atau password salah.");
      } else {
        setError("Gagal login. Pastikan koneksi internet stabil.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh] py-10">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 w-full max-w-sm animate-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <LogIn size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Login Admin</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Masuk untuk mengelola database</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex gap-3 items-start">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <p className="text-xs font-bold leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              placeholder="User Name / Email"
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button 
            type="submit"
            disabled={loading || !username || !password}
            className={`w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm shadow-indigo-200 ${loading || !username || !password ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="relative flex items-center py-2 mb-6">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Atau</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          )}
          <span>Masuk dengan Google</span>
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
