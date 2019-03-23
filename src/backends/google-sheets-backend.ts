import {IBackend, IBorrowResult, IReturnResult} from './index';
import { Book } from '../book';

// const GoogleSpreadsheet: any = require('google-spreadsheet');
import GoogleSpreadsheet, {GoogleSpreadsheetOptions, SpreadsheetRow} from 'google-spreadsheet';
import {SpreadElement} from "@babel/types";
// @ts-ignore
// import creds from '../../client_secret.json';

const spreadsheetID = process.env.GOOGLE_SHEETS_ID || "1qzxwmhX7cLuRKUN8BH6FuvF85n6gosfAU2D6K3qh2yA";
//
// // Create a document object using the ID of the spreadsheet - obtained from its URL.
// const doc = new GoogleSpreadsheet(spreadsheetID);

// Authenticate with the Google Spreadsheets API.
// doc.useServiceAccountAuth(creds, function (err: any) {
//
//     // Get all of the rows from the spreadsheet.
//     doc.getRows(1, function (err: any, rows: any) {
//         console.log(rows);
//     });
// });

interface BookSpreadsheetRow {
    isbn: number,
    booktitle: string,
    numcopies: number,
    borrowers: string
}

export class GoogleSheetsBackend implements IBackend {
    private _dbWorksheetIndex = 1;

    constructor(private _doc: GoogleSpreadsheet) {}

    addBook(book: Book): Promise<Book> {
        return new Promise<Book>((resolve, reject) => {
            this._doc.addRow(
                this._dbWorksheetIndex,
                this.bookToSpreadsheetRow(book),
                (err: Error, row: SpreadsheetRow) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.spreadsheetRowToBook(<BookSpreadsheetRow><unknown>row));
                    }
                }
            )
        });
    }

    listBooks(): Promise<Book[]> {
        const requestOpts = {};
        return new Promise<Book[]>((resolve, reject) => {
            this._doc.getRows(
                this._dbWorksheetIndex,
                requestOpts,
                (err: Error, rows: SpreadsheetRow[]) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(rows.map((r) =>
                            this.spreadsheetRowToBook(<BookSpreadsheetRow><unknown>r))
                        );
                    }
                }
            )
        });
    }

    async borrowBook(isbn: number, borrower: string): Promise<IBorrowResult> {
        const requestOpts = {
            query: `isbn==${isbn}`
        };
        return new Promise<IBorrowResult>((resolve, reject) => {
            this._doc.getRows(
                this._dbWorksheetIndex,
                requestOpts,
                (err: Error, rows: SpreadsheetRow[]) => {
                    if (err) {
                        return reject(err);
                    } else if (rows === undefined || rows.length == 0) {
                        return resolve({
                            success: false,
                            message: "Book not found in database. Trying adding book first."
                        })
                    }

                    let row = <BookSpreadsheetRow & SpreadsheetRow><unknown>rows[0];
                    let borrowers = row.borrowers === "" ? [] : row.borrowers.split(',');
                    row.borrowers = borrowers.concat([borrower]).join(",");

                    row.save((err) => {
                        if (err) {
                            resolve({ success: false, message: err.message });
                        } else {
                            resolve({ success: true, message: "Borrowed!" });
                        }
                    });
                }
            )
        });
    }

    async returnBook(isbn: number, borrower: string): Promise<IReturnResult> {
        const requestOpts = {
            query: `isbn==${isbn}`
        };
        return new Promise<IBorrowResult>((resolve, reject) => {
            this._doc.getRows(
                this._dbWorksheetIndex,
                requestOpts,
                (err: Error, rows: SpreadsheetRow[]) => {
                    if (err) {
                        return reject(err);
                    } else if (rows === undefined || rows.length == 0) {
                        return resolve({
                            success: false,
                            message: "Book not found in database. Trying adding book first."
                        })
                    }

                    let row = <BookSpreadsheetRow & SpreadsheetRow><unknown>rows[0];
                    let borrowers = row.borrowers === "" ? [] : row.borrowers.split(',');
                    const borrowerIndex = borrowers.indexOf(borrower);
                    if (borrowerIndex < 0) {
                        resolve({ success: false, message: `'${borrower}' has not borrowed this book.` });
                        return;
                    }

                    borrowers.splice(borrowerIndex, 1);
                    row.borrowers = borrowers.join(",");

                    row.save((err) => {
                        if (err) {
                            resolve({ success: false, message: err.message });
                        } else {
                            resolve({ success: true, message: "Returned!" });
                        }
                    });
                }
            )
        });
    }

    searchByTitle(title: string): Book[] {
        return [];
    }

    private bookToSpreadsheetRow(b: Book): BookSpreadsheetRow {
        return {
            isbn: b.ISBN,
            booktitle: b.title,
            numcopies: b.numCopies,
            borrowers: b.borrowers.join(',')
        }
    }

    private spreadsheetRowToBook(row: BookSpreadsheetRow): Book {
        return new Book(
            row.isbn,
            row.booktitle,
            row.numcopies,
            row.borrowers.split(',')
        )
    }

}