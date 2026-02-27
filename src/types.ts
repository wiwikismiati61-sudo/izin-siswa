export interface Siswa {
  Nama: string;
  Kelas: string | number;
  [key: string]: any; // Allow other properties
}

export type KeteranganStatus = 'Sakit' | 'Izin' | 'Alpha' | '';

export interface AbsensiEntry {
  id: string;
  tanggal: string;
  nama: string;
  kelas: string;
  keterangan: KeteranganStatus;
  bukti: string | null;
  [key: string]: any; // Allow other properties
}
