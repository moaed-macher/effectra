# Effectra

Projektmanagement für kleine Teams: Aufgaben, Board, Projekte, Unteraufgaben, Kommentare und Fortschritt, live synchron zwischen iPhone und PC.

## Download

Die neueste Version gibt es unter **[Releases](../../releases/latest)**:

- **Windows:** `Effectra-Setup-x.y.z.exe` einmal herunterladen und starten.
  Bei einer Warnung auf *Weitere Informationen → Trotzdem ausführen* klicken.
  Danach nie wieder: Neue Versionen erscheinen direkt in der App (oben „Update“ → ein Klick).
- **iPhone:** Die Web-App in Safari öffnen → *Teilen* → *Zum Home-Bildschirm*.

## Funktionen

- Updates direkt in der App (Web, iPhone und Windows) mit „Was ist neu“
- Seitenleiste wie bei Mac-Apps, volle Breite, randloses Windows-Fenster
- Papierkorb (30 Tage), Mitteilungen mit Glocke, Rechtsklick-Menü, Wischgesten am iPhone
- Heute-Übersicht mit Kennzahlen, Serie, Wochenvergleich, Auslastung und Deadlines
- Board mit Ziehen & Ablegen, Kalender mit Monatsansicht
- Schnell-Eingabe: „Kunde anrufen morgen #Projekt @Person !“
- Schnellsuche mit Strg+K und Tastenkürzel
- Tagesziel mit „Als Nächstes“, Berichte (Durchsatz, Pünktlichkeit, Durchlaufzeit, Team)
- Zeiterfassung mit Timer und Nachtragen, Export als CSV
- Listenansicht mit Sortierung, Mehrfachauswahl und Sammelaktionen, Filter nach Termin und Priorität
- Wiederkehrende Aufgaben („jeden mo“), Rückgängig, Duplizieren
- KI-Assistent (Google Gemini): Unteraufgaben vorschlagen, Freitext in Aufgabe umwandeln, Tag planen, Projekt- und Wochenzusammenfassung
- Fokus-Timer, Benachrichtigungen, hell/dunkel
- Anmeldung per E-Mail und Passwort
- Cloud-Sicherung in Supabase: täglich (30 Tage) und wöchentlich (ein halbes Jahr), Export als JSON und CSV

## Aufbau

| Ordner | Inhalt |
|---|---|
| `effectra/` | Web-App (HTML, CSS, JavaScript), kein Build nötig |
| `desktop/` | Windows-Fenster (Electron): lädt die Web-App live, aktualisiert sich selbst |
| `.github/workflows/` | Baut die Desktop-Apps automatisch bei jedem neuen Versions-Tag |
