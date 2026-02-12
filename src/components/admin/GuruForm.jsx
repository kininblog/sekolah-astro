import React, { useState } from 'react';

// --- KOMPONEN UI DI LUAR (Agar Kursor Tidak Loncat) ---

const InputField = ({ label, name, type = "text", placeholder, value, onChange }) => (
    <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
        <input 
            type={type} 
            name={name} 
            value={value || ''} 
            onChange={onChange} 
            placeholder={placeholder} 
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
        />
    </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
    <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
        <select 
            name={name} 
            value={value || ''} 
            onChange={onChange} 
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition"
        >
            <option value="">- Pilih -</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const FileUploadField = ({ label, name, value, onUpload, uploading }) => (
    <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition">
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{label}</label>
        <div className="flex items-center gap-3">
            <input 
                type="file" 
                onChange={(e) => onUpload(e, name)} 
                accept="application/pdf,image/*"
                className="text-xs w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            {uploading && <span className="text-xs text-orange-500 animate-pulse font-bold">Uploading...</span>}
        </div>
        {value && (
            <div className="mt-2 flex items-center gap-2 bg-white p-2 rounded border border-green-200">
                <span className="text-xs text-green-600 font-bold">✅ Terupload</span>
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline hover:text-blue-800">
                    Lihat File
                </a>
            </div>
        )}
    </div>
);

// --- KOMPONEN UTAMA ---

export default function GuruForm({ initialData }) {
    const [activeTab, setActiveTab] = useState('identitas');
    const [formData, setFormData] = useState(initialData || { status_aktif: 'Aktif' });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // --- HANDLE INPUT ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- UPLOAD FILE & FOTO ---
    const handleUpload = async (e, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validasi Ukuran (Max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert("⚠️ Ukuran file terlalu besar! Maksimal 2MB.");
            e.target.value = ""; // Reset input
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = async () => {
            try {
                // Tampilkan preview lokal dulu biar responsif (khusus foto)
                if (fieldName === 'foto_url') {
                    // Opsional: setFormData(prev => ({ ...prev, foto_url: reader.result }));
                }

                const res = await fetch('/api/posts', {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'upload_file',
                        data: { 
                            fileData: reader.result.split(',')[1], 
                            fileName: file.name, 
                            mimeType: file.type 
                        }
                    })
                });
                const result = await res.json();
                
                if (result.status === 'success') {
                    // Update State dengan URL dari Google Drive
                    setFormData(prev => ({ ...prev, [fieldName]: result.data }));
                } else {
                    alert("Gagal upload: " + result.message);
                }
            } catch (err) { 
                alert("Error upload: " + err.message); 
            } finally {
                setUploading(false);
            }
        };
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!formData.nama_lengkap) return alert("Nama Lengkap Wajib Diisi!");
        
        setLoading(true);
        const action = initialData ? 'update' : 'create';
        
        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                body: JSON.stringify({
                    action: action,
                    table: 'tbl_guru',
                    data: { 
                        ...formData, 
                        updated_at: new Date().toISOString(), 
                        ...(action === 'create' && { created_at: new Date().toISOString() }) 
                    }
                })
            });
            const result = await res.json();
            if (result.status === 'success') {
                alert("✅ Data Guru Berhasil Disimpan!");
                window.location.href = '/admin/guru';
            } else {
                alert(result.message);
            }
        } catch (e) { alert(e.message); }
        setLoading(false);
    };

    // --- DELETE ---
    const handleDelete = async () => {
        if(!confirm("Yakin hapus data guru ini? Data permanen hilang.")) return;
        setLoading(true);
        try {
            await fetch('/api/posts', { method: 'POST', body: JSON.stringify({ action: 'delete', table: 'tbl_guru', id: formData.id }) });
            window.location.href = '/admin/guru';
        } catch(e) { alert("Gagal hapus"); setLoading(false); }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            
            {/* HEADER PAGE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sticky top-0 bg-slate-50 z-20 py-4 border-b border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{initialData ? `Edit: ${formData.nama_lengkap}` : 'Tambah Guru Baru'}</h2>
                    <p className="text-sm text-slate-500">Lengkapi data administrasi guru.</p>
                </div>
                <div className="flex gap-3">
                    <a href="/admin/guru" className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700">Kembali</a>
                    <button onClick={handleSubmit} disabled={loading || uploading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                        {loading ? <span className="animate-spin">⏳</span> : '💾'} {loading ? 'Menyimpan...' : 'Simpan Data'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* SIDEBAR TABS */}
                <div className="lg:col-span-3 space-y-2">
                    {['identitas', 'kepegawaian', 'kontak', 'pendidikan', 'berkas'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} 
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition flex justify-between items-center ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}>
                            <span className="capitalize">{tab}</span>
                            {activeTab === tab && <span>→</span>}
                        </button>
                    ))}
                    
                    {initialData && (
                        <button onClick={handleDelete} className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 mt-8 border border-red-200">
                            🗑️ Hapus Data Guru
                        </button>
                    )}
                </div>

                {/* FORM CONTENT */}
                <div className="lg:col-span-9">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[500px]">
                        
                        {/* TAB IDENTITAS */}
                        {activeTab === 'identitas' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                                    <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden border-2 border-dashed border-slate-300 flex-shrink-0 relative group">
                                        {formData.foto_url ? (
                                            <img src={formData.foto_url} className="w-full h-full object-cover" alt="Foto Profil" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Foto</div>
                                        )}
                                        
                                        {/* Overlay Loading / Upload */}
                                        <label className={`absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs cursor-pointer transition ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            {uploading ? 'Uploading...' : 'Ubah Foto'}
                                            <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'foto_url')} accept="image/*" disabled={uploading} />
                                        </label>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Foto Profil</h3>
                                        <p className="text-xs text-slate-500">Format: JPG/PNG. Max 2MB. Rasio 1:1.</p>
                                        {formData.foto_url && <span className="text-xs text-green-600 font-bold mt-1 block">✅ Foto tersimpan</span>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Nama Lengkap (Gelar)" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} placeholder="Contoh: Drs. Budi Santoso, M.Pd" />
                                    <InputField label="NIP / NUPTK" name="nip" value={formData.nip} onChange={handleChange} placeholder="Nomor Induk Pegawai" />
                                    <SelectField label="Jenis Kelamin" name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} options={['Laki-laki', 'Perempuan']} />
                                    <SelectField label="Agama" name="agama" value={formData.agama} onChange={handleChange} options={['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']} />
                                    <InputField label="Tempat Lahir" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} />
                                    <InputField label="Tanggal Lahir" name="tgl_lahir" type="date" value={formData.tgl_lahir} onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        {/* TAB KEPEGAWAIAN */}
                        {activeTab === 'kepegawaian' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SelectField label="Status Kepegawaian" name="status_pegawai" value={formData.status_pegawai} onChange={handleChange} options={['PNS', 'PPPK', 'GTY', 'GTT', 'Honorer']} />
                                    <SelectField label="Status Aktif" name="status_aktif" value={formData.status_aktif} onChange={handleChange} options={['Aktif', 'Cuti', 'Pensiun', 'Keluar']} />
                                    <InputField label="Jabatan Utama" name="jabatan" value={formData.jabatan} onChange={handleChange} placeholder="Contoh: Guru Mapel / Kepala Sekolah" />
                                    <InputField label="Mata Pelajaran Diampu" name="mapel" value={formData.mapel} onChange={handleChange} placeholder="Contoh: Matematika" />
                                    <InputField label="Nomor SK Pengangkatan" name="no_sk" value={formData.no_sk} onChange={handleChange} />
                                    <InputField label="TMT (Terhitung Mulai Tanggal)" name="tmt" type="date" value={formData.tmt} onChange={handleChange} />
                                    <InputField label="Golongan / Pangkat" name="golongan" value={formData.golongan} onChange={handleChange} placeholder="Contoh: III/a - Penata Muda" />
                                    <InputField label="Jam Mengajar / Minggu" name="jam_mengajar" type="number" value={formData.jam_mengajar} onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        {/* TAB KONTAK */}
                        {activeTab === 'kontak' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Nomor HP / WA" name="no_hp" type="tel" value={formData.no_hp} onChange={handleChange} />
                                    <InputField label="Email Pribadi" name="email" type="email" value={formData.email} onChange={handleChange} />
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alamat Lengkap</label>
                                        <textarea rows="3" name="alamat" value={formData.alamat || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"></textarea>
                                    </div>
                                    <InputField label="Kota / Kabupaten" name="kota" value={formData.kota} onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        {/* TAB PENDIDIKAN */}
                        {activeTab === 'pendidikan' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SelectField label="Pendidikan Terakhir" name="pendidikan" value={formData.pendidikan} onChange={handleChange} options={['SMA/SMK', 'D3', 'S1', 'S2', 'S3']} />
                                    <InputField label="Jurusan" name="jurusan" value={formData.jurusan} onChange={handleChange} />
                                    <InputField label="Asal Perguruan Tinggi" name="asal_pt" value={formData.asal_pt} onChange={handleChange} />
                                    <SelectField label="Sertifikasi Guru?" name="sertifikasi" value={formData.sertifikasi} onChange={handleChange} options={['Sudah', 'Belum']} />
                                </div>
                            </div>
                        )}

                        {/* TAB BERKAS */}
                        {activeTab === 'berkas' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm mb-4 border border-blue-100 flex items-start gap-3">
                                    <span className="text-xl">📂</span>
                                    <div>
                                        <strong>Area Dokumen Digital</strong><br/>
                                        Upload dokumen dalam format PDF atau Gambar (Max 2MB).
                                    </div>
                                </div>
                                <FileUploadField label="Scan SK Pengangkatan" name="doc_sk" value={formData.doc_sk} onUpload={handleUpload} uploading={uploading} />
                                <FileUploadField label="Scan Ijazah Terakhir" name="doc_ijazah" value={formData.doc_ijazah} onUpload={handleUpload} uploading={uploading} />
                                <FileUploadField label="Sertifikat Pendidik" name="doc_sertifikat" value={formData.doc_sertifikat} onUpload={handleUpload} uploading={uploading} />
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}