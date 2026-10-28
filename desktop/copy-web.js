// Kopiert die Web-App (../effectra) nach ./web, ohne Hosting-Dateien.
const fs = require("fs");
const path = require("path");
const src = path.join(__dirname, "..", "effectra");
const dst = path.join(__dirname, "web");
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true, filter: (p) => !/[\/](supabase|_headers|vercel\.json|README\.md)$/.test(p) });
