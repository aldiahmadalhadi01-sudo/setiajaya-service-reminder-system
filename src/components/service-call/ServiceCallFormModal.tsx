import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, RotateCcw, Wrench } from 'lucide-react';
import { ServiceCallRecord } from '../../types';

const serviceCallSchema = z.object({
  cabang: z.string().min(1, 'Cabang wajib dipilih'),
  service_advisor: z.string().min(1, 'Service Advisor wajib diisi'),
  tanggal_entry: z.string().min(1, 'Tanggal Entry wajib diisi'),
  nama_customer: z.string().min(1, 'Nama Customer wajib diisi'),
  no_hp: z.string().min(1, 'Nomor HP wajib diisi'),
  no_wa: z.string().optional(),
  alamat: z.string().optional(),
  kota: z.string().min(1, 'Kota wajib diisi'),
  ring_area: z.string().min(1, 'Ring Area wajib diisi'),
  tipe_kendaraan: z.string().min(1, 'Tipe Kendaraan wajib diisi'),
  vin: z.string().length(17, 'VIN harus tepat 17 karakter').transform((v) => v.toUpperCase().trim()),
  no_polisi: z.string().min(1, 'Nomor Polisi wajib diisi').transform((v) => v.toUpperCase().trim()),
  km_service: z.number().min(0, 'KM Service harus >= 0'),
  jenis_pekerjaan: z.string().min(1, 'Jenis Pekerjaan wajib diisi'),
  problem_definition: z.string().min(1, 'Keluhan/Problem wajib diisi'),
  estimasi_harga: z.number().min(0),
  dealer_penjual: z.string().min(1, 'Dealer Penjual wajib diisi'),
  no_so: z.string().min(1, 'Nomor SO wajib diisi'),
  no_invoice: z.string().min(1, 'Nomor Invoice wajib diisi'),
  tanggal_invoice: z.string().min(1, 'Tanggal Invoice wajib diisi'),
  ring_area_domisili: z.string().min(1, 'Ring Area Domisili wajib diisi')
});

type ServiceCallFormData = z.infer<typeof serviceCallSchema>;

interface ServiceCallFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServiceCallRecord) => Promise<void>;
  initialRecord?: ServiceCallRecord | null;
}

