export class Book {
    constructor(
        private _ISBN: number,
        private _title: string,
        private _numCopies: number,
        private _borrowers: string[]
    ) {}

    get ISBN(): number {
        return this._ISBN;
    }

    get numCopies(): number {
        return this._numCopies;
    }

    get title(): string {
        return this._title;
    }

    get borrowers(): string[] {
        return this._borrowers;
    }
}