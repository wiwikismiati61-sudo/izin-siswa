import React, { useMemo } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileText, 
  UserX, 
  LogOut, 
  Upload, 
  Download, 
  Save, 
  Trash2,
  Pencil,
  
  X,
  Users,
  AlertTriangle,
  HeartPulse,
  FileCheck2,
  Printer,
  Check,
  RotateCcw,
  
  
  Menu
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend
} from 'recharts';
import { AbsensiEntry, Siswa } from '../types';

// Constants
const KELAS_LIST = [7, 8, 9];
const ABJAD_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLORS = ['#10b981', '#f59e0b', '#f43f5e']; // Sakit, Izin, Alpha

// Helper Components
const ActionLabel: React.FC<{
  label: string;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  variant?: string;
}> = ({ label, accept, onChange, icon, variant }) => {
  const baseClass = "px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border shadow-sm";
  const colorClass = variant === 'emerald' 
    ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300' 
    : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300';
  
  return (
    <label className={`${baseClass} ${colorClass}`}>
      {icon} {label}
      <input type="file" accept={accept} onChange={onChange} className="hidden" />
    </label>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
}> = ({ label, value, color, icon }) => {
  const colorStyles: Record<string, { bg: string, text: string, iconBg: string }> = {
    emerald: { bg: 'bg-white', text: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-600' },
    amber: { bg: 'bg-white', text: 'text-amber-500', iconBg: 'bg-amber-50 text-amber-500' },
    rose: { bg: 'bg-white', text: 'text-rose-600', iconBg: 'bg-rose-50 text-rose-600' },
    slate: { bg: 'bg-white', text: 'text-slate-700', iconBg: 'bg-slate-50 text-slate-500' },
    indigo: { bg: 'bg-white', text: 'text-indigo-600', iconBg: 'bg-indigo-50 text-indigo-600' },
  };
  const style = colorStyles[color] || colorStyles.slate;
  
  return (
    <div className={`${style.bg} p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</h4>
        {icon && <div className={`p-2 rounded-xl ${style.iconBg}`}>{icon}</div>}
      </div>
      <p className={`text-4xl font-black ${style.text}`}>{value}</p>
    </div>
  );
};

interface DashboardProps {
  dataAbsensi: AbsensiEntry[];
  masterSiswa: Siswa[];
  handleImportSiswa: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportExcel: () => void;
  handleBackup: () => void;
  dashboardSelectedClass: string;
  setDashboardSelectedClass: (kelas: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  dataAbsensi, 
  masterSiswa, 
  handleImportSiswa, 
  handleRestore, 
  handleExportExcel, 
  handleBackup,
  dashboardSelectedClass,
  setDashboardSelectedClass
}) => {

  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = dataAbsensi.filter(d => d.tanggal === today);
    return {
      sakit: todayLogs.filter(d => d.keterangan === 'Sakit').length,
      izin: todayLogs.filter(d => d.keterangan === 'Izin').length,
      alpha: todayLogs.filter(d => d.keterangan === 'Alpha').length,
      totalToday: todayLogs.length,
      totalOverall: dataAbsensi.length
    };
  };

  const getChartData = () => {
    return [
      { name: 'Sakit', value: dataAbsensi.filter(d => d.keterangan === 'Sakit').length },
      { name: 'Izin', value: dataAbsensi.filter(d => d.keterangan === 'Izin').length },
      { name: 'Alpha', value: dataAbsensi.filter(d => d.keterangan === 'Alpha').length },
    ];
  };

  const getAbsensiPerKelasData = useMemo(() => {
    const classStats: Record<string, { kelas: string; Sakit: number; Izin: number; Alpha: number }> = {};
    
    dataAbsensi.forEach(d => {
      if (!classStats[d.kelas]) {
        classStats[d.kelas] = { kelas: d.kelas, Sakit: 0, Izin: 0, Alpha: 0 };
      }
      if (d.keterangan === 'Sakit' || d.keterangan === 'Izin' || d.keterangan === 'Alpha') {
        classStats[d.kelas][d.keterangan]++;
      }
    });

    return Object.values(classStats).sort((a, b) => 
      a.kelas.localeCompare(b.kelas, undefined, { numeric: true })
    );
  }, [dataAbsensi]);

  const dashboardStudentSummary = useMemo(() => {
    if (!dashboardSelectedClass) return [];
    const studentsInClass = masterSiswa.filter(s => String(s.Kelas) === dashboardSelectedClass);
    return studentsInClass
      .map(student => {
        const studentAbsences = dataAbsensi.filter(d => d.nama === student.Nama && d.kelas === dashboardSelectedClass);
        const sakit = studentAbsences.filter(d => d.keterangan === 'Sakit').length;
        const izin = studentAbsences.filter(d => d.keterangan === 'Izin').length;
        const alpha = studentAbsences.filter(d => d.keterangan === 'Alpha').length;
        return { name: student.Nama, Sakit: sakit, Izin: izin, Alpha: alpha };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dashboardSelectedClass, masterSiswa, dataAbsensi]);

  const stats = getStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Ringkasan Data</h2>
          <p className="text-slate-500 text-sm font-medium">Analitik kehadiran dan total data absensi</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionLabel 
            label="Impor Siswa" 
            accept=".xlsx, .xls" 
            onChange={handleImportSiswa} 
            icon={<Upload size={14} />} 
          />
          <ActionLabel 
            label="Restore" 
            accept=".json" 
            variant="emerald" 
            onChange={handleRestore} 
            icon={<Save size={14} />} 
          />
          <button onClick={handleExportExcel} className="bg-white border border-indigo-200 text-indigo-700 p-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm transition-all">
            <Download size={14} /> Ekspor Excel
          </button>
          <button onClick={handleBackup} className="bg-slate-800 border border-slate-800 text-white p-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-900 shadow-sm transition-all">
            <Save size={14} /> Backup JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard label="Sakit (Hari Ini)" value={stats.sakit} color="emerald" />
        <StatCard label="Izin (Hari Ini)" value={stats.izin} color="amber" />
        <StatCard label="Alpha (Hari Ini)" value={stats.alpha} color="rose" />
        <StatCard label="Total Absen (Hari Ini)" value={stats.totalToday} color="slate" />
        <StatCard label="Total Seluruh Data" value={stats.totalOverall} color="indigo" icon={<Users className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Multi-Status Per Kelas Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Akumulasi Status per Kelas</h4>
              <span className="text-[10px] bg-slate-50 text-slate-500 px-3 py-1 rounded-full font-bold border border-slate-200">Data Historis</span>
            </div>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getAbsensiPerKelasData} margin={{bottom: 20}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="kelas" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                  <Bar dataKey="Sakit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="Izin" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="Alpha" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* NEW Student Summary Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[450px] hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rekapitulasi Absensi Siswa</h4>
                  <select 
                      value={dashboardSelectedClass}
                      onChange={e => setDashboardSelectedClass(e.target.value)}
                      className="p-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                      <option value="">Pilih Kelas</option>
                      {KELAS_LIST.flatMap(k => 
                          ABJAD_LIST.map(a => <option key={`${k}${a}`} value={`${k}${a}`}>Kelas {k}{a}</option>)
                      )}
                  </select>
              </div>
              <div className="flex-1">
                  {dashboardSelectedClass ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardStudentSummary} margin={{ top: 5, right: 20, left: -10, bottom: 70 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                  dataKey="name" 
                                  angle={-45}
                                  textAnchor="end"
                                  interval={0}
                                  tick={{ fontSize: 9, fill: '#64748b' }} 
                              />
                              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                              <Tooltip 
                                  cursor={{ fill: '#f8fafc' }}
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              />
                              <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '10px', fontWeight: 'bold', position: 'relative', top: -10 }} />
                              <Bar dataKey="Sakit" stackId="a" fill="#10b981" />
                              <Bar dataKey="Izin" stackId="a" fill="#f59e0b" />
                              <Bar dataKey="Alpha" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                          </BarChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 font-bold text-sm">
                          <p>Silakan pilih kelas untuk menampilkan grafik.</p>
                      </div>
                  )}
              </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col h-[816px] lg:h-auto hover:shadow-md transition-shadow">
          <h4 className="text-[11px] font-bold text-slate-500 mb-6 uppercase tracking-wider">Komposisi Status (Total)</h4>
          <div className="flex-1 flex items-center justify-center p-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getChartData()}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-6 border-t grid grid-cols-3 gap-4">
            <div>
              <div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto mb-1"></div>
              <div className="text-[10px] font-bold text-emerald-600">Sakit</div>
            </div>
            <div>
              <div className="w-3 h-3 rounded-full bg-amber-500 mx-auto mb-1"></div>
              <div className="text-[10px] font-bold text-amber-500">Izin</div>
            </div>
            <div>
              <div className="w-3 h-3 rounded-full bg-rose-500 mx-auto mb-1"></div>
              <div className="text-[10px] font-bold text-rose-500">Alpha</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
