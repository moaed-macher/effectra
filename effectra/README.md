# Effectra

Projektmanagement für kleine Teams: Aufgaben, Board, Projekte mit Deadlines, Unteraufgaben, Kommentare, Aktivitätsverlauf und Fortschritt. Alles synchronisiert sich live zwischen iPhone und PC.

Technik: eine statische Web-App (HTML, CSS, JavaScript) und eine kostenlose Supabase-Datenbank. Es gibt keinen eigenen Server und keinen Build-Schritt.

---

## In 15 Minuten online

### 1. Supabase-Projekt anlegen (kostenlos)
1. Auf <https://supabase.com> registrieren und **New project** wählen.
2. Region **Frankfurt (eu-central-1)** auswählen, die ist gut für den Datenschutz.
3. Ein starkes Datenbank-Passwort vergeben und sicher aufbewahren. Die App braucht es nicht.

### 2. Datenbank einrichten
1. In Supabase links **SQL Editor** öffnen und dann **New query** wählen.
2. Den kompletten Inhalt von `supabase/schema.sql` einfügen und **Run** klicken.
3. Am Ende sollte „Success“ erscheinen. Das Skript läuft nur **einmal** auf einem neuen Projekt.

### 3. Anmeldung einstellen
Unter **Authentication → Sign In / Providers → Email**:
- **Confirm email** eingeschaltet lassen.
- **Minimum password length** auf **8** setzen.

Unter **Authentication → URL Configuration** (erst nach Schritt 5, wenn du die Adresse kennst):
- **Site URL**: die Adresse deiner App, z. B. `https://effectra-studio.netlify.app`
- **Redirect URLs**: dieselbe Adresse noch einmal eintragen.

> Hinweis: Supabase verschickt im Gratis-Tarif nur wenige E-Mails pro Stunde. Für zwei Personen reicht das. Für mehr Nutzer richtest du unter **Authentication → Emails → SMTP Settings** einen eigenen Mailversand ein.

### 4. App mit der Datenbank verbinden
In Supabase **Project Settings → API** (bzw. **API Keys**) öffnen und diese zwei Werte in `config.js` eintragen:

```js
window.EFFECTRA_CONFIG = {
  supabaseUrl: "https://abcdefgh.supabase.co",
  supabaseAnonKey: "eyJ...  oder  sb_publishable_..."
};
```

Der **anon/publishable** Key darf öffentlich sein, die Regeln in der Datenbank schützen eure Daten.
**Trage niemals den `service_role`- bzw. `secret`-Key ein!** Mit dem kann man alle Regeln umgehen.

### 5. Online stellen (kostenlos)
**Am einfachsten: Netlify Drop**
1. <https://app.netlify.com/drop> öffnen und ein kostenloses Konto anlegen.
2. Den ganzen Ordner `effectra` auf die Seite ziehen. Fertig, du bekommst eine Adresse wie `https://irgendwas.netlify.app`.
3. Unter **Site configuration → Change site name** kannst du einen schöneren Namen wählen.
4. Danach Schritt 3 (URL Configuration) mit dieser Adresse erledigen.

Die Datei `_headers` setzt bei Netlify automatisch die Sicherheits-Header.

**Alternative: Vercel.** Den Ordner in ein GitHub-Repo legen und bei <https://vercel.com> importieren. `vercel.json` setzt dort dieselben Header.

### 6. Auf dem Handy installieren
- **iPhone:** Adresse in **Safari** öffnen, dann **Teilen → Zum Home-Bildschirm**.
- **Android:** In Chrome das Menü öffnen und **App installieren** wählen.
- **PC:** In Chrome oder Edge erscheint in der Adressleiste ein Installieren-Symbol.

### 7. Loslegen
1. Du erstellst ein Konto, bestätigst die E-Mail und gründest ein Team.
2. Im Tab **Team** steht euer Einladungscode. Den schickst du deinem Kollegen.
3. Er erstellt ein Konto, wählt **Team beitreten** und gibt den Code ein.

---

