import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Port fixé sur 8080 (au lieu du 5173 par défaut) : c'est le port
  // effectivement utilisé sur ce poste (Laragon). strictPort empêche Vite
  // de basculer discrètement sur un autre port si 8080 est déjà occupé —
  // on préfère un message d'erreur clair plutôt qu'un changement de port
  // silencieux qui redéclenche le même souci de CORS.
  server: {
    port: 8080,
    strictPort: true,
  },
});
