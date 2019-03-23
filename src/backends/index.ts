import { Book } from '../book';

export interface IBackend {
    addBook(book: Book): Promise<Book>
    borrowBook(isbn: number, borrower: string): Promise<IBorrowResult>
    listBooks(): Promise<Book[]>
    searchByTitle(title: string): Book[]

}

export interface IBorrowResult {
    success: boolean
    message: string
}