import { Book } from './book';
import {decodeCodeFromUrl} from "./bar_code_reader";
import {IBackend} from "./backends";
import {IsbnResolver} from "./isbn_resolver";
import {SlackMessage} from "./slack_message";

export enum UserIntent {
    Search,
    ListAll,
    ListBorrowed,
    ISBN,
    Intro
}

export type UserRequest =
    | { intent: UserIntent.ISBN, isbn: string, valid: true }
    | { intent: UserIntent.ListAll, valid: true }
    | { intent: UserIntent.ListBorrowed, valid: true }
    | { intent: UserIntent.Search, query: string, valid: true }
    | { intent: UserIntent.Intro, valid: true }
    | { valid: false, errorMsg: string, intent: UserIntent }

const USAGE_MSG = `Usage:
    <ISBN>
    list
    search <query>
`;

export async function parseMessage(text: string, files: any[] | undefined, user: string, downloadToken: string): Promise<UserRequest> {
    const tokens = text.split(" ");
    const command = tokens[0];

    if (!command && (!files || !files.length)) {
        return { intent: UserIntent.Intro, valid: true }
    }

    switch (command) {
        case "list": return { intent: UserIntent.ListAll, valid: true };
        case "borrowed": return { intent: UserIntent.ListBorrowed, valid: true };
        case "search": return { intent: UserIntent.Search, query: text, valid: true };
        default: return parseIsbn(tokens, downloadToken, files);
    }
}

async function parseIsbn(tokens: string[], downloadToken: string, files?: any[]): Promise<UserRequest> {
    const intent = UserIntent.ISBN;
    let isbn: string | undefined;
    if (files && files.length && files[0].thumb_720) {
        isbn = await decodeCodeFromUrl(files[0].thumb_720, files[0].thumb_720_w, downloadToken);
        isbn = isbn && parseISBN(isbn);
        if (!isbn) {
            return { intent, valid: false, errorMsg: 'Could not find an ISBN in your image.' };
        }
    } else if (tokens.length) {
        isbn = parseISBN(tokens[0]);
        if (!isbn) {
            return { intent, valid: false, errorMsg: 'Not a valid command or ISBN.' };
        }
    } else {
        return { intent, valid: false, errorMsg: USAGE_MSG };
    }

    return { intent, isbn, valid: true };
}

/**
 * https://en.wikipedia.org/wiki/International_Standard_Book_Number
 *
 * > An ISBN is assigned to each edition and variation (except reprintings) of a book.
 *   The ISBN is 13 digits long if assigned on or after 1 January 2007,
 *   and 10 digits long if assigned before 2007.
 */
function parseISBN(s: string): string | undefined {
    const cleaned = s.replace(/-/g, "");
    if (cleaned.length === 10 || cleaned.length === 13) {
        return cleaned;
    }
}

function getBookBlocks(book: Book, user: string): any {
    return [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": getBookDescription(book),
            },
            "accessory": book.thumbnail ? {
                "type": "image",
                "image_url": book.thumbnail,
                "alt_text": book.title || 'Cover'
            } : undefined,
        },
        {
            "type": "actions",
            "elements": getBookActions(book, user)
        },
        {
            "type": "divider"
        }
    ];
}

function getBookActions(book: Book, user: string) {
    if (book.numCopies === 0) {
        return [
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Add to library",
                    "emoji": true
                },
                "value": `add:${book.isbn}`,
            }
        ];
    } else if (book.borrowers.includes(user)) {
        return [
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Return to library",
                    "emoji": true
                },
                "value": `return:${book.isbn}`,
            }
        ];
    } else if (book.numCopies > book.borrowers.length) {
        return [
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Borrow",
                    "emoji": true
                },
                "value": `borrow:${book.isbn}`,
            }
        ];
    }
}

function getBookDescription(book: Book) {
    const status = book.numCopies ? [
        `Copies remaining: ${book.numCopies - book.borrowers.length}, total copies: ${book.numCopies}`,
        book.borrowers.length ? `borrowed by ${book.borrowers.map(b => `<@${b}>`).join(' ')}` : undefined
    ].filter(Boolean).join('\n') : 'No copies in the library';

    return [
        `*${book.title || '<Untitled>'}*,`,
        book.authors.length ? `by ${book.authors.join(',')}` : undefined,
        status,
    ].filter(Boolean).join('\n');
}

export function presentBookList(books: Book[], user: string): SlackMessage {
    if (!books.length) {
        return { text: 'No books found.' }
    }

    const blocks = [];
    for (const book of books) {
        blocks.push(...getBookBlocks(book, user));
    }
    return { blocks };
}

export function presentIntro() {
    return {
        blocks: [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": [
                        'Welcome to the library, where you can add, borrow and return books. To get started, here are some commands:',
                        '',
                        '*@library <ISBN>* to add, borrow or return a book.',
                        '*@library* with an scanned image of books barcode.',
                        '*@library list* will list all books.',
                        '*@library borrowed* to list books you have borrowed.',
                        '*@library search <QUERY>* to search books.',
                    ].join('\n'),
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "All Books",
                            "emoji": true
                        },
                        "value": `all_books`,
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "My Borrowed Books",
                            "emoji": true
                        },
                        "value": `my_books`,
                    }
                ],
            },
            {
                "type": "divider"
            }
        ]    }
}

export async function handleIsbn(isbn: string, user: string, backend: IBackend, isbnResolver: IsbnResolver): Promise<SlackMessage> {
    let book = await backend.getBook(isbn);
    book = book || await isbnResolver.resolve(isbn);
    return book
        ? {blocks: getBookBlocks(book, user)}
        : {text: 'Could not find any book with that ISBN in the library or Google.'};
}
