export class Book {
    constructor(
        // An ISBN is not a digit only thing, AND can have leading zeros
        private _ISBN: string,
        private _title?: string,
        private _numCopies?: number,
        private _borrowers?: string[]
    ) {}

    get ISBN(): string {
        return this._ISBN;
    }

    get numCopies(): number {
        return this._numCopies || 1;
    }

    get title(): string | undefined{
        return this._title;
    }

    get borrowers(): string[] {
        return this._borrowers || [];
    }
}