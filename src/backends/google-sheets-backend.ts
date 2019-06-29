import {IBackend, IBorrowResult, IReturnResult} from './index';
import {Book} from '../book';
import {getEditDistance} from "../search";
import {promisify} from 'util'

import GoogleSpreadsheet, {GetRows, SpreadsheetRow} from 'google-spreadsheet';
import CREDS from '../../client_secret.json';

const DEFAULT_SPREADSHEET_ID = process.env.IS_LOCAL ? "1Vbvys2uiSyJWPKsFWjMyHeZ-1mTWDTZCyeFfYCkemuQ" : "1qzxwmhX7cLuRKUN8BH6FuvF85n6gosfAU2D6K3qh2yA";
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || DEFAULT_SPREADSHEET_ID;

interface BookSpreadsheetRow {
    isbn: string,
    booktitle: string,
    numcopies: number,
    borrowers: string,
}

export class GoogleSheetsBackend implements IBackend {
    constructor(
        private readonly doc: GoogleSpreadsheet,
        private readonly addRow: (worksheet_id: number, new_row: any) => Promise<SpreadsheetRow>,
        private readonly getRows: (sheetIndex: number, opts: GetRows) => Promise<SpreadsheetRow[]>,
        private readonly dbWorksheetIndex = 1,
    ) {
    }

    static async create(): Promise<GoogleSheetsBackend> {
        // Create a document object using the ID of the spreadsheet - obtained from its URL.
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
        await promisify(doc.useServiceAccountAuth)(CREDS);

        return new GoogleSheetsBackend(
            doc,
            promisify(doc.addRow),
            promisify((index: number, opts: GetRows, c: (err: Error, rows: SpreadsheetRow[]) => void) => doc.getRows(index, opts, c))
        );
    }

    async getBook(isbn: string): Promise<Book | undefined> {
        const rows = await this.getRows(this.dbWorksheetIndex, {query: `isbn==${isbn}`});
        return rows.length > 0 ? this.spreadsheetRowToBook(rows[0]) : undefined;
    }

    async addBook(book: Book): Promise<Book> {
        const row = await this.addRow(this.dbWorksheetIndex, this.bookToSpreadsheetRow(book));
        // TODO(Jonathon): Validate that the book has not already been added
        return this.spreadsheetRowToBook(row);
    }

    async listBooks(): Promise<Book[]> {
        const rows = await this.getRows(this.dbWorksheetIndex, {});
        return rows.map(r => this.spreadsheetRowToBook(r));
    }

    async borrowBook(isbn: string, borrower: string): Promise<IBorrowResult> {
        const rows = await this.getRows(this.dbWorksheetIndex, {query: `isbn==${isbn}`});

        if (rows.length == 0) {
            return {
                success: false,
                message: "Book not found in database. Trying adding book first."
            };
        }

        // TODO(Jonathon): Validate that the user has not already borrowed this book
        let row = rows[0] as unknown as BookSpreadsheetRow & SpreadsheetRow;
        let borrowers = row.borrowers === "" ? [] : row.borrowers.split(',');
        row.borrowers = borrowers.concat([borrower]).join(",");

        await promisify(row.save)();

        return {success: true, message: "Borrowed!"};
    }

    async returnBook(isbn: string, borrower: string): Promise<IReturnResult> {
        const rows = await this.getRows(this.dbWorksheetIndex, {query: `isbn==${isbn}`});

        if (rows.length == 0) {
            return {
                success: false,
                message: "Book not found in database. Trying adding book first."
            };
        }

        let row = rows[0] as unknown as BookSpreadsheetRow & SpreadsheetRow;
        let borrowers = row.borrowers === "" ? [] : row.borrowers.split(',');
        const borrowerIndex = borrowers.indexOf(borrower);
        if (borrowerIndex < 0) {
            return {success: false, message: `'${borrower}' has not borrowed this book.`};
        }

        borrowers.splice(borrowerIndex, 1);
        row.borrowers = borrowers.join(",");

        await promisify(row.save)();

        return {success: true, message: "Returned!"};
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
            borrowers: b.borrowers.join(','),
        }
    }

    private spreadsheetRowToBook(_row: SpreadsheetRow): Book {
        const row = _row as unknown as BookSpreadsheetRow;
        return new Book(
            row.isbn,
            row.booktitle,
            row.numcopies,
            row.borrowers.split(',')
        )
    }

}