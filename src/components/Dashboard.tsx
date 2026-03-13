import React, { useMemo } from 'react';
import { 
  Users
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
    <div className={`${style.bg} p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</h4>
        {icon && <div className={`p-1.5 rounded-lg ${style.iconBg}`}>{icon}</div>}
      </div>
      <p className={`text-3xl font-black ${style.text}`}>{value}</p>
    </div>
  );
};

interface DashboardProps {
  dataAbsensi: AbsensiEntry[];
  masterSiswa: Siswa[];
  dashboardSelectedClass: string;
  setDashboardSelectedClass: (kelas: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  dataAbsensi, 
  masterSiswa, 
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Ringkasan Data</h2>
          <p className="text-slate-500 text-xs font-medium">Analitik kehadiran dan total data absensi</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Sakit (Hari Ini)" value={stats.sakit} color="emerald" />
        <StatCard label="Izin (Hari Ini)" value={stats.izin} color="amber" />
        <StatCard label="Alpha (Hari Ini)" value={stats.alpha} color="rose" />
        <StatCard label="Total Absen (Hari Ini)" value={stats.totalToday} color="slate" />
        <StatCard label="Total Seluruh Data" value={stats.totalOverall} color="indigo" icon={<Users className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Multi-Status Per Kelas Chart */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-[320px] hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Akumulasi Status per Kelas</h4>
              <span className="text-[9px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full font-bold border border-slate-200">Data Historis</span>
            </div>
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getAbsensiPerKelasData} margin={{bottom: 20}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="kelas" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '9px', fontWeight: 'bold' }} />
                  <Bar dataKey="Sakit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={10} />
                  <Bar dataKey="Izin" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={10} />
                  <Bar dataKey="Alpha" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* NEW Student Summary Chart */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[380px] hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rekapitulasi Absensi Siswa</h4>
                  <select 
                      value={dashboardSelectedClass}
                      onChange={e => setDashboardSelectedClass(e.target.value)}
                      className="p-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
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

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center flex flex-col h-auto hover:shadow-md transition-shadow">
          <h4 className="text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-wider">Komposisi Status (Total)</h4>
          <div className="flex-1 flex items-center justify-center p-2">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={getChartData()}
                  innerRadius={50}
                  outerRadius={80}
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