export const ServiceCallFormModal: React.FC<ServiceCallFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ServiceCallFormData>({
    resolver: zodResolver(serviceCallSchema),
    defaultValues: {
      cabang: 'Toyota Setiajaya Depok',
      service_advisor: 'Rudi Hermawan',
      tanggal_entry: new Date().toISOString().split('T')[0],
      nama_customer: '',
      no_hp: '',
      no_wa: '',
      alamat: '',
      kota: 'Depok',
      ring_area: 'Ring 1',
      tipe_kendaraan: 'Innova Zenix',
      vin: '',
      no_polisi: '',
      km_service: 1000,
      jenis_pekerjaan: 'Service Berkala',
      problem_definition: 'Service Berkala 1.000 KM',
      estimasi_harga: 0,
      dealer_penjual: 'Setiajaya Depok',
      no_so: `SO-${Date.now().toString().slice(-5)}`,
      no_invoice: `INV-${Date.now().toString().slice(-5)}`,
      tanggal_invoice: new Date().toISOString().split('T')[0],
      ring_area_domisili: 'Ring 1'
    }
  });

  useEffect(() => {
    if (initialRecord) {
      reset({
        cabang: initialRecord.cabang || 'Toyota Setiajaya Depok',
        service_advisor: initialRecord.service_advisor || '',
        tanggal_entry: initialRecord.tanggal_entry || new Date().toISOString().split('T')[0],
        nama_customer: initialRecord.nama_customer || '',
        no_hp: initialRecord.no_hp || '',
        no_wa: initialRecord.no_wa || '',
        alamat: initialRecord.alamat || '',
        kota: initialRecord.kota || 'Depok',
        ring_area: initialRecord.ring_area || 'Ring 1',
        tipe_kendaraan: initialRecord.tipe_kendaraan || '',
        vin: initialRecord.vin || '',
        no_polisi: initialRecord.no_polisi || '',
        km_service: Number(initialRecord.km_service) || 0,
        jenis_pekerjaan: initialRecord.jenis_pekerjaan || 'Service Berkala',
        problem_definition: initialRecord.problem_definition || '',
        estimasi_harga: Number(initialRecord.estimasi_harga) || 0,
        dealer_penjual: initialRecord.dealer_penjual || 'Setiajaya Depok',
        no_so: initialRecord.no_so || '',
        no_invoice: initialRecord.no_invoice || '',
        tanggal_invoice: initialRecord.tanggal_invoice || new Date().toISOString().split('T')[0],
        ring_area_domisili: initialRecord.ring_area_domisili || 'Ring 1'
      });
    }
  }, [initialRecord, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: ServiceCallFormData) => {
    const fullRecord: ServiceCallRecord = {
      ...initialRecord,
      id: initialRecord?.id,
      week: initialRecord?.week || 'W1',
      cabang: data.cabang,
      service_advisor: data.service_advisor,
      tanggal_entry: data.tanggal_entry,
      call_id: initialRecord?.call_id || `CALL-${Date.now().toString().slice(-4)}`,
      kode_customer: initialRecord?.kode_customer || 'CUST',
      nama_customer: data.nama_customer,
      no_hp: data.no_hp,
      no_wa: data.no_wa || data.no_hp,
      alamat: data.alamat || '',
      kelurahan: initialRecord?.kelurahan || '',
      kecamatan: initialRecord?.kecamatan || '',
      kota: data.kota,
      kode_pos: initialRecord?.kode_pos || '',
      ring_area: data.ring_area,
      tipe_kendaraan: data.tipe_kendaraan,
      vin: data.vin,
      no_mesin: initialRecord?.no_mesin || '-',
      no_polisi: data.no_polisi,
      tahun_rakit: initialRecord?.tahun_rakit || new Date().getFullYear(),
      tanggal_do: initialRecord?.tanggal_do || data.tanggal_entry,
      point_of_service: initialRecord?.point_of_service || 'Bengkel Resmi',
      problem_definition: data.problem_definition,
      estimasi_harga: data.estimasi_harga,
      no_voucher: initialRecord?.no_voucher || '-',
      km_service: data.km_service,
      jenis_pekerjaan: data.jenis_pekerjaan,
      tipe_promo: initialRecord?.tipe_promo || '-',
      ssc: initialRecord?.ssc || 'Tidak',
      dealer_penjual: data.dealer_penjual,
      group: initialRecord?.group || 'Setiajaya Group',
      area_dealer: initialRecord?.area_dealer || 'Jabodetabek',
      t_Care: initialRecord?.t_Care || 'Aktif',
      up_selling: initialRecord?.up_selling || '-',
      cross_selling: initialRecord?.cross_selling || '-',
      no_so: data.no_so,
      tanggal_so: data.tanggal_entry,
      no_invoice: data.no_invoice,
      tanggal_invoice: data.tanggal_invoice,
      next_service: initialRecord?.next_service || '',
      so_key: initialRecord?.so_key || `SOKEY-${data.no_so}`,
      invoice_key: initialRecord?.invoice_key || `INVKEY-${data.no_invoice}`,
      alamat_domisili: data.alamat || '',
      ring_area_domisili: data.ring_area_domisili,
      nama_laporan: 'Laporan Service Harian',
      periode: data.tanggal_invoice.slice(0, 7)
    };

    await onSave(fullRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {initialRecord ? 'Edit Data Service Call' : 'Tambah Data Service Call Baru'}
              </h3>
              <p className="text-xs text-slate-300">Form input aktivitas service bengkel & pendaftaran pengerjaan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Cabang */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Cabang Bengkel *</label>
                <select
                  {...register('cabang')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                >
                  <option value="Toyota Setiajaya Depok">Toyota Setiajaya Depok</option>
                  <option value="Setiajaya Bogor">Setiajaya Bogor</option>
                  <option value="Setiajaya Cibubur">Setiajaya Cibubur</option>
                  <option value="Setiajaya Parung">Setiajaya Parung</option>
                </select>
              </div>

              {/* Service Advisor */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Service Advisor *</label>
                <input
                  type="text"
                  {...register('service_advisor')}
                  placeholder="e.g. Rudi Hermawan"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
                {errors.service_advisor && <p className="text-rose-500 mt-1">{errors.service_advisor.message}</p>}
              </div>

              {/* Tanggal Entry */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Tanggal Entry *</label>
                <input
                  type="date"
                  {...register('tanggal_entry')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              {/* VIN */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">VIN (17 Karakter) *</label>
                <input
                  type="text"
                  maxLength={17}
                  {...register('vin')}
                  placeholder="e.g. MHKSJ100120250001"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 uppercase font-mono"
                />
                {errors.vin && <p className="text-rose-500 mt-1">{errors.vin.message}</p>}
              </div>

              {/* Nomor Polisi */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nomor Polisi *</label>
                <input
                  type="text"
                  {...register('no_polisi')}
                  placeholder="e.g. B 1001 SJ"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 uppercase font-bold"
                />
                {errors.no_polisi && <p className="text-rose-500 mt-1">{errors.no_polisi.message}</p>}
              </div>

              {/* Tipe Kendaraan */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Model / Tipe Kendaraan *</label>
                <input
                  type="text"
                  {...register('tipe_kendaraan')}
                  placeholder="e.g. Innova Zenix Q Hybrid"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              {/* Nama Customer */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nama Customer *</label>
                <input
                  type="text"
                  {...register('nama_customer')}
                  placeholder="e.g. Budi Santoso"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              {/* No HP */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nomor HP / WA *</label>
                <input
                  type="text"
                  {...register('no_hp')}
                  placeholder="e.g. 081234567890"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              {/* KM Service */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">KM Service *</label>
                <input
                  type="number"
                  {...register('km_service', { valueAsNumber: true })}
                  placeholder="e.g. 10000"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              {/* Jenis Pekerjaan */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Jenis Pekerjaan *</label>
                <select
                  {...register('jenis_pekerjaan')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                >
                  <option value="Service Berkala">Service Berkala</option>
                  <option value="General Repair">General Repair</option>
                  <option value="Body & Paint">Body & Paint</option>
                  <option value="Quick Service">Quick Service</option>
                </select>
              </div>

              {/* Ring Area */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Ring Area (Lokasi Beli) *</label>
                <select
                  {...register('ring_area')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                >
                  <option value="Ring 1">Ring 1</option>
                  <option value="Ring 2">Ring 2</option>
                  <option value="Ring 3">Ring 3</option>
                  <option value="Outer">Outer</option>
                </select>
              </div>

              {/* Ring Area Domisili */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Ring Area Domisili *</label>
                <select
                  {...register('ring_area_domisili')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                >
                  <option value="Ring 1">Ring 1</option>
                  <option value="Ring 2">Ring 2</option>
                  <option value="Ring 3">Ring 3</option>
                  <option value="Outer">Outer</option>
                </select>
              </div>

              {/* Dealer Penjual */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Dealer Penjual *</label>
                <input
                  type="text"
                  {...register('dealer_penjual')}
                  placeholder="e.g. Setiajaya Depok"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              {/* No SO */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nomor SO *</label>
                <input
                  type="text"
                  {...register('no_so')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 font-mono"
                />
              </div>

              {/* No Invoice */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nomor Invoice *</label>
                <input
                  type="text"
                  {...register('no_invoice')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 font-mono"
                />
              </div>

              {/* Tanggal Invoice */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Tanggal Invoice *</label>
                <input
                  type="date"
                  {...register('tanggal_invoice')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              {/* Estimasi Harga */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Estimasi Biaya (Rp) *</label>
                <input
                  type="number"
                  {...register('estimasi_harga', { valueAsNumber: true })}
                  placeholder="e.g. 850000"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              {/* Kota */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Kota *</label>
                <input
                  type="text"
                  {...register('kota')}
                  placeholder="e.g. Depok"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              {/* Keluhan / Problem Definition */}
              <div className="sm:col-span-2 md:col-span-3">
                <label className="font-bold text-slate-800 block mb-1">Keluhan / Problem Definition *</label>
                <textarea
                  {...register('problem_definition')}
                  rows={2}
                  placeholder="e.g. Service Berkala 10.000 KM & Ganti Oli Engine Synthetic"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Service Call</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
