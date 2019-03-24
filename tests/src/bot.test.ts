import { parseMessage, UserIntent } from "../../src/bot";

describe('parseMessage', () => {
    const validThirteenDigitISBN = "978-3-16-148410-0";

    it('correctly parses command to add a book to DB', () => {
        let [ err, result ] = parseMessage(`add ${validThirteenDigitISBN}`, "userId1");

        expect(err).toBeNull();
        expect(result.intent).toEqual(UserIntent.AddNewBook);
        expect(result.book!.ISBN).toEqual("9783161484100");
    });

    it('rejects invalid commands to add a book', () => {
        let [ err, result ] = parseMessage(`add ThisIsntAnISBN`, "userId1");
        expect(err).toEqual("ISBN 'ThisIsntAnISBN' is invalid!");
    });

    it('correctly parses command to borrow a book', () => {
        let [ err, result ] = parseMessage(`borrow ${validThirteenDigitISBN}`, "userId1");

        expect(err).toBeNull();
        expect(result.intent).toEqual(UserIntent.Borrow);
        expect(result.book!.ISBN).toEqual("9783161484100");
        expect(result.userId!).toEqual("userId1");
    });

    it('rejects invalid commands to borrow a book', () => {
        let [ err, result ] = parseMessage(`add ThisIsntAnISBN`, "userId1");
        expect(err).toEqual("ISBN 'ThisIsntAnISBN' is invalid!");
    });

    it('correctly parses command to return a book', () => {
        let [ err, result ] = parseMessage(`return ${validThirteenDigitISBN}`, "userId1");

        expect(err).toBeNull();
        expect(result.intent).toEqual(UserIntent.Return);
        expect(result.book!.ISBN).toEqual("9783161484100");
        expect(result.userId!).toEqual("userId1");
    });

    it('rejects invalid commands to return a book', () => {
        let [ err, result ] = parseMessage(`return ThisIsntAnISBN`, "userId1");
        expect(err).toEqual("ISBN 'ThisIsntAnISBN' is invalid!");
    });
});