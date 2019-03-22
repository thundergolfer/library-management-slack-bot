import { Book } from '../book';

export interface IBackend {
    addBook(book: Book): Promise<Book>
    borrowBook(book: Book, borrower: string): boolean
    listBooks(): Promise<Book[]>
    searchByTitle(title: string): Book[]

}