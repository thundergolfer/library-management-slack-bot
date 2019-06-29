export class Book {
    constructor(
        // An ISBN is not a digit only thing, AND can have leading zeros
        readonly isbn: string,
        readonly title: string | undefined,
        readonly authors: ReadonlyArray<string>,
        readonly thumbnail: string | undefined,
        readonly numCopies: number = 1,
        readonly borrowers: ReadonlyArray<string> = []
    ) {}
}
