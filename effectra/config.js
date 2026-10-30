// Effectra – Verbindung zu deinem Supabase-Projekt
// Werte findest du in Supabase unter: Project Settings → API (oder "API Keys").
// Der anon/publishable Key darf öffentlich sein: Die Sicherheitsregeln in der
// Datenbank (supabase/schema.sql) schützen eure Daten.
// NIEMALS den "service_role"- oder "secret"-Key hier eintragen!
window.EFFECTRA_CONFIG = {
  supabaseUrl: "https://pbvrgvokfsribeiecibf.supabase.co",
  supabaseAnonKey: "sb_publishable_NHpVeo3X9MJfbDRFxHfEQg_jf2ercOU",
  // Verbindungen (öffentliche Kennungen, keine Geheimnisse). Leer = noch nicht eingerichtet.
  spotifyClientId: "2f613639d2b0423f9bb9321ce8c00a7e",
  googleClientId: ""
};
