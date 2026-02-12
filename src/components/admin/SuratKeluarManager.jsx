import React, { useState } from 'react';

export default function SuratKeluarManager({ initialData, sheetError }) {
    const [data, setData] = useState(initialData || []);
    const [filter, setFilter] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);
    
    const [formData, setFormData] = useState({});
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- INSTALL TABLE ---
    const handleInstallDB = async () => {
        if(!confirm("Buat tabel 'tbl_surat_keluar' sekarang?")) return;
        setLoading(true);
        try {
            const res = await fetch('/api/posts', { 
                method: 'POST',
                body: JSON.stringify({ action: 'install_table', table: 'tbl_surat_keluar' })
            });
            const result = await res.json();
            if(result.status === 'success') {
                alert("✅ Database Siap!");
                window.location.reload();
            } else {
                alert("Gagal: " + result.message);
            }
        } catch(e) { alert("Error: " + e.message); }
        setLoading(false);
    };

    // --- UPLOAD FILE ---
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return alert("⚠️ Max 2MB");

        setUploading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Content = reader.result.split(',')[1];
            try {
                const res = await fetch('/api/posts', {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'upload_file',
                        data: { fileData: base64Content, fileName: file.name, mimeType: file.type }
                    })
                });
                const result = await res.json();
                if (result.status === 'success') setFormData(prev => ({ ...prev, file_url: result.data }));
            } catch (err) { alert("Upload error"); } 
            finally { setUploading(false); }
        };
    };

    // --- CRUD ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const action = editingItem ? 'update' : 'create';
        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                body: JSON.stringify({
                    action: action,
                    table: 'tbl_surat_keluar',
                    data: { ...formData, created_at: new Date().toISOString() }
                })
            });
            const result = await res.json();
            if (result.status === 'success') window.location.reload();
            else alert(result.message);
        } catch (e) { alert(e.message); }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if(!confirm("Hapus data ini?")) return;
        try {
            await fetch('/api/posts', {
                method: 'POST',
                body: JSON.stringify({ action: 'delete', table: 'tbl_surat_keluar', id: id })
            });
            setData(data.filter(item => item.id !== id));
        } catch(e) { alert("Gagal hapus"); }
    };

    // --- PRINT ---
    const handlePrint = (item) => {
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <html>
            <head>
                <title>Surat Keluar - ${item.no_surat}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; }
                    .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid black; padding: 10px; vertical-align: top; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3>KARTU KENDALI SURAT KELUAR</h3>
                </div>
                <table>
                    <tr>
                        <td width="30%"><strong>Nomor Surat</strong></td>
                        <td>${item.no_surat}</td>
                    </tr>
                    <tr>
                        <td><strong>Tanggal Surat</strong></td>
                        <td>${item.tgl_surat}</td>
                    </tr>
                    <tr>
                        <td><strong>Tujuan Kepada</strong></td>
                        <td>${item.tujuan}</td>
                    </tr>
                    <tr>
                        <td><strong>Perihal</strong></td>
                        <td>${item.perihal}</td>
                    </tr>
                    <tr>
                        <td><strong>Catatan / Keterangan</strong></td>
                        <td height="100">${item.keterangan || '-'}</td>
                    </tr>
                </table>
                <script>window.print();</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const filteredData = data.filter(item => 
        (item.perihal || "").toLowerCase().includes(filter.toLowerCase()) || 
        (item.tujuan || "").toLowerCase().includes(filter.toLowerCase()) ||
        (item.no_surat || "").toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            
            {/* ALERT DATABASE */}
            {sheetError && sheetError.includes('tidak ditemukan') && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-6 rounded-xl flex flex-col items-center text-center">
                    <h3 className="text-lg font-bold mb-2">Database Surat Keluar Belum Ada</h3>
                    <button onClick={handleInstallDB} disabled={loading} className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition">
                        {loading ? 'Menginstall...' : '🔧 Install Database Sekarang'}
                    </button>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <input type="text" placeholder="Cari Tujuan / Perihal..." className="w-full sm:w-80 px-4 py-2 border rounded-lg" value={filter} onChange={(e) => setFilter(e.target.value)} />
                <button onClick={() => { setEditingItem(null); setFormData({}); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                    + Catat Surat Keluar
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">No. Surat / Tgl</th>
                            <th className="px-6 py-4">Tujuan</th>
                            <th className="px-6 py-4">Perihal</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.length > 0 ? filteredData.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold">{item.no_surat}<br/><span className="text-xs font-normal text-slate-500">{item.tgl_surat}</span></td>
                                <td className="px-6 py-4">{item.tujuan}</td>
                                <td className="px-6 py-4 truncate max-w-xs">{item.perihal}</td>
                                <td className="px-6 py-4 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{item.status || 'Terkirim'}</span></td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    {item.file_url && <button onClick={() => { setPreviewItem(item); setIsPreviewOpen(true); }} className="text-blue-600 font-bold text-xs underline mr-2">File</button>}
                                    <button onClick={() => handlePrint(item)} className="p-1.5 hover:bg-slate-200 rounded">🖨️</button>
                                    <button onClick={() => { setEditingItem(item); setFormData(item); setIsModalOpen(true); }} className="p-1.5 hover:bg-blue-100 rounded text-blue-600">✏️</button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600">🗑️</button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-400">Belum ada data surat keluar.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-lg mb-4">{editingItem ? 'Edit Surat Keluar' : 'Tambah Surat Keluar'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-xs font-bold text-slate-500">No. Surat</label><input required className="border p-2 rounded w-full" value={formData.no_surat || ''} onChange={e => setFormData({...formData, no_surat: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-slate-500">Tgl Surat</label><input required type="date" className="border p-2 rounded w-full" value={formData.tgl_surat || ''} onChange={e => setFormData({...formData, tgl_surat: e.target.value})} /></div>
                            </div>
                            <div><label className="text-xs font-bold text-slate-500">Tujuan Kepada</label><input required className="border p-2 rounded w-full" value={formData.tujuan || ''} onChange={e => setFormData({...formData, tujuan: e.target.value})} /></div>
                            <div><label className="text-xs font-bold text-slate-500">Perihal</label><input required className="border p-2 rounded w-full" value={formData.perihal || ''} onChange={e => setFormData({...formData, perihal: e.target.value})} /></div>
                            
                            <div className="border p-3 rounded bg-slate-50">
                                <label className="text-xs font-bold block mb-1">File Arsip (PDF/Gambar)</label>
                                <input type="file" onChange={handleFileChange} className="text-sm w-full" />
                                {uploading && <span className="text-xs text-orange-500">Uploading...</span>}
                                {formData.file_url && <span className="text-xs text-green-600">✅ File OK</span>}
                            </div>

                            <div><label className="text-xs font-bold text-slate-500">Keterangan</label><textarea className="border p-2 rounded w-full" rows="2" value={formData.keterangan || ''} onChange={e => setFormData({...formData, keterangan: e.target.value})}></textarea></div>
                            
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Batal</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">{loading ? '...' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PREVIEW MODAL */}
            {isPreviewOpen && previewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-white w-full max-w-4xl h-[80vh] rounded-lg flex flex-col">
                        <div className="p-3 border-b flex justify-between">
                            <span className="font-bold">{previewItem.perihal}</span>
                            <button onClick={() => setIsPreviewOpen(false)}>✕</button>
                        </div>
                        <iframe src={previewItem.file_url} className="flex-1 w-full h-full"></iframe>
                    </div>
                </div>
            )}
        </div>
    );
}