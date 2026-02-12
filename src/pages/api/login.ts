// src/pages/api/login.ts

// 1. Matikan prerender agar API ini jalan di server (SSR)
export const prerender = false;

// 2. Import tipe data dari Astro (INI YANG HILANG SEBELUMNYA)
import type { APIRoute } from "astro";

// 3. Definisikan fungsi POST dengan tipe APIRoute
export const POST: APIRoute = async ({ request }) => {
  
  // Cek Header Content-Type
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response(JSON.stringify({ message: "Format data harus JSON" }), { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ message: "Data tidak terbaca/Kosong" }), { status: 400 });
  }

  const { username, password } = body;
  const GOOGLE_URL = import.meta.env.PUBLIC_GOOGLE_SCRIPT_URL;

  // Cek apakah URL ada di .env
  if (!GOOGLE_URL) {
    return new Response(JSON.stringify({ message: "Konfigurasi Server Belum Lengkap (.env missing)" }), { status: 500 });
  }

  try {
    const res = await fetch(`${GOOGLE_URL}?action=auth_login`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const textResult = await res.text();
    let result;
    try {
        result = JSON.parse(textResult);
    } catch (e) {
        console.error("Google Script Error (Bukan JSON):", textResult);
        return new Response(JSON.stringify({ message: "Respon Database Error" }), { status: 500 });
    }

    if (result.data && result.data.authenticated) {
      return new Response(JSON.stringify(result.data), { status: 200 });
    } else {
      return new Response(JSON.stringify({ message: "Username atau Password Salah" }), { status: 401 });
    }
  } catch (error) {
    console.error("Server Fetch Error:", error);
    return new Response(JSON.stringify({ message: "Gagal menghubungi Database" }), { status: 500 });
  }
};