## Funktionen
- **Heute**: Was ist überfällig, heute fällig oder in Arbeit, und was kommt als Nächstes, jeweils für dich oder das ganze Team. Dazu ein Fortschrittsring und die erledigten Aufgaben der letzten 7 Tage.
- **Board**: Offen, In Arbeit und Erledigt, mit Suche und Filtern nach Person und Projekt. Ein Tipp auf den Kreis schaltet den Status weiter.
- **Projekte**: Farbe, Deadline (rot, wenn sie überschritten ist) und ein Fortschrittsbalken.
- **Aufgaben**: Notizen, zuständige Person, Fälligkeit, Priorität, Unteraufgaben zum Abhaken und Kommentare.
- **Team**: Einladungscode, Fortschritt pro Person, Aktivitätsverlauf. Der Besitzer kann Mitglieder entfernen und den Code erneuern.
- **Echtzeit**: Änderungen erscheinen sofort beim anderen. Fällt die Verbindung weg, zeigt die App einen Hinweis und lädt später automatisch nach.
- Helles und dunkles Design je nach Systemeinstellung, iOS-Optik, als App installierbar.

---

## Sicherheit – was eingebaut ist
**Datenbank** (`supabase/schema.sql`, mit 57 automatischen Angriffstests geprüft):
- **Row Level Security** auf allen Tabellen: Nur Mitglieder eines Teams sehen oder ändern dessen Daten.
- Man wird **nur per Einladungscode** Mitglied. Der Code hat 10 zufällige Zeichen (ca. 10¹⁵ Möglichkeiten) und lässt sich jederzeit erneuern. Ein alter Code ist dann sofort ungültig.
- **Nicht fälschbare Felder**: Ersteller, Kommentar-Autor, Erledigt-Zeitpunkt und Aktivitätsverlauf setzt der Server, nicht der Browser.
- Aufgaben, Unteraufgaben und Kommentare können **nicht in fremde Teams verschoben oder angehängt** werden.
- Zuständig kann nur sein, wer im Team ist. Wer das Team verlässt, verliert seine Zuständigkeiten.
- Längenlimits für alle Texte, höchstens 25 Personen pro Team und 5 eigene Teams pro Person.
- Nicht angemeldete Besucher haben **keinerlei** Zugriff.

**App:**
- Alle Nutzereingaben werden vor der Anzeige maskiert, das schützt vor XSS.
- Eine strenge **Content Security Policy** erlaubt nur Skripte von der eigenen Seite und eine fest versionierte Supabase-Bibliothek. Verbindungen sind nur zu Supabase möglich.
- Sicherheits-Header: kein Einbetten in fremde Seiten (Clickjacking-Schutz), HSTS, nosniff.
- Passwörter haben mindestens 8 Zeichen, Anmeldungen laufen über Supabase Auth mit E-Mail-Bestätigung.

**Was du selbst beachten solltest:**
- Den `service_role`/`secret`-Key niemals in die App oder in ein öffentliches Repo legen.
- Den Einladungscode nur privat teilen und erneuern, wenn jemand das Team verlässt.
- Optional für noch mehr Sicherheit: Lade die Datei `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.1/dist/umd/supabase.js` herunter, lege sie als `vendor/supabase.js` in den Ordner und ändere in `index.html` die Skript-Adresse auf `vendor/supabase.js`. Dann hängt die App von keinem fremden Server mehr ab.
- Im Gratis-Tarif pausiert Supabase ein Projekt nach 7 Tagen ohne Nutzung. Es lässt sich im Dashboard mit einem Klick wieder starten. Wer die App regelmäßig nutzt, merkt davon nichts.

---

## Dateien
| Datei | Zweck |
|---|---|
| `index.html` | Grundgerüst der App |
| `styles.css` | Design (hell und dunkel) |
| `app.js` | Logik: Anmeldung, Daten, Echtzeit, Ansichten |
| `config.js` | **Hier trägst du deine Supabase-Werte ein** |
| `manifest.webmanifest`, `icons/` | Installierbar als App |
| `_headers`, `vercel.json` | Sicherheits-Header für Netlify und Vercel |
| `supabase/schema.sql` | Datenbank und Sicherheitsregeln |
