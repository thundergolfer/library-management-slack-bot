import { parseMessageText, UserIntent } from "../../src/bot";

describe('parseMessageText', () => {
    const validThirteenDigitISBN = "978-3-16-148410-0";

    it('correctly parses command to add a book to DB', () => {
        let [ err, result ] = parseMessageText(`add ${validThirteenDigitISBN}`);

        expect(err).toBeNull();
        expect(result.intent).toEqual(UserIntent.AddNewBook);
        expect(result.book!.ISBN).toEqual(9783161484100);
    });

    it('rejects invalid commands to add a book', () => {
        let [ err, result ] = parseMessageText(`add ThisIsntAnISBN`);
        expect(err).toEqual("ISBN 'ThisIsntAnISBN' is invalid!");
    });

    it('correctly parses command to borrow a book', () => {
        let [ err, result ] = parseMessageText(`borrow ${validThirteenDigitISBN}`);

        expect(err).toBeNull();
        expect(result.intent).toEqual(UserIntent.Borrow);
        expect(result.book!.ISBN).toEqual(9783161484100);
    });

    it('rejects invalid commands to borrow a book', () => {
        let [ err, result ] = parseMessageText(`add ThisIsntAnISBN`);
        expect(err).toEqual("ISBN 'ThisIsntAnISBN' is invalid!");
    });

    it('correctly parses command to return a book', () => {
        let [ err, result ] = parseMessageText(`return ${validThirteenDigitISBN}`);

        expect(err).toBeNull();
        expect(result.intent).toEqual(UserIntent.Return);
        expect(result.book!.ISBN).toEqual(9783161484100);
    });

    it('rejects invalid commands to return a book', () => {
        let [ err, result ] = parseMessageText(`return ThisIsntAnISBN`);
        expect(err).toEqual("ISBN 'ThisIsntAnISBN' is invalid!");
    });
});