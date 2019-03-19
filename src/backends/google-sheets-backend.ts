import { IBackend } from './index'
import { Book } from '../book';

// const GoogleSpreadsheet: any = require('google-spreadsheet');
import GoogleSpreadsheet from 'google-spreadsheet';
// @ts-ignore
import creds from '../../client_secret.json';

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

export class GoogleSheetsBackend implements IBackend {
    constructor(private _doc: GoogleSpreadsheet) {}

    addBook(book: Book): boolean {
        return false;
    }

    borrowBook(book: Book, borrower: string): boolean {
        return false;
    }

    searchByTitle(title: string): Book[] {
        return [];
    }

}