import React from 'react';
import { HeartPulse, FileCheck2, UserX } from 'lucide-react';

interface StudentWarning {
  name: string;
  kelas: string;
  count: number;
}

interface PeringatanProps {
  sakitWarningData: StudentWarning[];
  izinWarningData: StudentWarning[];
  panggilanData: StudentWarning[];
  setStudentForPrint: (student: StudentWarning | null) => void;
}

const Peringatan: React.FC<PeringatanProps> = ({ sakitWarningData, izinWarningData, panggilanData, setStudentForPrint }) => {
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom duration-500">
      {/* Section for Sakit Warning */}
      <div>
        <h2 className="text-xl font-black text-emerald-600 flex items-center gap-3 mb-4 tracking-tight">
          <HeartPulse size={24} />
          Siswa Sakit Lebih dari 4x
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {sakitWarningData.length > 0 ? sakitWarningData.map((s, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border-l-4 border-emerald-500 shadow-sm border border-slate-200 flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <h3 className="font-black text-lg text-slate-800">{s.name}</h3>
                <p className="text-slate-500 text-sm font-bold mt-1">Kelas {s.kelas} • <span className="text-emerald-600">{s.count}x Sakit Terakumulasi</span></p>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <p className="font-bold text-slate-400 text-sm">Tidak ada siswa yang perlu perhatian khusus untuk absensi Sakit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section for Izin Warning */}
      <div>
        <h2 className="text-xl font-black text-amber-500 flex items-center gap-3 mb-4 tracking-tight">
          <FileCheck2 size={24} />
          Siswa Izin Lebih dari 4x
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {izinWarningData.length > 0 ? izinWarningData.map((s, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border-l-4 border-amber-500 shadow-sm border border-slate-200 flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <h3 className="font-black text-lg text-slate-800">{s.name}</h3>
                <p className="text-slate-500 text-sm font-bold mt-1">Kelas {s.kelas} • <span className="text-amber-500">{s.count}x Izin Terakumulasi</span></p>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <p className="font-bold text-slate-400 text-sm">Tidak ada siswa yang perlu perhatian khusus untuk absensi Izin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section for Panggilan Ortu (Alpha) */}
      <div>
        <h2 className="text-xl font-black text-rose-600 flex items-center gap-3 mb-4 tracking-tight">
          <UserX size={24} />
          Panggilan Orang Tua (&gt;2x Alpha)
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {panggilanData.length > 0 ? panggilanData.map((s, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border-l-4 border-rose-500 shadow-sm border border-slate-200 flex justify-between items-center group hover:shadow-md transition-shadow">
              <div>
                <h3 className="font-black text-lg text-slate-800">{s.name}</h3>
                <p className="text-slate-500 text-sm font-bold mt-1">Kelas {s.kelas} • <span className="text-rose-600">{s.count}x Alpha Terakumulasi</span></p>
              </div>
              <button 
                onClick={() => setStudentForPrint(s)}
                className="p-3 px-5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm"
              >
                Cetak Surat
              </button>
            </div>
          )) : (
            <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <p className="font-bold text-slate-400 text-sm">Tidak ada siswa yang perlu dipanggil saat ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Peringatan;
