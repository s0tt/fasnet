# 📋 Anleitung: Google Apps Script Backend (2 Minuten Setup)

Mit dieser Anleitung richtest du das kostenlose Backend für das **Petz-Portal** ein. Geschichten landen automatisch in einer Google-Tabelle, Fotos/Medien in deinem Google Drive, und du erhältst eine E-Mail per Gmail.

---

## Schritt 1: Neues Google Sheet anlegen
1. Öffne im Browser [Google Sheets](https://sheets.new).
2. Benenne die Tabelle oben links z. B. nach: `Fasnet 2027 Geschichten Salmendingen`.

---

## Schritt 2: Apps Script Editor öffnen
1. Klicke in der Menüleiste der Tabelle auf **Erweiterungen** > **Apps Script**.
2. Lösche den vorhandenen Code im Editor vollständig.
3. Öffne die Datei [`google_apps_script.js`](./google_apps_script.js) aus diesem Repository, kopiere den gesamten Code und füge ihn in den Apps Script Editor ein.
4. Klicke auf das **Speichern-Symbol** (Diskette).

---

## Schritt 3: Als Web-App bereitstellen
1. Klicke oben rechts auf den blauen Button **Bereitstellen** > **Neue Bereitstellung**.
2. Klicke auf das Zahnrad-Symbol neben „Typ auswählen“ und wähle **Web-App**.
3. Nimm folgende Einstellungen vor:
   - **Beschreibung**: `Fasnet 2027 Petzportal`
   - **Ausführen als**: `Ich (deine-gmail-adresse@gmail.com)`
   - **Wer hat Zugriff**: **`Jeder`** *(Wichtig! Nur so kann das anonyme Formular auf GitHub Pages ohne Google-Login Daten absenden)*
4. Klicke auf **Bereitstellen**.
5. Beim ersten Mal erscheint ein Fenster „Zugriff autorisieren“:
   - Wähle dein Google-Konto.
   - Falls die Warnung „Google hat diese App nicht überprüft“ kommt: Klicke auf **Erweitert** und dann unten auf **Zu Unbenanntes Projekt (unsicher) wechseln**.
   - Klicke auf **Zulassen**.

---

## Schritt 4: Web-App-URL in deine Website einfügen
1. Kopiere die generierte **Web-App-URL** (beginnt mit `https://script.google.com/macros/s/.../exec`).
2. Öffne in diesem Projekt die Datei [`js/petzen.js`](../js/petzen.js).
3. Trage deine URL ganz oben in Zeile 13 ein:
   ```javascript
   var GOOGLE_SCRIPT_WEBAPP_URL = "DEINE_KOPIERTE_URL_HIER";
   ```
4. Speichern und auf GitHub pushen. Fertig! 🎉

---

## Was passiert nach dem Absenden?
- **Text & Diktierte Sprache (Speech-to-Text)**: Erscheinen sofort als neue Zeile in deinem Google Sheet (mit Datum, Uhrzeit, Titel und Text).
- **Sprachnachrichten & Sprach-Memos**: Wenn Sprache aufgenommen wird (oder Spracherkennung nicht eindeutig war), wird die Original-Audiodatei direkt in deinen Google Drive Ordner `Fasnet_2027_Petzportal_Medien` gespeichert und in der Tabelle direkt mit Abspiellink verlinkt!
- **Fotos / Videos**: Werden ebenfalls automatisch im Google Drive Ordner abgelegt.
- **Gmail**: Du erhältst sofort eine kurze Info-Mail (z. B. `🎙️ Neue Sprachnachricht: ...` oder `🎭 Neues Petzen eingegangen: ...`), wenn etwas Neues gepetzt wurde!
