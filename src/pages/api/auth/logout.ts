// src/pages/api/auth/logout.ts
export const prerender = false;
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // Hapus cookie
  cookies.delete("admin_session", { path: "/" });
  
  // Redirect ke login
  return redirect("/login");
};