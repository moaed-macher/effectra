# Effectra

Projektmanagement für kleine Teams: Aufgaben, Board, Projekte, Unteraufgaben, Kommentare und Fortschritt, live synchron zwischen iPhone und PC.

## Download

Die neueste Version gibt es unter **[Releases](../../releases/latest)**:

- **Windows:** `Effectra-Setup-x.y.z.exe` herunterladen und starten.
  Bei einer Warnung auf *Weitere Informationen → Trotzdem ausführen* klicken.
- **iPhone:** Die Web-App in Safari öffnen → *Teilen* → *Zum Home-Bildschirm*.

## Funktionen

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
- Tägliche Cloud-Sicherung in Supabase, Export als JSON und CSV

## Aufbau

| Ordner | Inhalt |
|---|---|
| `effectra/` | Web-App (HTML, CSS, JavaScript), kein Build nötig |
| `desktop/` | Desktop-App für Windows (Electron, aktualisiert sich automatisch) |
| `.github/workflows/` | Baut die Desktop-Apps automatisch bei jedem neuen Versions-Tag |
