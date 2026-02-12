import React, { useState } from 'react';

export default function SliderManager({ initialData, sheetError }) {
    // Pastikan sliders selalu array
    const [sliders, setSliders] = useState(Array.isArray(initialData) ? initialData : []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // --- INSTALL DB ---
    const handleInstallDB = async () => {
        if(!confirm("Buat tabel 'tbl_sliders' sekarang?")) return;
        setLoading(true);
        try {
            await fetch('/api/posts', { method: 'POST', body: JSON.stringify({ action: 'install_table', table: 'tbl_sliders' }) });
            window.location.reload();
        } catch(e) { alert(e.message); }
        setLoading(false);
    };

    // --- UPLOAD GAMBAR (Opsional) ---
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) return alert("File terlalu besar (Max 2MB)");

        setUploading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const res = await fetch('/api/posts', {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'upload_file',
                        data: { fileData: reader.result.split(',')[1], fileName: file.name, mimeType: file.type }
                    })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    // Update field URL dengan link dari Drive
                    setFormData(prev => ({ ...prev, image_url: result.data }));
                } else {
                    alert("Gagal upload: " + result.message);
                }
            } catch (err) { alert("Gagal upload"); }
            setUploading(false);
        };
    };

    // --- SIMPAN DATA ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const action = formData.id ? 'update' : 'create';
        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                body: JSON.stringify({
                    action: action,
                    table: 'tbl_sliders',
                    data: { ...formData, active: formData.active || 'Aktif', created_at: new Date().toISOString() }
                })
            });
            const result = await res.json();
            if(result.status === 'success') {
                window.location.reload();
            } else {
                alert(result.message);
            }
        } catch (e) { alert(e.message); }
        setLoading(false);
    };

    // --- HAPUS DATA ---
    const handleDelete = async (id) => {
        if(!confirm("Hapus slider ini?")) return;
        await fetch('/api/posts', { method: 'POST', body: JSON.stringify({ action: 'delete', table: 'tbl_sliders', id }) });
        window.location.reload();
    };

    return (
        <div className="space-y-6">
            {/* INSTALL ALERT */}
            {sheetError && sheetError.includes('tidak ditemukan') && (
                <button onClick={handleInstallDB} disabled={loading} className="w-full py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700">
                    {loading ? 'Menginstall...' : '🔧 Install Database Slider'}
                </button>
            )}

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <button onClick={() => { setFormData({ order: sliders.length + 1 }); setIsModalOpen(true); }} className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                    + Tambah Slide
                </button>
            </div>

            {/* LIST SLIDER (PREVIEW CARD) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sliders.length > 0 ? sliders.sort((a,b) => (a.order || 0) - (b.order || 0)).map(item => (
                    <div key={item.id} className="group relative bg-slate-900 rounded-xl overflow-hidden aspect-video border border-slate-200 shadow-md">
                        {/* Image Preview */}
                        <img src={item.image_url} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500" onError={(e) => e.target.src = 'https://via.placeholder.com/640x360?text=Error+Image'} />
                        
                        {/* Text Overlay Preview */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-center items-center text-center">
                            <span className="text-white/80 text-xs uppercase tracking-widest font-bold mb-1">{item.title_small}</span>
                            <h3 className="text-white text-2xl font-extrabold leading-tight mb-2 line-clamp-2">{item.title_big}</h3>
                            {item.button_text && (
                                <span className="px-3 py-1 bg-white/20 backdrop-blur text-white text-xs rounded-full border border-white/30">
                                    Btn: {item.button_text}
                                </span>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setFormData(item); setIsModalOpen(true); }} className="p-2 bg-white text-blue-600 rounded-lg shadow hover:bg-blue-50">✏️</button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 bg-white text-red-600 rounded-lg shadow hover:bg-red-50">🗑️</button>
                        </div>
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 text-white text-xs rounded backdrop-blur">
                            #{item.order} • {item.active}
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                        Belum ada slider. Tambahkan sekarang!
                    </div>
                )}
            </div>

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xl font-bold">{formData.id ? 'Edit Slide' : 'Tambah Slide Baru'}</h3>
                             <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                       
                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* --- UPDATE: INPUT URL & UPLOAD GABUNG --- */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">URL Gambar Background</label>
                                
                                {/* Preview Kecil */}
                                {formData.image_url && (
                                    <div className="h-32 w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200 mb-2">
                                        <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" onError={(e) => e.target.style.display='none'} />
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        className="flex-1 border p-2 rounded" 
                                        value={formData.image_url || ''} 
                                        onChange={e => setFormData({...formData, image_url: e.target.value})} 
                                        placeholder="https://contoh.com/gambar.jpg" 
                                    />
                                    {/* Tombol Upload (Hidden Input Trick) */}
                                    <label className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded cursor-pointer hover:bg-indigo-100 whitespace-nowrap flex items-center gap-2">
                                        {uploading ? '⏳' : '📤 Upload'}
                                        <input type="file" onChange={handleUpload} className="hidden" accept="image/*" disabled={uploading}/>
                                    </label>
                                </div>
                                <p className="text-xs text-slate-400">Paste URL gambar langsung ATAU klik Upload untuk hosting ke Google Drive.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Judul Kecil (Atas)</label><input className="border w-full p-2 rounded" value={formData.title_small || ''} onChange={e => setFormData({...formData, title_small: e.target.value})} placeholder="Cth: Selamat Datang di" /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Judul Besar (Utama)</label><input className="border w-full p-2 rounded" value={formData.title_big || ''} onChange={e => setFormData({...formData, title_big: e.target.value})} placeholder="Cth: NAMA SEKOLAH" /></div>
                            </div>

                            <div><label className="text-xs font-bold text-slate-500 uppercase">Deskripsi</label><textarea className="border w-full p-2 rounded" rows="2" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Deskripsi singkat..."></textarea></div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Teks Tombol</label><input className="border w-full p-2 rounded" value={formData.button_text || ''} onChange={e => setFormData({...formData, button_text: e.target.value})} placeholder="Cth: Daftar Sekarang" /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Link Tombol</label><input className="border w-full p-2 rounded" value={formData.button_link || ''} onChange={e => setFormData({...formData, button_link: e.target.value})} placeholder="Cth: /ppdb" /></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Urutan</label><input type="number" className="border w-full p-2 rounded" value={formData.order || ''} onChange={e => setFormData({...formData, order: e.target.value})} /></div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                    <select className="border w-full p-2 rounded bg-white" value={formData.active || 'Aktif'} onChange={e => setFormData({...formData, active: e.target.value})}>
                                        <option value="Aktif">Aktif</option>
                                        <option value="Non-Aktif">Sembunyikan</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium">Batal</button>
                                <button type="submit" disabled={loading || uploading} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50">
                                    {loading ? 'Menyimpan...' : 'Simpan Slider'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}