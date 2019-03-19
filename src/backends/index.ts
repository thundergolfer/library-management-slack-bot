import { Book } from '../book';

export interface IBackend {
    addBook(book: Book): boolean
    searchByTitle(title: string): Book[]
    borrowBook(book: Book, borrower: string): boolean
}