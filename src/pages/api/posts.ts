// src/pages/api/posts.ts
export const prerender = false; // Mode Server

import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Ambil Data yang dikirim oleh PostEditor.jsx
    const body = await request.json(); 

    // DEBUG: Cek di terminal VS Code
    console.log("🚀 Meneruskan Data ke Google:", JSON.stringify(body));

    const SCRIPT_URL = import.meta.env.PUBLIC_GOOGLE_SCRIPT_URL;

    if (!SCRIPT_URL) {
      return new Response(
        JSON.stringify({ status: "error", message: "URL Script belum di-set di .env" }), 
        { status: 500 }
      );
    }

    // 2. Kirim ulang data tersebut ke Google Apps Script
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      redirect: "follow" 
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (error: any) { // Fix: Mengizinkan tipe 'any' untuk error catch
    console.error("❌ Error di API Proxy:", error);
    
    // Safety check pesan error
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server";
    
    return new Response(
      JSON.stringify({ status: "error", message: message }), 
      { status: 500 }
    );
  }
};