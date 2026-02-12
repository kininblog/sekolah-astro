import React, { useState } from 'react';
import SliderManager from './SliderManager'; // Import komponen slider yang sudah ada

export default function HomepageEditor({ sliderData, settingsData, sheetError }) {
    const [activeTab, setActiveTab] = useState('slider');
    const [settings, setSettings] = useState(
        // Convert Array dari DB menjadi Object biar mudah dipanggil (settings.kepsek_nama)
        settingsData.reduce((acc, item) => {
            acc[item.key] = item;
            return acc;
        }, {})
    );
    const [loading, setLoading] = useState(false);

    // --- FUNGSI SIMPAN SETTING (KEPSEK DLL) ---
    const handleSaveSettings = async (e, keys) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Kita simpan satu per satu key-nya
            const promises = keys.map(key => {
                const val = settings[key] || {};
                return fetch('/api/posts', {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'create', // Di GS logicnya create/append, nanti kita filter unique key di frontend atau backend logic
                        table: 'tbl_settings', // Sederhananya pakai logic insert, kalau mau update logic backend harus support 'upsert' key
                        data: { 
                            key: key,
                            value_text: val.value_text || '',
                            value_img: val.value_img || '',
                            updated_at: new Date().toISOString()
                        }
                    })
                });
            });

            await Promise.all(promises);
            alert("✅ Pengaturan berhasil disimpan!");
            window.location.reload();
        } catch (err) {
            alert("Gagal menyimpan: " + err.message);
        }
        setLoading(false);
    };

    // --- INSTALL DB SETTINGS ---
    const handleInstallDBSettings = async () => {
        if(!confirm("Buat tabel 'tbl_settings'?")) return;
        await fetch('/api/posts', { method: 'POST', body: JSON.stringify({ action: 'install_table', table: 'tbl_settings' }) });
        window.location.reload();
    };

    // --- HELPER INPUT CHANGE ---
    const handleSettingChange = (key, field, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
            
            {/* SIDEBAR TAB MENU */}
            <div className="lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h3 className="font-bold text-slate-700">Tata Letak</h3>
                        <p className="text-xs text-slate-500">Atur konten halaman depan</p>
                    </div>
                    <nav className="flex flex-col p-2 space-y-1">
                        <button onClick={() => setActiveTab('slider')} className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition flex items-center gap-3 ${activeTab === 'slider' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                            <span>🖼️</span> Hero Slider
                        </button>
                        <button onClick={() => setActiveTab('kepsek')} className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition flex items-center gap-3 ${activeTab === 'kepsek' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                            <span>👨‍🏫</span> Sambutan Kepsek
                        </button>
                        <button onClick={() => setActiveTab('program')} className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition flex items-center gap-3 ${activeTab === 'program' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                            <span>🏆</span> Program Unggulan
                        </button>
                        <button onClick={() => setActiveTab('faq')} className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition flex items-center gap-3 ${activeTab === 'faq' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                            <span>❓</span> FAQ
                        </button>
                    </nav>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1">
                
                {/* --- TAB 1: HERO SLIDER --- */}
                {activeTab === 'slider' && (
                    <div className="animate-fade-in">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                            <h2 className="text-xl font-bold mb-4">Hero Banner Slider</h2>
                            <p className="text-slate-500 text-sm mb-6">Gambar besar yang muncul pertama kali saat website dibuka.</p>
                            {/* Kita panggil komponen SliderManager yg sudah dibuat */}
                            <SliderManager initialData={sliderData} sheetError={sheetError} /> 
                        </div>
                    </div>
                )}

                {/* --- TAB 2: SAMBUTAN KEPSEK --- */}
                {activeTab === 'kepsek' && (
                    <div className="animate-fade-in">
                         {/* Cek DB Settings */}
                        {sheetError && sheetError.includes('tidak ditemukan') && (
                             <button onClick={handleInstallDBSettings} className="mb-4 w-full py-3 bg-orange-600 text-white rounded-lg font-bold">🔧 Install DB Settings</button>
                        )}

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="text-xl font-bold mb-6">Sambutan Kepala Sekolah</h2>
                            
                            <form onSubmit={(e) => handleSaveSettings(e, ['home_kepsek_nama', 'home_kepsek_text', 'home_kepsek_foto'])}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Kepala Sekolah</label>
                                        <input 
                                            className="w-full border rounded-lg p-2.5" 
                                            value={settings['home_kepsek_nama']?.value_text || ''}
                                            onChange={(e) => handleSettingChange('home_kepsek_nama', 'value_text', e.target.value)}
                                            placeholder="Contoh: Drs. Budi Santoso"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Isi Sambutan</label>
                                        <textarea 
                                            className="w-full border rounded-lg p-2.5" 
                                            rows="6"
                                            value={settings['home_kepsek_text']?.value_text || ''}
                                            onChange={(e) => handleSettingChange('home_kepsek_text', 'value_text', e.target.value)}
                                            placeholder="Assalamualaikum wr. wb..."
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL Foto Beliau</label>
                                        <input 
                                            className="w-full border rounded-lg p-2.5" 
                                            value={settings['home_kepsek_foto']?.value_text || ''}
                                            onChange={(e) => handleSettingChange('home_kepsek_foto', 'value_text', e.target.value)}
                                            placeholder="https://..."
                                        />
                                        {/* Nanti bisa ditambah fitur upload file ke Drive kayak di GuruForm */}
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t text-right">
                                    <button disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700">
                                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- TAB 3: PROGRAM (Placeholder) --- */}
                {activeTab === 'program' && (
                    <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-400">Fitur Program Unggulan akan segera hadir.</p>
                        <p className="text-xs text-slate-300 mt-2">Anda bisa menambahkan logika CRUD tabel 'tbl_programs' di sini.</p>
                    </div>
                )}
                 {/* --- TAB 4: FAQ (Placeholder) --- */}
                 {activeTab === 'faq' && (
                    <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-400">Fitur FAQ akan segera hadir.</p>
                    </div>
                )}

            </div>
        </div>
    );
}