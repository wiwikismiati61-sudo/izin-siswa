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

export interface IzinWaliMurid {
  id: string;
  tanggal: string;
  kelas: string;
  namaSiswa: string;
  jenisIzin: 'Sakit' | 'Izin';
  namaWali: string;
  telpWali: string;
  keterangan: string;
  lampiran: string; // Base64 or URL of the file
  statusInput: boolean; // true if already inputted to absensi
  createdAt: any; // Firestore timestamp
}
