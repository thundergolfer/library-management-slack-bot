export class Book {
    constructor(
        // An ISBN is not a digit only thing, AND can have leading zeros
        readonly ISBN: string,
        readonly title?: string,
        readonly numCopies: number = 1,
        readonly borrowers: ReadonlyArray<string> = []
    ) {}
}
