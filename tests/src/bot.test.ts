import { parseMessage, UserIntent } from "../../src/bot";

describe('parseMessage', () => {
    const validThirteenDigitISBN = "978-3-16-148410-0";

    it('correctly parses command to list books in DB', () => {
        return parseMessage(
          'list',
          [],
          'userId1',
          'fakeDOWNLOADt0k3n',
        ).then(userReq => {
           expect(userReq.valid).toBe(true);
            expect(userReq.intent).toBe(UserIntent.ListAll);
        });
    });

    it('correctly parses command to list borrowed books in DB', () => {
        return parseMessage(
          'borrowed',
          [],
          'userId1',
          'fakeDOWNLOADt0k3n',
        ).then(userReq => {
            expect(userReq.valid).toBe(true);
            expect(userReq.intent).toBe(UserIntent.ListBorrowed);
        })
    })
});