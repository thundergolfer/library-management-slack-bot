import {IBackend} from "./index";
import { GoogleSheetsBackend } from "./google-sheets-backend";

export function createBackend(type: string): IBackend {
    switch (type) {
        case 'google-sheets': {
            return GoogleSheetsBackend.create();
        }
        default: {
            throw new Error(`Unknown backend type: ${type}`);
        }
    }
}