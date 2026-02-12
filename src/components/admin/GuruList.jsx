import React, { useState, useMemo } from 'react';

export default function GuruList({ initialData, sheetError }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [loading, setLoading] = useState(false);

    // --- FILTER LOGIC (FIXED) ---
    const filteredData = useMemo(() => {
        // Cek jika data kosong/rusak
        if (!initialData || !Array.isArray(initialData)) return [];
        
        return initialData.filter(guru => {
            if (!guru) return false;

            const term = searchTerm.toLowerCase();

            // --- PERBAIKAN UTAMA DI SINI ---
            // Kita bungkus pakai String(...) agar Angka tidak error saat di-toLowerCase()
            const matchName = String(guru.nama_lengkap || '').toLowerCase().includes(term);
            const matchNip = String(guru.nip || '').toLowerCase().includes(term); // <--- INI BIANG KEROKNYA TADI
            const matchMapel = String(guru.mapel || '').toLowerCase().includes(term);
            const matchJabatan = String(guru.jabatan || '').toLowerCase().includes(term);
            // -------------------------------
            
            const matchStatus = statusFilter === 'Semua' || guru.status_aktif === statusFilter;

            return (matchName || matchNip || matchMapel || matchJabatan) && matchStatus;
        });
    }, [initialData, searchTerm, statusFilter]);

    // --- HANDLE INSTALL DB ---
    const handleInstallDB = async () => {
        if(!confirm("Buat tabel 'tbl_guru' di database?")) return;
        setLoading(true);
        try {
            await fetch('/api/posts', { 
                method: 'POST', 
                body: JSON.stringify({ action: 'install_table', table: 'tbl_guru' }) 
            });
            window.location.reload();
        } catch(e) { alert(e.message); }
        setLoading(false);
    };

    // --- HELPER COLORS ---
    const getStatusColor = (status) => {
        switch (status) {
            case 'Aktif': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Cuti': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Pensiun': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-red-100 text-red-700 border-red-200';
        }
    };

    const getPegawaiColor = (status) => {
        switch (status) {
            case 'PNS': return 'bg-blue-100 text-blue-700';
            case 'PPPK': return 'bg-indigo-100 text-indigo-700';
            case 'GTY': return 'bg-purple-100 text-purple-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="space-y-8 pb-12">

            {/* ERROR STATE: DB BELUM ADA */}
            {sheetError && sheetError.includes('tidak ditemukan') && (
                <div className="bg-white border-l-4 border-orange-500 shadow-sm rounded-r-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Database Guru Belum Siap</h3>
                        <p className="text-slate-500 text-sm">Tabel 'tbl_guru' belum ada di Google Sheets.</p>
                    </div>
                    <button onClick={handleInstallDB} disabled={loading} className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold shadow transition disabled:opacity-50">
                        {loading ? 'Memproses...' : '🔧 Install Database Sekarang'}
                    </button>
                </div>
            )}

            {/* HEADER & TOOLBAR */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Guru & Staf</h1>
                        <p className="text-slate-500 mt-1">Kelola data pendidik, kepegawaian, dan administrasi sekolah.</p>
                    </div>
                    <a href="/admin/guru/new" className="group flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-semibold shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-200 transition-all duration-300">
                        <span className="text-lg">+</span> Tambah Guru
                    </a>
                </div>

                {/* SEARCH BAR */}
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Cari nama, NIP, jabatan, atau mapel..." 
                            className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="h-px md:h-auto md:w-px bg-slate-100 mx-2"></div>
                    <div className="relative md:w-48">
                        <select 
                            className="w-full h-full pl-4 pr-8 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-semibold text-slate-600 outline-none cursor-pointer transition"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="Semua">Semua Status</option>
                            <option value="Aktif">Aktif</option>
                            <option value="Cuti">Cuti</option>
                            <option value="Pensiun">Pensiun</option>
                            <option value="Keluar">Keluar</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* STATS BAR */}
            <div className="flex items-center justify-between text-sm text-slate-500 px-1">
                <p>Menampilkan <strong className="text-slate-900">{filteredData.length}</strong> data guru.</p>
                {searchTerm && <button onClick={() => setSearchTerm('')} className="text-indigo-600 hover:underline">Reset</button>}
            </div>

            {/* GRID SYSTEM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredData.map((item) => (
                    <a href={`/admin/guru/${item.id}`} key={item.id} className="group relative bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden h-full">
                        
                        {/* Header Gradient */}
                        <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 group-hover:from-indigo-50 group-hover:to-blue-50 transition-colors"></div>
                        
                        {/* Avatar */}
                        <div className="px-6 -mt-12 mb-4 flex justify-between items-end">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                                    {item.foto_url ? (
                                        <img src={item.foto_url} alt={item.nama_lengkap} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 text-3xl">👤</div>
                                    )}
                                </div>
                                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white ${item.status_aktif === 'Aktif' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(item.status_aktif)}`}>
                                {item.status_aktif || 'N/A'}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="px-6 pb-6 flex-1 flex flex-col">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition mb-1 line-clamp-2" title={item.nama_lengkap}>
                                    {item.nama_lengkap}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getPegawaiColor(item.status_pegawai)}`}>
                                        {item.status_pegawai || 'Honorer'}
                                    </span>
                                    <p className="text-xs text-slate-400 font-mono truncate">{item.nip || '-'}</p>
                                </div>
                            </div>

                            <div className="mt-auto space-y-3 pt-4 border-t border-slate-50">
                                <div className="flex items-start gap-3 text-sm">
                                    <div className="mt-0.5 text-slate-400 text-xs">JABATAN</div>
                                    <p className="text-slate-700 font-medium line-clamp-1">{item.jabatan || '-'}</p>
                                </div>
                                <div className="flex items-start gap-3 text-sm">
                                    <div className="mt-0.5 text-slate-400 text-xs">MAPEL</div>
                                    <p className="text-slate-700 font-medium line-clamp-1">{item.mapel || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Hover Line */}
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </a>
                ))}
            </div>

            {/* EMPTY STATE */}
            {filteredData.length === 0 && (
                <div className="text-center py-20 px-4 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Tidak ditemukan data guru.</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        {searchTerm ? `Tidak ada guru dengan kata kunci "${searchTerm}".` : "Belum ada data guru tersimpan."}
                    </p>
                    {searchTerm ? (
                        <button onClick={() => setSearchTerm('')} className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition">
                            Bersihkan Pencarian
                        </button>
                    ) : (
                        <a href="/admin/guru/new" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                            + Tambah Guru Pertama
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}