import * as dotenv from 'dotenv';

dotenv.config();

import {Callback, Context, Handler} from 'aws-lambda';

import {parseMessage, UserIntent, presentBookList, handleIsbn} from "./src/bot";
import {IBackend} from "./src/backends";
import {createBackend} from "./src/backends/factory";
import * as request from "request";
import {IsbnResolver} from "./src/isbn_resolver";
import {SlackMessage} from "./src/slack_message";

const VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN!;
const ACCESS_TOKEN = process.env.SLACK_ACCESS_TOKEN!;
const BOT_ACCESS_TOKEN = process.env.SLACK_BOT_ACCESS_TOKEN!;

if (!VERIFICATION_TOKEN || !ACCESS_TOKEN) {
    throw new Error('Slack credentials missing.')
}

const makeApiGatewayCompatibleResponse = (payload: { challenge?: any; message?: string; }) => ({
    "statusCode": 200,
    "headers": {},
    "body": JSON.stringify(payload),
    "isBase64Encoded": false
});

// Verify Url - https://api.slack.com/events/url_verification
const verify = (data: any, callback: Callback) => {
    if (data.token === VERIFICATION_TOKEN) {
        callback(
            null,
            makeApiGatewayCompatibleResponse({ challenge: data.challenge})
        );
    }
    else {
        callback(
            null,
            makeApiGatewayCompatibleResponse({ message: "verification failed"})
        );
    }
};

function postToSlack(channel: string, user: string, message: SlackMessage, uri: string = 'https://slack.com/api/chat.postEphemeral') {
    if (process.env.IS_LOCAL) {
        console.log({ channel, ...message });
        return;
    }

    request.post({
        uri,
        body: {
            channel,
            user,
            ...message
        },
        headers: {'Authorization': `Bearer ${BOT_ACCESS_TOKEN}`},
        json: true,
    }, (err, res, body) => {
        if (err || res.statusCode < 200 || res.statusCode >= 300 || !body || body.ok === false) {
            err && console.error(err);
            body && console.error(body);
        }
    });
}

let backend: IBackend | undefined;
const isbnResolver = new IsbnResolver();

async function handleBotCommand(msgText: string, files: any[], userID: string, downloadToken: string): Promise<SlackMessage> {
    // strip the <@USERID> app mention
    msgText = msgText.replace(/<@.*> /g, "");

    const request = await parseMessage(msgText, files, userID, downloadToken);
    if (!request.valid) {
        return { text: request.errorMsg };
    }

    backend = backend || await createBackend("google-sheets");
    switch (request.intent) {
        case UserIntent.ISBN: {
            console.log(`handling isbn ${request.isbn}`);
            return handleIsbn(request.isbn, userID, backend, isbnResolver);
        }
        case UserIntent.ListBooks: {
            console.log("handling a request to list all books in DB");
            const books = await backend.listBooks();
            return presentBookList(books, userID);
        }
        default:
            return { text: "Could not parse your request, sorry." };
    }
}

// Post message to Slack - https://api.slack.com/methods/chat.postMessage
async function processEvent(event: any, callback: Callback) {
    const text = await handleBotCommand(event.text, event.files, event.user, ACCESS_TOKEN);
    postToSlack(event.channel, event.user, text);

    callback(
        null,
        makeApiGatewayCompatibleResponse({ message: "Success" }),
    );
}

async function processActions(user: { id: string }, channel: string, responseUrl: string, actions: ReadonlyArray<{value: string}>) {
    backend = backend || await createBackend("google-sheets");

    for (const _action of actions) {
        const [action, isbn] = _action.value.split(':');
        let text;

        switch (action) {
            case "add":
                const book = await isbnResolver.resolve(isbn);
                if (!book) {
                    throw new Error(`No such book ${isbn}`)
                }
                await backend.addBook({
                    ...book,
                    numCopies: 1,
                });
                text = `${book.title} added.`;
                break;
            case "return":
                text = (await backend.returnBook(isbn, user.id)).message;
                break;
            case "borrow":
                text = (await backend.borrowBook(isbn, user.id)).message;
                break;
            default:
                throw new Error(`Unknown action ${action}`)
        }

        postToSlack(channel, user.id, { text, response_type: 'ephemeral' }, responseUrl);
    }
}

// Lambda handler
export const handler: Handler = (event: any, context: Context, callback: Callback) => {
    const body = event.body.startsWith('payload=')
        ? JSON.parse(decodeURIComponent(event.body.substring('payload='.length)))
        : JSON.parse(event.body);
    switch (body.type) {
        case "url_verification": verify(body, callback); break;
        case "event_callback": processEvent(body.event, callback); break;
        case "block_actions": processActions(body.user, body.channel.id, body.response_url, body.actions); break;
        default: callback(null);
    }
};
