// src/middleware.js
import { defineMiddleware } from "astro/middleware";

export const onRequest = defineMiddleware(async ({ request, cookies, redirect }, next) => {
  const url = new URL(request.url);

  // 1. Cek apakah user mencoba akses halaman Admin (kecuali halaman login itu sendiri)
  if (url.pathname.startsWith("/admin")) {
    
    // 2. Cek apakah punya tiket masuk (Cookie 'admin_session')
    const session = cookies.get("admin_session");

    // 3. Jika TIDAK ada cookie, tendang ke /login
    if (!session || !session.value) {
      return redirect("/login");
    }
  }

  // Jika aman, lanjut buka halaman
  return next();
});