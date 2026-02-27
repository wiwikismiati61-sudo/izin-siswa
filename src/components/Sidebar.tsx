import React from 'react';
import { LayoutDashboard, ClipboardList, FileText, AlertTriangle, LogOut, FileCheck2, X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'dashboard' | 'input' | 'report' | 'peringatan') => void;
  editingEntry: any;
  badgeCount: number;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
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
    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all font-bold ${ 
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-100'
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

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, editingEntry, badgeCount, isSidebarOpen, setIsSidebarOpen }) => {
  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-slate-200 p-6 flex flex-col justify-between transform ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none md:flex-shrink-0 h-screen overflow-y-auto`}>
      <div>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
              <FileCheck2 className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Si-Absensi</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Lokal Optimizer</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6 px-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Menu Utama</p>
          <nav className="space-y-1.5">
            <SidebarLink 
              active={activeTab === 'dashboard'} 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
              icon={<LayoutDashboard size={18} />} 
              label="Dashboard" 
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
          </nav>
        </div>
      </div>
      
      <div className="pt-6 border-t border-slate-100">
        <button 
          onClick={() => window.location.reload()} 
          className="flex items-center gap-3 w-full p-3.5 text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition-colors group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Keluar Sistem
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
