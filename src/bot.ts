import { Book } from './book';

export enum UserIntent {
    AddNewBook,
    Borrow,
    Return,
    Search,
    ListBooks,
    Unknown
}

export interface UserRequest {
    intent: UserIntent
    searchString?: string
    book?: Book
    userId?: string
}

type Error = string | null;

const HELP_MSG = `Usage:
    add <ISBN>
    borrow <ISBN>
    return <ISBN>
`;

export function parseMessage(text: string, user: string): [Error, UserRequest] {
    const tokens = text.split(" ");
    const command = tokens[0];

    switch (command) {
        case "add": return parseAdd(tokens.slice(1,));
        case "borrow": return parseBorrow(user, tokens.slice(1,));
        case "return": return parseReturn(user, tokens.slice(1,));
        case "list": return [null, { intent: UserIntent.ListBooks }];
        default: return [HELP_MSG, { intent: UserIntent.Unknown }]
    }

    return [
        null,
        { intent: UserIntent.AddNewBook }
    ];
}

function parseAdd(tokens: string[]): [Error, UserRequest] {
    const usageMsg = "Usage: add <ISBN>";
    if (tokens.length != 1) {
        return [usageMsg, { intent: UserIntent.Unknown }];
    }

    const isbn = parseISBN(tokens[0]);
    if (isbn === null) {
        return [`ISBN '${tokens[0]}' is invalid!`, { intent: UserIntent.AddNewBook }];
    }
    return [null, { intent: UserIntent.AddNewBook, book: new Book(isbn) }];
}

function parseBorrow(user: string, tokens: string[]): [Error, UserRequest] {
    const usageMsg = "Usage: borrow <ISBN>";
    if (tokens.length != 1) {
        return [usageMsg, { intent: UserIntent.Borrow }];
    }

    const isbn = parseISBN(tokens[0]);
    if (isbn === null) {
        return [`ISBN '${tokens[0]}' is invalid!`, { intent: UserIntent.Borrow }];
    }
    return [null, { intent: UserIntent.Borrow, book: new Book(isbn), userId: user }];
}

function parseReturn(user: string, tokens: string[]): [Error, UserRequest] {
    const usageMsg = "Usage: borrow <ISBN>";
    if (tokens.length != 1) {
        return [usageMsg, { intent: UserIntent.Return }];
    }

    const isbn = parseISBN(tokens[0]);
    if (isbn === null) {
        return [`ISBN '${tokens[0]}' is invalid!`, { intent: UserIntent.Return }];
    }
    return [null, { intent: UserIntent.Return, book: new Book(isbn), userId: user }];
}

/**
 * https://en.wikipedia.org/wiki/International_Standard_Book_Number
 *
 * > An ISBN is assigned to each edition and variation (except reprintings) of a book.
 *   The ISBN is 13 digits long if assigned on or after 1 January 2007,
 *   and 10 digits long if assigned before 2007.
 */
function parseISBN(s: string): string | null {
    const cleaned = s.replace(/-/g, "")
    if (cleaned.length !== 10 && cleaned.length !== 13) {
        return null;
    }
    return cleaned;
}

function presentBook(book: Book): string {
    return `_${book.title}_ - \`${book.ISBN}\``;
}

export function presentBookList(books: Book[]): string {
    if (books.length == 0) {
        return "";
    } else if (books.length == 1) {
        return presentBook(books[0]);
    }

    const presentedBooks: string[] = books.map((book: Book) => presentBook(book));
    const listedBooks: string[] = presentedBooks.map((pb: string) => `• ${pb}`);
    return listedBooks.join('\n');
}