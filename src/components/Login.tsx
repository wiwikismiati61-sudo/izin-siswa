import React from 'react';
import { LogIn } from 'lucide-react';

interface LoginProps {
  authForm: { username: string; password: string };
  setAuthForm: React.Dispatch<React.SetStateAction<{ username: string; password: string }>>;
  handleLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ authForm, setAuthForm, handleLogin }) => {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop" 
            alt="Education Background" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-end p-16 w-full">
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 mb-6 flex items-center justify-center">
              <img src="https://iili.io/KDFk4fI.png" alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight mb-4 leading-tight">
              Sistem Informasi<br/>Absensi Siswa
            </h1>
            <p className="text-lg text-slate-300 max-w-md font-medium">
              Platform manajemen kehadiran siswa yang terintegrasi, cepat, dan aman untuk SMP Negeri 7 Pasuruan.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-bold text-slate-400 uppercase tracking-widest">
            <span>Penyimpanan Lokal</span>
            <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
            <span>Versi 1.0</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-slate-50 lg:bg-white relative">
        {/* Mobile Logo (Hidden on Desktop) */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-3">
           <img src="https://iili.io/KDFk4fI.png" alt="Logo" className="w-10 h-10 object-contain" />
           <span className="font-black text-slate-800 tracking-tight">Si-Absensi</span>
        </div>

        <div className="w-full max-w-md space-y-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Selamat Datang</h2>
            <p className="text-slate-500 font-medium">Silakan masuk ke akun Anda untuk melanjutkan.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
              <input
                type="text"
                placeholder="Masukkan username Anda"
                className="w-full px-5 py-4 bg-slate-50 lg:bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={authForm.username}
                onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-slate-50 lg:bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={authForm.password}
                onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-4 mt-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-sm focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group"
            >
              <span>Masuk ke Dashboard</span>
              <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-semibold">
              © {new Date().getFullYear()} SMP Negeri 7 Pasuruan.<br/>Hak Cipta Dilindungi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
