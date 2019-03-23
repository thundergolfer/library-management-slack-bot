import { Book } from './book';

enum UserIntent {
    AddNewBook,
    Borrow,
    Return,
    Search
}

export interface UserRequest {
    intent: UserIntent
    searchString?: string
    book?: Book
}

export function parseMessageText(text: string): UserRequest {
    return {
        intent: UserIntent.AddNewBook
    };
}