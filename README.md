# Effectra

Projektmanagement für kleine Teams: Aufgaben, Board, Projekte, Unteraufgaben, Kommentare und Fortschritt, live synchron zwischen iPhone und PC.

## Download

Die neueste Version gibt es unter **[Releases](../../releases/latest)**:

- **Windows:** `Effectra-Setup-x.y.z.exe` herunterladen und starten.
  Bei einer Warnung auf *Weitere Informationen → Trotzdem ausführen* klicken.
- **Mac:** `Effectra-x.y.z.dmg` öffnen und Effectra in *Programme* ziehen.
  Beim ersten Start mit Rechtsklick auf die App → *Öffnen*.
- **iPhone:** Die Web-App in Safari öffnen → *Teilen* → *Zum Home-Bildschirm*.

## Aufbau

| Ordner | Inhalt |
|---|---|
| `effectra/` | Web-App (HTML, CSS, JavaScript), kein Build nötig |
| `desktop/` | Desktop-App für Windows und Mac (Electron) |
| `.github/workflows/` | Baut die Desktop-Apps automatisch bei jedem neuen Versions-Tag |
