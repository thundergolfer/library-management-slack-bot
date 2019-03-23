import { Book } from './book';

export enum UserIntent {
    AddNewBook,
    Borrow,
    Return,
    Search,
    Unknown
}

export interface UserRequest {
    intent: UserIntent
    searchString?: string
    book?: Book
}

type Error = string | null;

const HELP_MSG = `Usage:
    add <ISBN>
    borrow <ISBN>
    return <ISBN>
`;

export function parseMessageText(text: string): [Error, UserRequest] {
    const tokens = text.split(" ");
    const command = tokens[0];

    switch (command) {
        case "add": return parseAdd(tokens.slice(1,));
        case "borrow": return parseBorrow(tokens.slice(1,));
        case "return": return parseReturn(tokens.slice(1,));
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
        return [usageMsg, { intent: UserIntent.AddNewBook }];
    }

    const isbn: number = parseISBN(tokens[0]);
    if (isbn < 0) {
        return [`ISBN '${tokens[0]}' is invalid!`, { intent: UserIntent.AddNewBook }];
    }
    return [null, { intent: UserIntent.AddNewBook, book: new Book(isbn) }];
}

function parseBorrow(tokens: string[]): [Error, UserRequest] {
    const usageMsg = "Usage: borrow <ISBN>";
    if (tokens.length != 1) {
        return [usageMsg, { intent: UserIntent.Borrow }];
    }

    const isbn: number = parseISBN(tokens[0]);
    if (isbn < 0) {
        return [`ISBN '${tokens[0]}' is invalid!`, { intent: UserIntent.Borrow }];
    }
    return [null, { intent: UserIntent.Borrow, book: new Book(isbn) }];
}

function parseReturn(tokens: string[]): [Error, UserRequest] {
    const usageMsg = "Usage: borrow <ISBN>";
    if (tokens.length != 1) {
        return [usageMsg, { intent: UserIntent.Return }];
    }

    const isbn: number = parseISBN(tokens[0]);
    if (isbn < 0) {
        return [`ISBN '${tokens[0]}' is invalid!`, { intent: UserIntent.Return }];
    }
    return [null, { intent: UserIntent.Return, book: new Book(isbn) }];
}

/**
 * https://en.wikipedia.org/wiki/International_Standard_Book_Number
 *
 * > An ISBN is assigned to each edition and variation (except reprintings) of a book.
 *   The ISBN is 13 digits long if assigned on or after 1 January 2007,
 *   and 10 digits long if assigned before 2007.
 */
function parseISBN(s: string): number {
    const cleaned = s.replace(/-/g, "")
    if (cleaned.length !== 10 && cleaned.length !== 13) {
        return -1;
    }
    const isbn = Number(cleaned);
    if (isNaN(isbn)) {
        return -1;
    }
    return isbn;
}