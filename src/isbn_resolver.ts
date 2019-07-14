import * as nodeIsbn from 'node-isbn'
import {Book} from "./book";
import {promisify} from 'util';

export class IsbnResolver {

    constructor(
        private readonly resolver = promisify(nodeIsbn.default.resolve),
    ) {
    }

    async resolve(isbn: string): Promise<Book | undefined> {
        try {
            const result = await this.resolver(isbn);
            if (result) {
                return new Book(
                    isbn,
                    result.title,
                    result.authors,
                    result.imageLinks && result.imageLinks.smallThumbnail,
                    0,
                    [],
                );
            }

        } catch (e) {
            // node-isbn throws when the book can't be found.
            return undefined;
        }
    }

}