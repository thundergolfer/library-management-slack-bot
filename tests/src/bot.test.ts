import { parseMessageText } from "../../src/bot";

describe('parseMessageText', function() {
    it('add', function() {
        let result = 5 + 2;
        expect(result).toBe(7);
    });

    it('substract', function() {
        let result = 3 - 0;
        expect(result).toBe(3);
    });
});