// src/pages/sitemap.xml.js

export const prerender = false; // Wajib False (SSR) agar bisa fetch data terbaru

export async function GET({ site }) {
  // 1. Definisikan Halaman Statis Manual (Menu Utama)
  // Anda bisa menambah/mengurangi ini sesuai menu di navigasi
  const staticPages = [
    "",           // Home
    "blog",       // Halaman Index Berita
    "profil",     // Halaman Profil
    "ppdb",       // Halaman PPDB
    "guru",       // Halaman Index Guru
    "kontak",     // Halaman Kontak
  ];

  let dynamicPosts = [];
  let dynamicGuru = [];

  // 2. Ambil Data dari Google Sheets
  try {
    const SCRIPT_URL = import.meta.env.PUBLIC_GOOGLE_SCRIPT_URL;
    
    // Kita fetch post & guru secara paralel biar cepat
    const [resPost, resGuru] = await Promise.all([
        fetch(`${SCRIPT_URL}?action=get_all&table=tbl_posts`),
        fetch(`${SCRIPT_URL}?action=get_all&table=tbl_guru`)
    ]);

    const dataPost = await resPost.json();
    const dataGuru = await resGuru.json();

    // Filter Postingan (Hanya yang published)
    if (dataPost.status === 'success') {
      dynamicPosts = dataPost.data.filter(p => p.status === 'published');
    }

    // Filter Guru (Semua guru aktif)
    if (dataGuru.status === 'success') {
      dynamicGuru = dataGuru.data.filter(g => g.status_aktif === 'Aktif');
    }

  } catch (error) {
    console.error("Sitemap generation error:", error);
  }

  // 3. Susun XML Sitemap
  // Fungsi helper untuk membuat tag <url>
  const createUrl = (path, lastmod, priority) => {
    // Pastikan site tidak null (fallback ke localhost jika dev)
    const baseUrl = site || 'http://localhost:4321';
    // Bersihkan path dari double slash
    const fullUrl = new URL(path, baseUrl).href;
    
    return `
      <url>
        <loc>${fullUrl}</loc>
        ${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}
        <priority>${priority.toFixed(1)}</priority>
      </url>
    `;
  };

  // Generate String XML
  const sitemapString = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      
      ${staticPages.map(page => createUrl(page, new Date(), page === "" ? 1.0 : 0.8)).join('')}

      ${dynamicPosts.map(post => createUrl(`blog/${post.slug}`, post.updated_at || post.created_at, 0.6)).join('')}

      ${dynamicGuru.map(guru => createUrl(`admin/guru/${guru.id}`, guru.updated_at || guru.created_at, 0.5)).join('')}

    </urlset>`.trim();


  // 4. Return Response XML
  return new Response(sitemapString, {
    headers: {
      'Content-Type': 'application/xml',
      // Cache sitemap selama 1 jam (3600 detik) agar tidak membebani Google Sheets
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    },
  });
}