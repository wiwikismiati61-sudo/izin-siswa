import React from 'react';
import { LogIn } from 'lucide-react';

interface LoginProps {
  authForm: { username: string; password: string };
  setAuthForm: React.Dispatch<React.SetStateAction<{ username: string; password: string }>>;
  handleLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ authForm, setAuthForm, handleLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-8 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-indigo-600 rounded-b-[100px] sm:rounded-b-[200px] opacity-10 pointer-events-none"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>
      <div className="absolute top-40 -left-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 mx-auto mb-5 flex items-center justify-center">
            <img src="https://iili.io/KDFk4fI.png" alt="Logo SMPN 7 Pasuruan" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Si-Absensi</h1>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">
            Sistem Informasi Absensi Siswa<br/>SMP Negeri 7 Pasuruan
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Selamat Datang</h2>
            <p className="text-slate-500 text-sm">Silakan masuk untuk melanjutkan.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
              <input
                type="text"
                placeholder="Masukkan username"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={authForm.username}
                onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={authForm.password}
                onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-3.5 mt-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-sm focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group"
            >
              <span>Masuk Sekarang</span>
              <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Penyimpanan Lokal • Versi 1.0<br/>
            © {new Date().getFullYear()} Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
