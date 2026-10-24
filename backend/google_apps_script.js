/**
 * Google Apps Script Backend für das Petz-Portal "Fasnet 2027 Salmendingen"
 *
 * Speichert anonyme Geschichten in einem Google Sheet,
 * legt hochgeladene Medien (Fotos, Videos, Audio) in einem Google Drive Ordner ab
 * und sendet eine E-Mail-Benachrichtigung an deine Gmail-Adresse.
 */

// Name des Google Drive Zielordners für Fotos/Medien
var DRIVE_FOLDER_NAME = "Fasnet_2027_Petzportal_Medien";

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Fasnet 2027 Petz-Portal Backend ist einsatzbereit! 🎭"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    }

    var title = data.title || "Ohne Titel";
    var story = data.story || "";
    var fileName = data.fileName || "";
    var fileType = data.fileType || "application/octet-stream";
    var fileData = data.fileData || ""; // Base64
    var timestamp = new Date();

    if (!story) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Keine Geschichte übermittelt."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Google Drive Ordner finden oder anlegen
    var folder;
    var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
    }

    // 2. Mediendatei speichern (falls vorhanden)
    var fileUrl = "Kein Anhang";
    if (fileData && fileData.length > 0) {
      var decodedBytes = Utilities.base64Decode(fileData);
      var safeName = Utilities.formatDate(timestamp, "Europe/Berlin", "yyyyMMdd_HHmmss") + "_" + (fileName || "upload");
      var blob = Utilities.newBlob(decodedBytes, fileType, safeName);
      var uploadedFile = folder.createFile(blob);
      uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = uploadedFile.getUrl();
    }

    // 3. In aktives Google Sheet schreiben
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      // Kopfzeile anlegen, falls neu
      sheet.appendRow(["Zeitstempel", "Titel / Stichwort", "Geschichte", "Dateianhang (Drive Link)", "Dateityp", "Originaler Dateiname"]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0e387a").setFontColor("#ffffff");
    }

    sheet.appendRow([
      Utilities.formatDate(timestamp, "Europe/Berlin", "dd.MM.yyyy HH:mm:ss"),
      title,
      story,
      fileUrl,
      fileType,
      fileName
    ]);

    // 4. E-Mail-Benachrichtigung an Gmail senden
    try {
      var userEmail = Session.getEffectiveUser().getEmail();
      if (userEmail) {
        var emailSubject = "🎭 Neues Petzen eingegangen: " + title;
        var emailBody = "Servus!\n\n" +
          "Es wurde soeben eine neue Geschichte für die Fasnet 2027 eingereicht:\n\n" +
          "Titel: " + title + "\n" +
          "Datum: " + Utilities.formatDate(timestamp, "Europe/Berlin", "dd.MM.yyyy HH:mm:ss") + "\n\n" +
          "Geschichte:\n" + story + "\n\n" +
          "Medien-Anhang:\n" + fileUrl + "\n\n" +
          "Direkt zum Google Sheet:\n" + SpreadsheetApp.getActiveSpreadsheet().getUrl() + "\n\n" +
          "Narri - Narro!";

        MailApp.sendEmail(userEmail, emailSubject, emailBody);
      }
    } catch (mailErr) {
      Logger.log("E-Mail-Versand fehlgeschlagen (optional): " + mailErr);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Geschichte erfolgreich im Narrenkasten gespeichert!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
