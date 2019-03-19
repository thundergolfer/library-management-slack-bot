export class Book {
    constructor(
        private _ISBN: number,
        private  _title: string,
        private  _numCopies: number
    ) {}

    get title(): string {
        return this._title
    }
}