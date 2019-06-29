declare module "node-isbn" {

    export interface IsbnResult {
        title: string,
        authors: ReadonlyArray<string>,
        publisher: string,
        publishedDate: string,
        description: string,
        industryIdentifiers: ReadonlyArray<{
            type: string,
            identifier: string
        }>,
        readingModes: {
            text: boolean,
            image: boolean
        },
        pageCount: number,
        printType: string,
        categories: ReadonlyArray<string>,
        averageRating: number,
        ratingsCount: number,
        contentVersion: string,
        imageLinks: {
            smallThumbnail: string,
            thumbnail: string
        },
        language: string,
        previewLink: string,
        infoLink: string,
        canonicalVolumeLink: string
    }

    interface Options {
        timeout?: number;
    }

    type Callback = (err: Error | null, result: IsbnResult) => void;

    interface NodeIsbn {
        resolve(isbn: string, cb: Callback): void;
    }

    declare const nodeIsbn: NodeIsbn;
    export default nodeIsbn;
}
