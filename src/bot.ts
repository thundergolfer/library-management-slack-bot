import { Book } from './book';

export enum UserIntent {
    AddNewBook,
    Borrow,
    Return,
    Search,
    ListBooks,
    Unknown
}

export type UserRequest =
    { intent: UserIntent.AddNewBook, book: Book, valid: true }
    | { intent: UserIntent.Borrow, book: Book, userId: string, valid: true }
    | { intent: UserIntent.Return, book: Book, valid: true }
    | { intent: UserIntent.Search, searchString: string, valid: true }
    | { intent: UserIntent.ListBooks, valid: true }
    | { intent: UserIntent.Unknown, valid: true }
    | { valid: false, errorMsg: string, intent: UserIntent }

const HELP_MSG = `Usage:
    add <ISBN>
    borrow <ISBN>
    return <ISBN>
`;

export function parseMessage(text: string, user: string): UserRequest {
    const tokens = text.split(" ");
    const command = tokens[0];

    switch (command) {
        case "add": return parseAdd(tokens.slice(1,));
        case "borrow": return parseBorrow(user, tokens.slice(1,));
        case "return": return parseReturn(user, tokens.slice(1,));
        case "list": return { intent: UserIntent.ListBooks, valid: true };
        default: return { valid: false, errorMsg: HELP_MSG, intent: UserIntent.Unknown }
    }
}

function parseAdd(tokens: string[]): UserRequest {
    const intent = UserIntent.AddNewBook;
    const usageMsg = "Usage: add <ISBN>";
    if (tokens.length != 1) {
        return { valid: false, errorMsg: usageMsg, intent }
    }

    const isbn = parseISBN(tokens[0]);
    if (isbn === null) {
        return { valid: false, errorMsg: `ISBN '${tokens[0]}' is invalid!`, intent };
    }
    return { intent, book: new Book(isbn), valid: true };
}

function parseBorrow(user: string, tokens: string[]): UserRequest {
    const intent = UserIntent.Borrow;
    const usageMsg = "Usage: borrow <ISBN>";
    if (tokens.length != 1) {
        return { valid: false, errorMsg: usageMsg, intent };
    }

    const isbn = parseISBN(tokens[0]);
    if (isbn === null) {
        return { valid: false, errorMsg: `ISBN '${tokens[0]}' is invalid!`, intent };
    }
    return { intent, book: new Book(isbn), userId: user, valid: true };
}

function parseReturn(user: string, tokens: string[]): UserRequest {
    const intent = UserIntent.Return;
    const usageMsg = "Usage: borrow <ISBN>";
    if (tokens.length != 1) {
        return { valid: false, errorMsg: usageMsg, intent };
    }

    const isbn = parseISBN(tokens[0]);
    if (isbn === null) {
        return { valid: false, errorMsg: `ISBN '${tokens[0]}' is invalid!`, intent };
    }
    return { intent: UserIntent.Return, book: new Book(isbn), userId: user, valid: true };
}

/**
 * https://en.wikipedia.org/wiki/International_Standard_Book_Number
 *
 * > An ISBN is assigned to each edition and variation (except reprintings) of a book.
 *   The ISBN is 13 digits long if assigned on or after 1 January 2007,
 *   and 10 digits long if assigned before 2007.
 */
function parseISBN(s: string): string | null {
    const cleaned = s.replace(/-/g, "");
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