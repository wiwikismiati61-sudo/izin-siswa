import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  startOfWeek, 
  endOfWeek,
  isSunday,
  parseISO
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Plus, Trash2, X } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface Holiday {
  id?: string;
  date: string; // YYYY-MM-DD
  name: string;
  type: 'nasional' | 'semester' | 'fakultatif';
}

interface CalendarPendidikanProps {
  isLoggedIn: boolean;
  userRole?: 'admin' | 'viewer' | null;
}

const CalendarPendidikan: React.FC<CalendarPendidikanProps> = ({ isLoggedIn, userRole }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Start at current month
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [newHoliday, setNewHoliday] = useState<Omit<Holiday, 'id'>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    name: '',
    type: 'nasional'
  });

  // Fetch holidays from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'kalender_pendidikan'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Holiday[];
      setHolidays(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'kalender_pendidikan');
    });
    return () => unsub();
  }, []);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.date) return;
    
    try {
      await addDoc(collection(db, 'kalender_pendidikan'), {
        ...newHoliday,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewHoliday({
        date: format(new Date(), 'yyyy-MM-dd'),
        name: '',
        type: 'nasional'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'kalender_pendidikan');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'kalender_pendidikan', id));
      setPendingDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'kalender_pendidikan');
    }
  };

  const handleLoadDefaults = async () => {
    const defaults: Omit<Holiday, 'id'>[] = [
      { date: '2026-01-01', name: 'Tahun Baru 2026 Masehi', type: 'nasional' },
      { date: '2026-01-29', name: 'Tahun Baru Imlek 2577 Kongzili', type: 'nasional' },
      { date: '2026-02-15', name: 'Isra Mikraj Nabi Muhammad SAW', type: 'nasional' },
      { date: '2026-03-19', name: 'Hari Suci Nyepi Tahun Baru Saka 1948', type: 'nasional' },
      { date: '2026-03-20', name: 'Cuti Bersama Nyepi', type: 'nasional' },
      { date: '2026-03-21', name: 'Hari Raya Idul Fitri 1447 Hijriah', type: 'nasional' },
      { date: '2026-03-22', name: 'Hari Raya Idul Fitri 1447 Hijriah', type: 'nasional' },
      { date: '2026-03-23', name: 'Cuti Bersama Idul Fitri', type: 'nasional' },
      { date: '2026-04-03', name: 'Wafat Yesus Kristus', type: 'nasional' },
      { date: '2026-04-05', name: 'Hari Paskah', type: 'nasional' },
      { date: '2026-05-01', name: 'Hari Buruh Internasional', type: 'nasional' },
      { date: '2026-05-14', name: 'Kenaikan Yesus Kristus', type: 'nasional' },
      { date: '2026-05-21', name: 'Hari Raya Waisak 2570 BE', type: 'nasional' },
      { date: '2026-06-01', name: 'Hari Lahir Pancasila', type: 'nasional' },
      { date: '2026-06-04', name: 'Hari Raya Idul Adha 1447 Hijriah', type: 'nasional' },
      { date: '2026-07-17', name: 'Hari Kemerdekaan RI', type: 'nasional' },
      { date: '2026-09-03', name: 'Maulid Nabi Muhammad SAW', type: 'nasional' },
      { date: '2026-12-25', name: 'Hari Raya Natal', type: 'nasional' },
    ];

    try {
      for (const h of defaults) {
        if (!holidays.some(existing => existing.date === h.date)) {
          await addDoc(collection(db, 'kalender_pendidikan'), {
            ...h,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'kalender_pendidikan');
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 leading-none">Kalender Pendidikan</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Tahun Pelajaran 2025/2026</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-black text-slate-700 min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: id })}
            </span>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {isLoggedIn && userRole === 'admin' && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleLoadDefaults}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
              >
                Muat Default
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
              >
                <Plus size={16} />
                Tambah Libur
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, idx) => (
          <div key={idx} className={`text-center text-[10px] font-black uppercase tracking-widest py-2 ${idx === 0 ? 'text-rose-500' : 'text-slate-400'}`}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const dateStr = format(day, 'yyyy-MM-dd');
        const cloneDay = day;
        
        const holiday = holidays.find(h => h.date === dateStr);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSun = isSunday(day);
        
        let bgColor = 'bg-white';
        let textColor = 'text-slate-700';
        
        if (!isCurrentMonth) {
          textColor = 'text-slate-300';
        } else if (holiday) {
          if (holiday.type === 'nasional') {
            bgColor = 'bg-rose-50';
            textColor = 'text-rose-600';
          } else if (holiday.type === 'semester') {
            bgColor = 'bg-amber-50';
            textColor = 'text-amber-600';
          } else if (holiday.type === 'fakultatif') {
            bgColor = 'bg-indigo-50';
            textColor = 'text-indigo-600';
          }
        } else if (isSun) {
          textColor = 'text-rose-500';
        }

        days.push(
          <div
            key={day.toString()}
            className={`relative h-16 md:h-24 border border-slate-100 p-2 transition-all ${bgColor} ${!isCurrentMonth ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}
          >
            <span className={`text-xs font-black ${textColor}`}>
              {formattedDate}
            </span>
            {isCurrentMonth && holiday && (
              <div className="mt-1">
                <p className={`text-[8px] leading-tight font-bold line-clamp-2 ${
                  holiday.type === 'nasional' ? 'text-rose-500' : 
                  holiday.type === 'semester' ? 'text-amber-500' : 
                  'text-indigo-500'
                }`}>
                  {holiday.name}
                </p>
                {isLoggedIn && userRole === 'admin' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDeleteId(holiday.id!);
                    }}
                    className="absolute bottom-1 right-1 p-1 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 group" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">{rows}</div>;
  };

  const stats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    let hariEfektif = 0;
    let hariMinggu = 0;
    let liburNasional = 0;
    let liburSemester = 0;

    daysInMonth.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const holiday = holidays.find(h => h.date === dateStr);
      const isSun = isSunday(date);

      if (isSun) {
        hariMinggu++;
      } else if (holiday) {
        if (holiday.type === 'nasional') {
          liburNasional++;
        } else if (holiday.type === 'semester') {
          liburSemester++;
        }
      } else {
        hariEfektif++;
      }
    });

    return { hariEfektif, hariMinggu, liburNasional, liburSemester };
  }, [currentMonth, holidays]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderHeader()}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {renderDays()}
          {renderCells()}
          
          <div className="mt-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
              <Info size={16} className="text-indigo-500" />
              Keterangan Bulan Ini
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {holidays
                .filter(h => isSameMonth(parseISO(h.date), currentMonth))
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((h, idx) => (
                <div key={idx} className="flex items-start justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      h.type === 'nasional' ? 'bg-rose-500' : 
                      h.type === 'semester' ? 'bg-amber-500' : 
                      'bg-indigo-500'
                    }`}></div>
                    <div>
                      <p className="text-[11px] font-black text-slate-700">{format(parseISO(h.date), 'dd MMMM', { locale: id })}</p>
                      <p className="text-[10px] font-bold text-slate-500">{h.name}</p>
                    </div>
                  </div>
                  {isLoggedIn && userRole === 'admin' && (
                    <button 
                      onClick={() => setPendingDeleteId(h.id!)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {holidays.filter(h => isSameMonth(parseISO(h.date), currentMonth)).length === 0 && (
                <p className="text-[10px] font-bold text-slate-400 italic">Tidak ada hari libur khusus di bulan ini.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ringkasan Hari</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Hari Efektif</p>
                <p className="text-3xl font-black text-emerald-700">{stats.hariEfektif}</p>
                <p className="text-[9px] font-bold text-emerald-500 mt-1">Hari belajar aktif di sekolah</p>
              </div>

              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider mb-1">Hari Minggu</p>
                <p className="text-3xl font-black text-rose-700">{stats.hariMinggu}</p>
                <p className="text-[9px] font-bold text-rose-500 mt-1">Hari libur akhir pekan</p>
              </div>

              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider mb-1">Libur Nasional</p>
                <p className="text-3xl font-black text-orange-700">{stats.liburNasional}</p>
                <p className="text-[9px] font-bold text-orange-500 mt-1">Hari libur umum nasional</p>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Libur Semester</p>
                <p className="text-3xl font-black text-amber-700">{stats.liburSemester}</p>
                <p className="text-[9px] font-bold text-amber-500 mt-1">Masa libur pergantian semester</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-5 rounded-2xl shadow-lg shadow-indigo-200 text-white">
            <h4 className="text-xs font-black uppercase tracking-widest mb-2 opacity-80">Catatan</h4>
            <p className="text-[10px] font-bold leading-relaxed">
              Kalender ini merupakan acuan kegiatan belajar mengajar. Jadwal sewaktu-waktu dapat berubah sesuai dengan kebijakan Dinas Pendidikan setempat.
            </p>
          </div>
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900">Tambah Hari Libur</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Nama Hari Libur</label>
                <input 
                  type="text"
                  required
                  value={newHoliday.name}
                  onChange={e => setNewHoliday({...newHoliday, name: e.target.value})}
                  placeholder="Contoh: Hari Raya Idul Fitri"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Tanggal</label>
                  <input 
                    type="date"
                    required
                    value={newHoliday.date}
                    onChange={e => setNewHoliday({...newHoliday, date: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Tipe</label>
                  <select 
                    value={newHoliday.type}
                    onChange={e => setNewHoliday({...newHoliday, type: e.target.value as any})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="nasional">Libur Nasional</option>
                    <option value="semester">Libur Semester</option>
                    <option value="fakultatif">Fakultatif/Minggu</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 p-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 p-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-[700] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm shadow-2xl text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Hapus Hari Libur?</h3>
            <p className="text-slate-500 text-sm mb-6">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPendingDeleteId(null)}
                className="flex-1 p-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => handleDeleteHoliday(pendingDeleteId)}
                className="flex-1 p-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPendidikan;

