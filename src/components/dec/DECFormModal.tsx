import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, RotateCcw, FileText } from 'lucide-react';
import { DECRecord } from '../../types';

const decSchema = z.object({
  bulan: z.string().min(1, 'Bulan wajib dipilih'),
  tanggal_dec: z.string().min(1, 'Tanggal DEC wajib diisi'),
  nama_customer: z.string().min(1, 'Nama Customer wajib diisi'),
  payment: z.string().min(1, 'Payment method wajib diisi'),
  phone_customer: z.string().min(1, 'Nomor Telepon wajib diisi'),
  model: z.string().min(1, 'Model kendaraan wajib diisi'),
  vin: z.string().length(17, 'VIN harus tepat 17 karakter').transform(val => val.toUpperCase().trim()),
  sales: z.string().min(1, 'Sales Name wajib diisi'),
  alamat: z.string().optional(),
  kota: z.string().min(1, 'Kota wajib diisi')
});

type DECFormData = z.infer<typeof decSchema>;

interface DECFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DECRecord) => Promise<void>;
  initialRecord?: DECRecord | null;
}

export const DECFormModal: React.FC<DECFormModalProps> = ({
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
  } = useForm<DECFormData>({
    resolver: zodResolver(decSchema),
    defaultValues: {
      bulan: 'Januari',
      tanggal_dec: new Date().toISOString().split('T')[0],
      nama_customer: '',
      payment: 'Cash',
      phone_customer: '',
      model: 'Innova Zenix',
      vin: '',
      sales: '',
      alamat: '',
      kota: 'Depok'
    }
  });

  useEffect(() => {
    if (initialRecord) {
      reset({
        bulan: initialRecord.bulan || 'Januari',
        tanggal_dec: initialRecord.tanggal_dec || new Date().toISOString().split('T')[0],
        nama_customer: initialRecord.nama_customer || '',
        payment: initialRecord.payment || 'Cash',
        phone_customer: initialRecord.phone_customer || '',
        model: initialRecord.model || '',
        vin: initialRecord.vin || '',
        sales: initialRecord.sales || '',
        alamat: initialRecord.alamat || '',
        kota: initialRecord.kota || 'Depok'
      });
    } else {
      reset({
        bulan: 'Januari',
        tanggal_dec: new Date().toISOString().split('T')[0],
        nama_customer: '',
        payment: 'Cash',
        phone_customer: '',
        model: 'Innova Zenix',
        vin: '',
        sales: '',
        alamat: '',
        kota: 'Depok'
      });
    }
  }, [initialRecord, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: DECFormData) => {
    await onSave({
      id: initialRecord?.id,
      ...data,
      alamat: data.alamat || ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {initialRecord ? 'Edit Data DEC' : 'Tambah Data DEC Baru'}
              </h3>
              <p className="text-xs text-slate-300">Form input pendaftaran unit kendaraan DEC</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bulan */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Bulan *</label>
                <select
                  {...register('bulan')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                >
                  {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {errors.bulan && <p className="text-rose-500 mt-1">{errors.bulan.message}</p>}
              </div>

              {/* Tanggal DEC */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Tanggal DEC *</label>
                <input
                  type="date"
                  {...register('tanggal_dec')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
                {errors.tanggal_dec && <p className="text-rose-500 mt-1">{errors.tanggal_dec.message}</p>}
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
                {errors.nama_customer && <p className="text-rose-500 mt-1">{errors.nama_customer.message}</p>}
              </div>

              {/* Phone Customer */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nomor Telepon / WA *</label>
                <input
                  type="text"
                  {...register('phone_customer')}
                  placeholder="e.g. 081234567890"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
                {errors.phone_customer && <p className="text-rose-500 mt-1">{errors.phone_customer.message}</p>}
              </div>

              {/* Model Kendaraan */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Model Kendaraan *</label>
                <input
                  type="text"
                  {...register('model')}
                  placeholder="e.g. Innova Zenix Q Hybrid"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
                {errors.model && <p className="text-rose-500 mt-1">{errors.model.message}</p>}
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

              {/* Payment */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Metode Payment *</label>
                <select
                  {...register('payment')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Toyota Astra Financial">Credit TAF</option>
                  <option value="Credit ACC">Credit ACC</option>
                  <option value="Credit BCA Finance">Credit BCA Finance</option>
                  <option value="Credit Mandiri Utama Finance">Credit MUF</option>
                  <option value="Leasing Lainnya">Leasing Lainnya</option>
                </select>
              </div>

              {/* Sales */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Sales Person *</label>
                <input
                  type="text"
                  {...register('sales')}
                  placeholder="e.g. Agus Setiawan"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
                {errors.sales && <p className="text-rose-500 mt-1">{errors.sales.message}</p>}
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
                {errors.kota && <p className="text-rose-500 mt-1">{errors.kota.message}</p>}
              </div>

              {/* Alamat */}
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-800 block mb-1">Alamat Lengkap</label>
                <textarea
                  {...register('alamat')}
                  rows={2}
                  placeholder="e.g. Jl. Margonda Raya No. 45"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
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
                <span>Simpan DEC</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
