import React, { useState, useEffect } from 'react';
import { Upload, Save, X } from 'lucide-react';
import { AbsensiEntry, Siswa, KeteranganStatus } from '../types';

// Constants
const KELAS_LIST = [7, 8, 9];
const ABJAD_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

interface InputFormProps {
  masterSiswa: Siswa[];
  editingEntry: AbsensiEntry | null;
  onCancel: () => void;
  onSave: (entry: AbsensiEntry) => void;
}

const InputForm: React.FC<InputFormProps> = ({ masterSiswa, editingEntry, onCancel, onSave }) => {
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    kelas: '',
    nama: '',
    keterangan: '' as KeteranganStatus,
    bukti: null as string | null
  });

  useEffect(() => {
    if (editingEntry) {
      setForm({
        tanggal: editingEntry.tanggal,
        kelas: editingEntry.kelas,
        nama: editingEntry.nama,
        keterangan: editingEntry.keterangan,
        bukti: editingEntry.bukti
      });
    } else {
      setForm({
        tanggal: new Date().toISOString().split('T')[0],
        kelas: '',
        nama: '',
        keterangan: '',
        bukti: null
      });
    }
  }, [editingEntry]);

  const siswaDiKelas = form.kelas
    ? masterSiswa.filter(s => String(s.Kelas) === String(form.kelas))
    : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setForm(prev => ({ ...prev, bukti: evt.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tanggal || !form.kelas || !form.nama || !form.keterangan) {
      alert('Mohon lengkapi data!');
      return;
    }
    onSave({
      id: editingEntry ? editingEntry.id : Date.now().toString(),
      ...form
    });
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow max-w-2xl mx-auto animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-black text-slate-800 tracking-tight">{editingEntry ? 'Edit Data Absensi' : 'Input Absensi Baru'}</h2>
           <p className="text-slate-500 text-sm font-medium mt-1">Lengkapi formulir di bawah ini</p>
        </div>
        {editingEntry && (
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
              <X size={24} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</label>
                <input 
                  type="date" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 transition-all cursor-pointer"
                  value={form.tanggal}
                  onChange={e => setForm({...form, tanggal: e.target.value})}
                />
            </div>
            <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kelas</label>
                <select 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 transition-all appearance-none cursor-pointer"
                  value={form.kelas}
                  onChange={e => setForm(prev => ({...prev, kelas: e.target.value, nama: ''}))}
                >
                    <option value="">Pilih Kelas</option>
                    {KELAS_LIST.flatMap(k => (
                        ABJAD_LIST.map(a => (
                            <option key={`${k}${a}`} value={`${k}${a}`}>Kelas {k}{a}</option>
                        ))
                    ))}
                </select>
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</label>
            <select
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 transition-all appearance-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
              value={form.nama}
              onChange={e => setForm(prev => ({...prev, nama: e.target.value}))}
              disabled={!form.kelas}
            >
              <option value="">{form.kelas ? 'Pilih siswa...' : 'Pilih kelas dahulu'}</option>
              {siswaDiKelas.map(s => (
                <option key={s.Nama} value={s.Nama}>{s.Nama}</option>
              ))}
            </select>
        </div>
       
        <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Keterangan</label>
            <div className="flex gap-3">
                {['Sakit', 'Izin', 'Alpha'].map(status => (
                    <button
                      type="button"
                      key={status}
                      onClick={() => setForm({...form, keterangan: status as KeteranganStatus})}
                      className={`flex-1 p-3 rounded-xl text-sm font-bold transition-all border ${ 
                        form.keterangan === status 
                        ? (status === 'Sakit' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : status === 'Izin' ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm')
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-2">
             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bukti / Surat (Opsional)</label>
             <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors relative group">
                 <input 
                   type="file" 
                   accept="image/*" 
                   className="absolute inset-0 opacity-0 cursor-pointer"
                   onChange={handleFileChange}
                 />
                 {form.bukti ? (
                    <div className="flex items-center justify-center gap-4">
                        <img src={form.bukti} className="h-20 w-20 object-cover rounded-xl shadow-sm border border-slate-200" alt="Preview" />
                        <span className="text-sm font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors">Foto Terlampir (Klik untuk ganti)</span>
                    </div>
                 ) : (
                    <div className="text-slate-400 flex flex-col items-center group-hover:text-slate-500 transition-colors">
                        <Upload size={24} className="mb-2" />
                        <span className="text-sm font-bold">Klik atau geser foto ke sini</span>
                    </div>
                 )}
             </div>
        </div>

        <div className="pt-6 flex gap-4">
             <button 
               type="button" 
               onClick={onCancel}
               className="flex-1 p-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
             >
                Batal
             </button>
             <button 
               type="submit" 
               className="flex-1 p-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all flex justify-center items-center gap-2"
             >
                <Save size={18} />
                Simpan Data
             </button>
        </div>
      </form>
    </div>
  );
};

export default InputForm;
