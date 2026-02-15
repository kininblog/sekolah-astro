import React, { useState } from 'react';

export default function QuickLinkManager({ initialData, sheetError }) {
    const [links, setLinks] = useState(Array.isArray(initialData) ? initialData : []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    // --- INSTALL DB ---
    const handleInstallDB = async () => {
        if(!confirm("Buat tabel 'tbl_quick_links'?")) return;
        setLoading(true);
        try {
            await fetch('/api/posts', { method: 'POST', body: JSON.stringify({ action: 'install_table', table: 'tbl_quick_links' }) });
            window.location.reload();
        } catch(e) { alert(e.message); }
        setLoading(false);
    };

    // --- SIMPAN DATA ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const action = formData.id ? 'update' : 'create';
        try {
            await fetch('/api/posts', {
                method: 'POST',
                body: JSON.stringify({
                    action: action,
                    table: 'tbl_quick_links',
                    data: { ...formData, active: formData.active || 'Aktif', created_at: new Date().toISOString() }
                })
            });
            window.location.reload();
        } catch (e) { alert(e.message); }
        setLoading(false);
    };

    // --- HAPUS DATA ---
    const handleDelete = async (id) => {
        if(!confirm("Hapus link ini?")) return;
        setLoading(true);
        await fetch('/api/posts', { method: 'POST', body: JSON.stringify({ action: 'delete', table: 'tbl_quick_links', id }) });
        window.location.reload();
    };

    return (
        <div className="space-y-6">
            {sheetError && sheetError.includes('quick') && (
                <button onClick={handleInstallDB} disabled={loading} className="w-full py-3 bg-orange-600 text-white rounded-lg font-bold">
                    🔧 Install DB Quick Links
                </button>
            )}

            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Daftar Menu Quick Link</h3>
                <button onClick={() => { setFormData({ order: links.length + 1 }); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow hover:bg-indigo-700">
                    + Tambah Menu
                </button>
            </div>

            {/* PREVIEW CARD LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {links.sort((a,b) => (a.order || 0) - (b.order || 0)).map(item => (
                    <div key={item.id} className="relative group bg-white border border-slate-200 rounded-xl p-4 flex items-center shadow-sm hover:shadow-md transition">
                        {/* Render SVG dengan aman */}
                        <div 
                            className="w-12 h-12 text-indigo-600 flex-shrink-0 mr-4 [&>svg]:w-full [&>svg]:h-full" 
                            dangerouslySetInnerHTML={{ __html: item.svg_code }} 
                        />
                        <div>
                            <h4 className="font-bold text-slate-800 leading-tight">{item.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                        </div>
                        
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition bg-white/90 rounded px-1">
                            <button onClick={() => { setFormData(item); setIsModalOpen(true); }} className="p-1 text-blue-600 hover:text-blue-800">✏️</button>
                            <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:text-red-800">🗑️</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{formData.id ? 'Edit Menu' : 'Tambah Menu'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Kode SVG Ikon</label>
                                <textarea 
                                    className="border w-full p-2 rounded bg-slate-50 font-mono text-xs h-24" 
                                    value={formData.svg_code || ''} 
                                    onChange={e => setFormData({...formData, svg_code: e.target.value})} 
                                    placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>' 
                                    required
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Copy paste kode SVG dari Heroicons atau situs penyedia ikon lainnya.</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold uppercase text-slate-500">Judul Utama</label><input className="border w-full p-2 rounded" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Cth: E-Raport" required/></div>
                                <div><label className="text-xs font-bold uppercase text-slate-500">Deskripsi Singkat</label><input className="border w-full p-2 rounded" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Cth: Portal nilai siswa" required/></div>
                            </div>
                            
                            <div><label className="text-xs font-bold uppercase text-slate-500">Link Tujuan</label><input className="border w-full p-2 rounded" value={formData.link_url || ''} onChange={e => setFormData({...formData, link_url: e.target.value})} placeholder="Cth: /akademik atau https://..." required/></div>
                            
                            {/* --- TAMBAHAN BARU: INPUT IMAGE URL PER ITEM --- */}
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">URL Gambar Background (Opsional)</label>
                                <input 
                                    className="border w-full p-2 rounded text-sm" 
                                    value={formData.image_url || ''} 
                                    onChange={e => setFormData({...formData, image_url: e.target.value})} 
                                    placeholder="https://... (Kosongkan jika tidak ingin ada gambar)" 
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Gambar akan dibuat transparan 10% di atas warna dasar kotak.</p>
                            </div>
                            {/* ----------------------------------------------- */}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold uppercase text-slate-500">Urutan</label><input type="number" className="border w-full p-2 rounded" value={formData.order || ''} onChange={e => setFormData({...formData, order: e.target.value})} /></div>
                                <div><label className="text-xs font-bold uppercase text-slate-500">Status</label><select className="border w-full p-2 rounded" value={formData.active || 'Aktif'} onChange={e => setFormData({...formData, active: e.target.value})}><option>Aktif</option><option>Non-Aktif</option></select></div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Batal</button>
                                <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700">{loading ? 'Menyimpan...' : 'Simpan Menu'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}