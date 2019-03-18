const GoogleSpreadsheet = require('google-spreadsheet');
const creds = require('../../client_secret.json');

const spreadsheetID = process.env.GOOGLE_SHEETS_ID || "1NYhJgdp4IdpjM-ekrm2xqGavxpc2olnWGB11MCTsxz4"

// Create a document object using the ID of the spreadsheet - obtained from its URL.
const doc = new GoogleSpreadsheet(spreadsheetID);

// Authenticate with the Google Spreadsheets API.
doc.useServiceAccountAuth(creds, function (err: any) {

    // Get all of the rows from the spreadsheet.
    doc.getRows(1, function (err: any, rows: any) {
        console.log(rows);
    });
});