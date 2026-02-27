
export type KeteranganStatus = 'Sakit' | 'Izin' | 'Alpha' | '';

export interface Siswa {
  Nama: string;
  Kelas: string | number;
}

export interface AbsensiEntry {
  id: string;
  tanggal: string;
  nama: string;
  kelas: string;
  keterangan: KeteranganStatus;
  bukti: string | null;
}

export interface DashboardStats {
  sakit: number;
  izin: number;
  alpha: number;
  total: number;
}

export interface RekapGroup {
  tanggal: string;
  kelas: string;
  Sakit: number;
  Izin: number;
  Alpha: number;
  total: number;
}
