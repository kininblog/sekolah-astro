import React, { useState, useEffect } from 'react';

export default function SuratMasukManager({ initialData, sheetError }) {
    const [data, setData] = useState(initialData || []);
    const [filter, setFilter] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);
    
    // Form State
    const [formData, setFormData] = useState({});
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- FITUR 1: INSTALL DATABASE ---
    const handleInstallDB = async () => {
        if(!confirm("Buat tabel 'tbl_surat_masuk' di Google Sheets sekarang?")) return;
        setLoading(true);
        try {
            const res = await fetch('/api/posts', { // Kita pakai endpoint proxy yg sama
                method: 'POST',
                body: JSON.stringify({ action: 'install_table', table: 'tbl_surat_masuk' })
            });
            const result = await res.json();
            if(result.status === 'success') {
                alert("✅ Database Berhasil Diinstall! Silakan refresh halaman.");
                window.location.reload();
            } else {
                alert("Gagal: " + result.message);
            }
        } catch(e) { alert("Error: " + e.message); }
        setLoading(false);
    };

    // --- FITUR 2: HANDLE UPLOAD FILE ---
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // Max 2MB (Google Script Limit)
            alert("⚠️ File terlalu besar! Maksimal 2MB.");
            e.target.value = "";
            return;
        }

        setUploading(true);
        
        // Convert to Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Content = reader.result.split(',')[1]; // Hapus prefix data:image/...
            
            try {
                const res = await fetch('/api/posts', {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'upload_file',
                        data: {
                            fileData: base64Content,
                            fileName: file.name,
                            mimeType: file.type
                        }
                    })
                });
                const result = await res.json();
                
                if (result.status === 'success') {
                    setFormData({ ...formData, file_url: result.data }); // Simpan URL Drive
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

    // --- FITUR 3: SIMPAN DATA ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const action = editingItem ? 'update' : 'create';
        const payload = {
            action: action,
            table: 'tbl_surat_masuk',
            data: { ...formData, created_at: new Date().toISOString() }
        };

        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.status === 'success') {
                alert("✅ Data Berhasil Disimpan!");
                window.location.reload();
            } else {
                alert("Gagal: " + result.message);
            }
        } catch (e) { alert("Error: " + e.message); }
        setLoading(false);
    };

    // --- FITUR 4: HAPUS DATA ---
    const handleDelete = async (id) => {
        if(!confirm("Yakin hapus surat ini?")) return;
        try {
            await fetch('/api/posts', {
                method: 'POST',
                body: JSON.stringify({ action: 'delete', table: 'tbl_surat_masuk', id: id })
            });
            setData(data.filter(item => item.id !== id));
        } catch(e) { alert("Gagal hapus"); }
    };

    // --- FITUR 5: PRINT DISPOSISI ---
    const handlePrint = (item) => {
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <html>
            <head>
                <title>Lembar Disposisi - ${item.no_surat}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; }
                    .header { text-align: center; border-bottom: 3px double black; padding-bottom: 10px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid black; padding: 10px; vertical-align: top; }
                    .title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;}
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">Lembar Disposisi Surat Masuk</div>
                    <div>Nomor Agenda: ${item.id.substring(0,8)}</div>
                </div>
                <table>
                    <tr>
                        <td width="50%"><strong>Surat Dari:</strong><br>${item.pengirim}</td>
                        <td width="50%"><strong>Diterima Tanggal:</strong><br>${item.tgl_terima}</td>
                    </tr>
                    <tr>
                        <td><strong>Nomor Surat:</strong><br>${item.no_surat}</td>
                        <td><strong>Tanggal Surat:</strong><br>${item.tgl_surat}</td>
                    </tr>
                    <tr>
                        <td colspan="2"><strong>Perihal:</strong><br>${item.perihal}</td>
                    </tr>
                    <tr>
                        <td height="150"><strong>Diteruskan Kepada:</strong></td>
                        <td><strong>Instruksi / Catatan:</strong><br>${item.keterangan || '-'}</td>
                    </tr>
                </table>
                <script>window.print();</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Filter Logic
    const filteredData = data.filter(item => 
        item.perihal?.toLowerCase().includes(filter.toLowerCase()) || 
        item.pengirim?.toLowerCase().includes(filter.toLowerCase()) ||
        item.no_surat?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            
            {/* --- JIKA DATABASE BELUM ADA --- */}
            {sheetError && sheetError.includes('tidak ditemukan') && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-6 rounded-xl flex flex-col items-center text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-orange-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                    <h3 className="text-lg font-bold">Database Surat Masuk Belum Ada</h3>
                    <p className="mb-4 text-sm">Sistem tidak menemukan tabel 'tbl_surat_masuk' di Google Sheets Anda.</p>
                    <button onClick={handleInstallDB} disabled={loading} className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition">
                        {loading ? 'Menginstall...' : '🔧 Install Database Sekarang'}
                    </button>
                </div>
            )}

            {/* --- HEADER & SEARCH --- */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <input type="text" placeholder="Cari No Surat / Perihal..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={filter} onChange={(e) => setFilter(e.target.value)} />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <button onClick={() => { setEditingItem(null); setFormData({}); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Tambah Surat
                </button>
            </div>

            {/* --- TABLE DATA --- */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">No. Surat / Tgl</th>
                                <th className="px-6 py-4">Pengirim</th>
                                <th className="px-6 py-4">Perihal</th>
                                <th className="px-6 py-4 text-center">File</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/80">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{item.no_surat}</div>
                                        <div className="text-xs text-slate-500">{item.tgl_surat}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{item.pengirim}</td>
                                    <td className="px-6 py-4 text-slate-700 max-w-xs truncate" title={item.perihal}>{item.perihal}</td>
                                    <td className="px-6 py-4 text-center">
                                        {item.file_url ? (
                                            <button onClick={() => { setPreviewItem(item); setIsPreviewOpen(true); }} className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-center gap-1 mx-auto">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg> Lihat
                                            </button>
                                        ) : <span className="text-slate-400 text-xs">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {item.status || 'Proses'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handlePrint(item)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Print Disposisi"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg></button>
                                            <button onClick={() => { setEditingItem(item); setFormData(item); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL FORM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
                        <h3 className="text-xl font-bold mb-4">{editingItem ? 'Edit Surat' : 'Tambah Surat Masuk'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase">No. Surat</label><input required type="text" className="w-full mt-1 border rounded-lg p-2 text-sm" value={formData.no_surat || ''} onChange={e => setFormData({...formData, no_surat: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Pengirim</label><input required type="text" className="w-full mt-1 border rounded-lg p-2 text-sm" value={formData.pengirim || ''} onChange={e => setFormData({...formData, pengirim: e.target.value})} /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Tgl Surat</label><input required type="date" className="w-full mt-1 border rounded-lg p-2 text-sm" value={formData.tgl_surat || ''} onChange={e => setFormData({...formData, tgl_surat: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Tgl Terima</label><input required type="date" className="w-full mt-1 border rounded-lg p-2 text-sm" value={formData.tgl_terima || ''} onChange={e => setFormData({...formData, tgl_terima: e.target.value})} /></div>
                            </div>
                            <div><label className="text-xs font-bold text-slate-500 uppercase">Perihal</label><input required type="text" className="w-full mt-1 border rounded-lg p-2 text-sm" value={formData.perihal || ''} onChange={e => setFormData({...formData, perihal: e.target.value})} /></div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Upload File (PDF/Gambar - Max 2MB)</label>
                                <input type="file" accept=".pdf,image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                                {uploading && <p className="text-xs text-orange-500 mt-1 animate-pulse">Sedang mengupload ke Drive...</p>}
                                {formData.file_url && !uploading && <p className="text-xs text-green-600 mt-1">✅ File terlampir</p>}
                            </div>

                            <div><label className="text-xs font-bold text-slate-500 uppercase">Keterangan / Disposisi Awal</label><textarea className="w-full mt-1 border rounded-lg p-2 text-sm" rows="2" value={formData.keterangan || ''} onChange={e => setFormData({...formData, keterangan: e.target.value})}></textarea></div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                    <select className="w-full mt-1 border rounded-lg p-2 text-sm" value={formData.status || 'Proses'} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        <option value="Proses">Proses</option>
                                        <option value="Disposisi">Disposisi</option>
                                        <option value="Selesai">Selesai</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                                <button type="submit" disabled={loading || uploading} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
                                    {loading ? 'Menyimpan...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL PREVIEW --- */}
            {isPreviewOpen && previewItem && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold">{previewItem.perihal}</h3>
                            <button onClick={() => setIsPreviewOpen(false)} className="p-1 hover:bg-slate-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                        </div>
                        <div className="flex-1 bg-slate-100 p-4">
                            <iframe src={previewItem.file_url} className="w-full h-full rounded-lg border bg-white" title="Preview"></iframe>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}