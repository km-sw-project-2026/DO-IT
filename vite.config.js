import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  // appType: "spa", // ✅ 이거 추가 (라우터 직접접속 404 해결)
  plugins: [react(), cloudflare()]
});
