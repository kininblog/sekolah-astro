import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// --- ICONS ---
const SaveIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);
const PublishIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>);
const LoadingIcon = () => (<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const ImageIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>);

export default function PostEditor({ initialData = null }) {
    
    // --- STATE UTAMA ---
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [slug, setSlug] = useState('');
    const quillRef = useRef(null);
    
    // --- METADATA (Kategori Flexible) ---
    const [categories, setCategories] = useState([]); // Array
    const [catInput, setCatInput] = useState('');
    
    // --- TAGS ---
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    
    // --- MEDIA & INFO ---
    const [featuredImage, setFeaturedImage] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [status, setStatus] = useState('published');
    
    // --- SEO ---
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDesc, setSeoDesc] = useState('');
    
    // --- AUTHOR & DATE ---
    const [author, setAuthor] = useState('Admin'); // Default
    const [publishedAt, setPublishedAt] = useState(''); // YYYY-MM-DDTHH:MM
    
    // --- SYSTEM ---
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [wordCount, setWordCount] = useState(0);

    // --- 1. INISIALISASI DATA (Load Author & Edit Data) ---
    useEffect(() => {
        // Ambil Author dari Login Session
        const userSession = localStorage.getItem('admin_user');
        if (userSession) {
            try {
                const user = JSON.parse(userSession);
                setAuthor(user.name || user.username || 'Admin');
            } catch (e) { console.error("Gagal load user session"); }
        }

        // Set Tanggal Hari Ini sebagai Default jika baru
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Adjust timezone
        const defaultDate = now.toISOString().slice(0, 16); // Format datetime-local
        setPublishedAt(defaultDate);

        // Jika Mode Edit: Isi form dengan data lama
        if (initialData) {
            setTitle(initialData.title || '');
            setContent(initialData.content || '');
            setSlug(initialData.slug || '');
            setFeaturedImage(initialData.thumbnail || '');
            setExcerpt(initialData.excerpt || '');
            setStatus(initialData.status || 'published');
            
            // Handle Arrays (String dipisah koma)
            if (initialData.categories) setCategories(initialData.categories.split(',').filter(c => c.trim()));
            if (initialData.tags) setTags(initialData.tags.split(',').filter(t => t.trim()));

            // Handle SEO
            setSeoTitle(initialData.seo_title || initialData.title || '');
            setSeoDesc(initialData.seo_desc || '');

            // Handle Date
            if (initialData.published_at) {
                // Convert ISO string to datetime-local format
                const pDate = new Date(initialData.published_at);
                pDate.setMinutes(pDate.getMinutes() - pDate.getTimezoneOffset());
                setPublishedAt(pDate.toISOString().slice(0, 16));
            }
            
            // Override Author jika data lama punya author
            if (initialData.author) setAuthor(initialData.author);
        }
    }, [initialData]);

    // --- 2. AUTO SLUG ---
    useEffect(() => {
        if (!initialData) { 
            const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            if (!slug || slug.replace(/-/g, ' ') === title.toLowerCase()) {
                setSlug(autoSlug);
            }
            if (!seoTitle) setSeoTitle(title); // Auto fill SEO Title
        }
    }, [title]);

    useEffect(() => {
        const text = content.replace(/<[^>]*>/g, '');
        setWordCount(text.trim() === '' ? 0 : text.trim().split(/\s+/).length);
    }, [content]);

    // --- HANDLERS: INPUT KATEGORI & TAGS (FLEXIBLE) ---
    const handleArrayInput = (e, state, setState, inputState, setInputState) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = inputState.trim();
            if (val && !state.includes(val)) {
                setState([...state, val]);
                setInputState('');
            }
        }
    };

    const removeArrayItem = (itemToRemove, state, setState) => {
        setState(state.filter(item => item !== itemToRemove));
    };

    // --- HANDLER GAMBAR ---
    const validateAndSetImage = (url) => {
        if (url && url.trim().startsWith('data:image')) {
            alert("⛔ ERROR: Jangan paste gambar Base64! Database akan penuh. Gunakan URL Link gambar.");
            return;
        }
        setFeaturedImage(url);
    };

    const imageHandler = () => {
        const url = prompt("Masukkan URL Gambar (https://...):");
        if (url) {
            if (url.trim().startsWith('data:image')) {
                alert("⛔ Dilarang Base64."); return;
            }
            const editor = quillRef.current.getEditor();
            const range = editor.getSelection();
            editor.insertEmbed(range.index, 'image', url);
        }
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [2, 3, 4, false] }],
                ['bold', 'italic', 'underline', 'blockquote'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'align': [] }, 'link', 'image', 'code-block'],
                ['clean']
            ],
            handlers: { image: imageHandler }
        }
    }), []);

    // --- FUNGSI SIMPAN KE DATABASE ---
    // --- FUNGSI SIMPAN KE DATABASE ---
    const handleAction = async (newStatus) => {
        if (!title) return alert("Mohon isi judul postingan!");
        
        setIsSaving(true);
        const nowISO = new Date().toISOString();

        // --- FIX PENTING: Ambil input kategori/tags yang tertinggal (lupa tekan Enter) ---
        let finalCategories = [...categories];
        if (catInput.trim()) {
            finalCategories.push(catInput.trim());
        }

        let finalTags = [...tags];
        if (tagInput.trim()) {
            finalTags.push(tagInput.trim());
        }
        // -----------------------------------------------------------------------------

        try {
            const actionType = initialData ? 'update' : 'create';
            
            const payload = {
                action: actionType,
                table: 'tbl_posts', 
                data: {
                    ...(initialData && { id: initialData.id }), 
                    
                    title, 
                    slug, 
                    content, 
                    excerpt, 
                    status: newStatus || status,
                    
                    // Gunakan variabel finalCategories & finalTags yang sudah diperbaiki
                    categories: finalCategories.join(','), 
                    tags: finalTags.join(','),             
                    
                    thumbnail: featuredImage, 
                    author: author,
                    seo_title: seoTitle,
                    seo_desc: seoDesc, 
                    
                    published_at: publishedAt ? new Date(publishedAt).toISOString() : nowISO,
                    updated_at: nowISO,
                    ...(initialData ? {} : { created_at: nowISO })
                }
            };

            // Debugging: Cek data di Console Browser (F12 -> Console)
            console.log("Mengirim Data:", payload); 

            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                alert("✅ Data Berhasil Disimpan!");
                window.location.href = '/admin/posts';
            } else {
                throw new Error(result.message || "Gagal menghubungi server");
            }
        } catch (error) {
            alert("❌ Error: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="font-sans bg-slate-50 min-h-screen pb-20 text-slate-800">
            {/* CSS CUSTOM QUILL */}
            <style>{`
                .ql-toolbar.ql-snow { background: #f8fafc; border: none !important; border-bottom: 1px solid #e2e8f0 !important; border-radius: 12px 12px 0 0; padding: 16px !important; position: sticky; top: 0; z-index: 40; }
                .ql-container.ql-snow { border: none !important; background: white; border-radius: 0 0 12px 12px; min-height: 600px; }
                .ql-editor { padding: 40px 50px !important; font-family: 'Inter', sans-serif; font-size: 17px; line-height: 1.8; color: #334155; }
                .ql-editor h2 { font-size: 2em; font-weight: 800; margin-top: 1.5em; color: #1e293b; }
            `}</style>

            {/* --- TOP BAR --- */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 mb-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <a href="/admin/posts" className="text-slate-400 hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></a>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 leading-tight">
                                {initialData ? 'Edit Artikel' : 'Tulis Artikel Baru'}
                            </h1>
                            <div className="text-xs text-slate-500 flex gap-2 mt-1">
                                <span>{wordCount} kata</span> • 
                                <span className="text-indigo-600">Author: {author}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => handleAction('draft')} className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium flex items-center gap-2"><SaveIcon /> Draft</button>
                        <button onClick={() => handleAction('published')} disabled={isSaving} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold flex items-center gap-2 disabled:opacity-70">
                            {isSaving ? <LoadingIcon /> : <PublishIcon />} {isSaving ? 'Menyimpan...' : 'Publikasikan'}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* KOLOM KIRI (EDITOR & SEO) */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* TITLE & EDITOR */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                        <div className="p-8 md:p-10 pb-0">
                            <input type="text" placeholder="Judul Artikel..." className="w-full text-4xl font-extrabold border-none focus:ring-0 placeholder-slate-300 bg-transparent outline-none text-slate-900 mb-4"
                                value={title} onChange={(e) => setTitle(e.target.value)} />
                             <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 py-2 px-3 rounded-md border border-slate-100">
                                <span className="text-slate-400">slug:</span>
                                <input type="text" className="bg-transparent border-none focus:ring-0 outline-none text-indigo-600 font-medium w-full p-0" value={slug} onChange={(e) => setSlug(e.target.value)} />
                            </div>
                        </div>
                        <ReactQuill ref={quillRef} theme="snow" value={content} onChange={setContent} modules={modules} placeholder="Mulai menulis konten..." />
                    </div>

                    {/* SEO CARD (Fixed) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            SEO Optimization
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Meta Title (Judul di Google)</label>
                                <input type="text" className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={title} />
                                <p className="text-[10px] text-slate-400 mt-1">Disarankan max 60 karakter.</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Meta Description (Deskripsi di Google)</label>
                                <textarea rows="3" className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} placeholder="Ringkasan singkat tentang artikel ini..."></textarea>
                                <p className="text-[10px] text-slate-400 mt-1">Disarankan max 160 karakter.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KOLOM KANAN (SETTINGS) */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* PUBLISH DATE & AUTHOR */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-widest">Jadwal & Penulis</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Tanggal Publikasi</label>
                                <input type="datetime-local" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                    value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Penulis</label>
                                <input type="text" className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                                    value={author} readOnly title="Otomatis dari Login" />
                            </div>
                        </div>
                    </div>

                    {/* KATEGORI FLEXIBLE */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-widest">Kategori</h3>
                        
                        {/* List Selected Categories */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {categories.map(cat => (
                                <span key={cat} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs px-2 py-1 rounded-full flex gap-1 items-center">
                                    {cat} 
                                    <button onClick={() => removeArrayItem(cat, categories, setCategories)} className="hover:text-red-500">×</button>
                                </span>
                            ))}
                        </div>
                        
                        {/* Input Flexible */}
                        <input type="text" placeholder="+ Tambah Kategori (Enter)" 
                            className="w-full text-sm border border-slate-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={catInput} 
                            onChange={(e) => setCatInput(e.target.value)} 
                            onKeyDown={(e) => handleArrayInput(e, categories, setCategories, catInput, setCatInput)} 
                        />
                        
                        {/* Suggestions (Optional) */}
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400 mb-2">Sering digunakan:</p>
                            <div className="flex flex-wrap gap-2">
                                {['Berita', 'Prestasi', 'Artikel', 'Pengumuman'].map(s => (
                                    <button key={s} onClick={() => !categories.includes(s) && setCategories([...categories, s])} 
                                        className="text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded hover:bg-slate-100 text-slate-600">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* TAGS FLEXIBLE */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-widest">Tags / Topik</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {tags.map(tag => (
                                <span key={tag} className="bg-slate-100 text-slate-600 border border-slate-200 text-xs px-2 py-1 rounded-full flex gap-1 items-center">
                                    #{tag} 
                                    <button onClick={() => removeArrayItem(tag, tags, setTags)} className="hover:text-red-500">×</button>
                                </span>
                            ))}
                        </div>
                        <input type="text" placeholder="+ Tambah Tag (Enter)" 
                            className="w-full text-sm border border-slate-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={tagInput} 
                            onChange={(e) => setTagInput(e.target.value)} 
                            onKeyDown={(e) => handleArrayInput(e, tags, setTags, tagInput, setTagInput)} 
                        />
                    </div>

                    {/* FEATURED IMAGE */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-widest flex items-center gap-2"><ImageIcon /> Featured Image</h3>
                        {featuredImage ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-4">
                                <img src={featuredImage} alt="Thumbnail" className="w-full h-40 object-cover" />
                                <button onClick={() => setFeaturedImage('')} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                            </div>
                        ) : (
                            <div onClick={() => { const url = prompt("Masukkan URL Gambar:"); validateAndSetImage(url); }} className="border-2 border-dashed border-slate-300 rounded-xl h-32 flex flex-col items-center justify-center text-slate-400 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition cursor-pointer mb-4">
                                <ImageIcon /> <span className="text-xs font-medium mt-2">Klik tambah URL</span>
                            </div>
                        )}
                        <input type="text" placeholder="Atau paste URL di sini..." className="w-full text-sm border border-slate-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" value={featuredImage} onChange={(e) => validateAndSetImage(e.target.value)} />
                    </div>

                    {/* EXCERPT */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-widest">Ringkasan (Excerpt)</h3>
                        <textarea rows="3" className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Teks singkat untuk preview..." value={excerpt} onChange={(e) => setExcerpt(e.target.value)}></textarea>
                    </div>

                </div>
            </div>
        </div>
    );
}