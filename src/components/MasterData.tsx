import React from 'react';
import { Upload, Download, Save, Database } from 'lucide-react';

const ActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isUpload?: boolean;
  accept?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  color: 'indigo' | 'emerald' | 'amber' | 'rose';
}> = ({ title, description, icon, onClick, isUpload, accept, onChange, color }) => {
  const colorStyles = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 group-hover:bg-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200 group-hover:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-200 group-hover:bg-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-200 group-hover:bg-rose-100',
  };

  const content = (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col items-start text-left cursor-pointer group">
      <div className={`p-3 rounded-xl mb-4 transition-colors border ${colorStyles[color]}`}>
        {icon}
      </div>
      <h3 className="text-lg font-black text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed">{description}</p>
    </div>
  );

  if (isUpload) {
    return (
      <label className="block h-full cursor-pointer">
        {content}
        <input type="file" accept={accept} onChange={onChange} className="hidden" />
      </label>
    );
  }

  return (
    <button onClick={onClick} className="block w-full h-full text-left">
      {content}
    </button>
  );
};

interface MasterDataProps {
  handleImportSiswa: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportExcel: () => void;
  handleBackup: () => void;
}

const MasterData: React.FC<MasterDataProps> = ({ handleImportSiswa, handleRestore, handleExportExcel, handleBackup }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Master Data</h2>
        <p className="text-slate-500 text-xs font-medium">Kelola data sistem, impor, ekspor, dan pencadangan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <ActionCard
          title="Impor Data Siswa"
          description="Masukkan data siswa baru menggunakan file Excel (.xlsx, .xls)."
          icon={<Upload size={24} />}
          isUpload
          accept=".xlsx, .xls"
          onChange={handleImportSiswa}
          color="indigo"
        />
        <ActionCard
          title="Ekspor Laporan"
          description="Unduh seluruh log absensi ke dalam format Excel."
          icon={<Download size={24} />}
          onClick={handleExportExcel}
          color="emerald"
        />
        <ActionCard
          title="Backup Data"
          description="Simpan seluruh data (Siswa & Absensi) ke file JSON lokal."
          icon={<Save size={24} />}
          onClick={handleBackup}
          color="amber"
        />
        <ActionCard
          title="Restore Data"
          description="Pulihkan data sistem dari file backup JSON sebelumnya."
          icon={<Database size={24} />}
          isUpload
          accept=".json"
          onChange={handleRestore}
          color="rose"
        />
      </div>
    </div>
  );
};

export default MasterData;
