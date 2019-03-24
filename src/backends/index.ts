import { Book } from '../book';

export interface IBackend {
    addBook(book: Book): Promise<Book>
    borrowBook(isbn: string, borrower: string): Promise<IBorrowResult>
    returnBook(isbn: string, borrower: string): Promise<IReturnResult>
    listBooks(): Promise<Book[]>
    searchByTitle(title: string): Promise<Book[]>
}

export interface IBorrowResult {
    success: boolean
    message: string
}

export interface IReturnResult {
    success: boolean
    message: string
}