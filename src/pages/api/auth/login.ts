// src/pages/api/auth/login.ts
export const prerender = false;
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { username, password } = body;

    // --- 1. Verifikasi ke Google Apps Script (Backend) ---
    const SCRIPT_URL = import.meta.env.PUBLIC_GOOGLE_SCRIPT_URL;
    
    // Kirim request login ke Google Script
    const response = await fetch(`${SCRIPT_URL}?action=auth_login`, {
        method: "POST",
        body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();

    // --- 2. Jika Login Sukses, Buat Cookie ---
    if (result.status === 'success') {
        
        // Simpan Cookie 'admin_session'
        // HttpOnly: Tidak bisa diakses JS (Anti XSS)
        // Path: Berlaku di seluruh web
        // MaxAge: Expired dalam 1 hari (86400 detik)
        cookies.set("admin_session", JSON.stringify(result.data), {
            path: "/",
            httpOnly: true, 
            secure: import.meta.env.PROD, // Secure cuma aktif di https (production)
            maxAge: 60 * 60 * 24 
        });

        return new Response(JSON.stringify({ success: true, user: result.data }), { status: 200 });
    } else {
        return new Response(JSON.stringify({ success: false, message: "Username/Password Salah" }), { status: 401 });
    }

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: "Server Error" }), { status: 500 });
  }
};