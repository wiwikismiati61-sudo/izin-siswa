import React from 'react';
import { LayoutDashboard, ClipboardList, FileText, AlertTriangle, LogOut, FileCheck2, X, Database, Calendar as CalendarIcon, UserCheck, Inbox } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'dashboard' | 'form_izin' | 'rekap_izin' | 'input' | 'report' | 'peringatan' | 'master' | 'kalender') => void;
  editingEntry: any;
  badgeCount: number;
  izinBadgeCount: number;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const SidebarLink: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}> = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all font-bold text-sm ${ 
      active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span>{label}</span>
    </div>
    {badge ? (
      <span className="bg-rose-500 text-white text-[10px] px-2 py-1 rounded-full">{badge}</span>
    ) : null}
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, editingEntry, badgeCount, izinBadgeCount, isSidebarOpen, setIsSidebarOpen, isLoggedIn, onLogout }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (err) {
      console.error("Logout Error:", err);
      onLogout(); // Still call onLogout to clear local state
    }
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-slate-200 p-4 flex flex-col justify-between transform ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none md:flex-shrink-0 h-screen overflow-y-auto`}>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-md shadow-indigo-600/20">
              <FileCheck2 className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">Si-Absensi</h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Lokal Optimizer</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="mb-4 px-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Menu Utama</p>
          <nav className="space-y-1">
            <SidebarLink 
              active={activeTab === 'dashboard'} 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
              icon={<LayoutDashboard size={18} />} 
              label="Dashboard" 
            />
            <SidebarLink 
              active={activeTab === 'form_izin'} 
              onClick={() => { setActiveTab('form_izin'); setIsSidebarOpen(false); }} 
              icon={<UserCheck size={18} />} 
              label="Form Izin Walimurid" 
            />
            <SidebarLink 
              active={activeTab === 'input'} 
              onClick={() => {
                setActiveTab('input');
                setIsSidebarOpen(false);
              }} 
              icon={<ClipboardList size={18} />} 
              label={editingEntry ? "Edit Data" : "Input Data"} 
            />
            {isLoggedIn && (
              <SidebarLink 
                active={activeTab === 'rekap_izin'} 
                onClick={() => { setActiveTab('rekap_izin'); setIsSidebarOpen(false); }} 
                icon={<Inbox size={18} />} 
                label="Rekap Izin Wali" 
                badge={izinBadgeCount > 0 ? izinBadgeCount : undefined}
              />
            )}
            <SidebarLink 
              active={activeTab === 'report'} 
              onClick={() => { setActiveTab('report'); setIsSidebarOpen(false); }} 
              icon={<FileText size={18} />} 
              label="Laporan" 
            />
            <SidebarLink 
              active={activeTab === 'peringatan'} 
              onClick={() => { setActiveTab('peringatan'); setIsSidebarOpen(false); }} 
              icon={<AlertTriangle size={18} />} 
              label="Peringatan"
              badge={badgeCount > 0 ? badgeCount : undefined}
            />
            <SidebarLink 
              active={activeTab === 'kalender'} 
              onClick={() => { setActiveTab('kalender'); setIsSidebarOpen(false); }} 
              icon={<CalendarIcon size={18} />} 
              label="Kalender"
            />
            <SidebarLink 
              active={activeTab === 'master'} 
              onClick={() => { setActiveTab('master'); setIsSidebarOpen(false); }} 
              icon={<Database size={18} />} 
              label="Master Data"
            />
          </nav>
        </div>
      </div>
      
      {isLoggedIn && (
        <div className="pt-4 border-t border-slate-100">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 w-full p-3 text-sm text-rose-600 font-bold hover:bg-rose-50 rounded-lg transition-colors group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Keluar Sistem
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
