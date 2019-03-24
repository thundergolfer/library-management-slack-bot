import {IBackend, IBorrowResult, IReturnResult} from './index';
import { Book } from '../book';
import { getEditDistance } from "../search";

import GoogleSpreadsheet, {SpreadsheetRow} from 'google-spreadsheet';
import CREDS from '../../client_secret.json';

const DEFAULT_SPREADSHEET_ID = process.env.IS_LOCAL ? "1Vbvys2uiSyJWPKsFWjMyHeZ-1mTWDTZCyeFfYCkemuQ" : "1qzxwmhX7cLuRKUN8BH6FuvF85n6gosfAU2D6K3qh2yA";
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || DEFAULT_SPREADSHEET_ID;

interface BookSpreadsheetRow {
    isbn: string,
    booktitle: string,
    numcopies: number,
    borrowers: string
}

export class GoogleSheetsBackend implements IBackend {
    private _dbWorksheetIndex = 1;

    constructor(private _doc: GoogleSpreadsheet) {}

    static create(): Promise<GoogleSheetsBackend> {
        // Create a document object using the ID of the spreadsheet - obtained from its URL.
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

        return new Promise<GoogleSheetsBackend>((resolve, reject) => {
            // Authenticate with the Google Spreadsheets API.
            doc.useServiceAccountAuth(CREDS, function (err: Error) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                const gsBackend = new GoogleSheetsBackend(doc);
                resolve(gsBackend);
            });
        });
    }

    addBook(book: Book): Promise<Book> {
        return new Promise<Book>((resolve, reject) => {
            // TODO(Jonathon): Validate that the book has not already been added
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

    async borrowBook(isbn: string, borrower: string): Promise<IBorrowResult> {
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

                    // TODO(Jonathon): Validate that the user has not already borrowed this book
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

    async returnBook(isbn: string, borrower: string): Promise<IReturnResult> {
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

    async searchByTitle(title: string): Promise<Book[]> {
        const maxEditDistanceToInclude = 3;
        const allBooks: Book[] = await this.listBooks();
        let titleEditDistances: Map<number, Book[]> = new Map<number, Book[]>();
        let matches: Book[] = [];
        for (let book of allBooks) {
            let editDistance = getEditDistance(title, book.title || "");
            if (editDistance <= maxEditDistanceToInclude) {
                let curr = titleEditDistances.get(editDistance);
                if (curr !== undefined) {
                    curr.push(book);
                } else {
                    titleEditDistances.set(editDistance, [book]);
                }
            }
        }
        for (let i = 0; i <= maxEditDistanceToInclude; i++) {
            let curr = titleEditDistances.get(i);
            if (curr !== undefined) {
                matches = matches.concat(curr);
            }
        }
        return matches;
    }

    private bookToSpreadsheetRow(b: Book): BookSpreadsheetRow {
        return {
            isbn: b.ISBN,
            booktitle: b.title || "",
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