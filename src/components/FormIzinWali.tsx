import React, { useState, useMemo } from 'react';
import { Siswa } from '../types';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const KELAS_LIST = [7, 8, 9];
const ABJAD_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

interface FormIzinWaliProps {
  masterSiswa: Siswa[];
}

const FormIzinWali: React.FC<FormIzinWaliProps> = ({ masterSiswa }) => {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [kelas, setKelas] = useState('');
  const [namaSiswa, setNamaSiswa] = useState('');
  const [jenisIzin, setJenisIzin] = useState<'Sakit' | 'Izin'>('Sakit');
  const [namaWali, setNamaWali] = useState('');
  const [telpWali, setTelpWali] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [lampiran, setLampiran] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const studentsInSelectedClass = useMemo(() => {
    if (!kelas) return [];
    const filtered = masterSiswa.filter(s => String(s.Kelas) === kelas);
    const uniqueNames = Array.from(new Set(filtered.map(s => s.Nama)));
    return uniqueNames
        .map(name => filtered.find(s => s.Nama === name)!)
        .sort((a, b) => a.Nama.localeCompare(b.Nama));
  }, [kelas, masterSiswa]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setErrorMsg('Ukuran file tidak boleh lebih dari 1 MB.');
      setLampiran(null);
      setFileName('');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLampiran(reader.result as string);
      setFileName(file.name);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!kelas || !namaSiswa || !namaWali || !telpWali || !keterangan) {
      setErrorMsg('Mohon lengkapi semua data.');
      return;
    }

    if (!lampiran) {
      setErrorMsg('Penolakan Simpan: Lampiran surat izin wajib diunggah. Surat izin harus ada tanda tangan wali murid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newDoc = {
        tanggal,
        kelas,
        namaSiswa,
        jenisIzin,
        namaWali,
        telpWali,
        keterangan,
        lampiran,
        statusInput: false,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'izin_wali'), newDoc);
      setIsSuccess(true);
      // Reset form
      setKelas('');
      setNamaSiswa('');
      setNamaWali('');
      setTelpWali('');
      setKeterangan('');
      setLampiran(null);
      setFileName('');
      
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'izin_wali');
      setErrorMsg('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-900/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          <h2 className="text-3xl font-black text-white relative z-10 mb-2">Form Izin Walimurid</h2>
          <p className="text-indigo-100 relative z-10 font-medium">Khusus untuk Wali Murid</p>
        </div>

        <div className="p-8">
          {isSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
              <CheckCircle2 className="text-emerald-500 shrink-0" />
              <div>
                <h4 className="font-bold">Berhasil Terkirim!</h4>
                <p className="text-sm">Permohonan izin telah dikirim ke sistem sekolah.</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4">
              <AlertCircle className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold">Perhatian</h4>
                <p className="text-sm">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Tanggal Izin</label>
                <input 
                  type="date" 
                  value={tanggal}
                  readOnly
                  className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-500 outline-none cursor-not-allowed"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Jenis Izin</label>
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center justify-center gap-2 p-3.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 has-[:checked]:text-indigo-700">
                    <input type="radio" name="jenisIzin" value="Sakit" checked={jenisIzin === 'Sakit'} onChange={() => setJenisIzin('Sakit')} className="hidden" />
                    <span className="font-bold">Sakit</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-2 p-3.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 has-[:checked]:text-indigo-700">
                    <input type="radio" name="jenisIzin" value="Izin" checked={jenisIzin === 'Izin'} onChange={() => setJenisIzin('Izin')} className="hidden" />
                    <span className="font-bold">Izin (Kepentingan)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Kelas</label>
                <select 
                  value={kelas}
                  onChange={(e) => { setKelas(e.target.value); setNamaSiswa(''); }}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                  required
                >
                  <option value="">Pilih Kelas</option>
                  {KELAS_LIST.flatMap(k => 
                    ABJAD_LIST.map(a => <option key={`${k}${a}`} value={`${k}${a}`}>Kelas {k}{a}</option>)
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nama Siswa</label>
                <select 
                  value={namaSiswa}
                  onChange={(e) => setNamaSiswa(e.target.value)}
                  disabled={!kelas}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none disabled:bg-slate-100 disabled:text-slate-400"
                  required
                >
                  <option value="">{kelas ? 'Pilih Siswa' : 'Pilih kelas dahulu'}</option>
                  {studentsInSelectedClass.map((s, index) => (
                    <option key={s.id || `student-${index}`} value={s.Nama}>{s.Nama}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nama Wali Murid</label>
                <input 
                  type="text" 
                  value={namaWali}
                  onChange={(e) => setNamaWali(e.target.value)}
                  placeholder="Nama lengkap orang tua/wali"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">No. Telp / WhatsApp</label>
                <input 
                  type="tel" 
                  value={telpWali}
                  onChange={(e) => setTelpWali(e.target.value)}
                  placeholder="08123456789"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Keterangan / Alasan</label>
              <textarea 
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Jelaskan alasan izin/sakit secara singkat..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] resize-y"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Lampiran Surat Izin (Wajib Tanda Tangan)</label>
              <p className="text-xs text-slate-500 mb-2">Unggah foto surat izin yang sudah ditandatangani oleh wali murid. Maksimal 1 MB.</p>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-slate-400" />
                  <p className="mb-2 text-sm text-slate-500 font-semibold">
                    {fileName ? fileName : <><span className="text-indigo-600">Klik untuk unggah</span> atau seret file</>}
                  </p>
                  <p className="text-xs text-slate-400">PNG, JPG atau JPEG (Max. 1MB)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full p-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Permohonan Izin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormIzinWali;
