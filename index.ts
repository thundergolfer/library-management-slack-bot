import {Callback, Context, Handler} from 'aws-lambda';

import {parseMessage, UserIntent, presentBookList} from "./src/bot";
import {IBackend} from "./src/backends";
import {createBackend} from "./src/backends/factory";
import * as request from "request";

const qs = require('querystring');
const VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;
const ACCESS_TOKEN = process.env.SLACK_ACCESS_TOKEN;

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

function postToSlack(channel: string, text: string) {
    if (process.env.IS_LOCAL) {
        console.log({ channel, text });
        return;
    }

    const message = {
        token: ACCESS_TOKEN,
        channel: channel,
        text: text
    };
    const query = qs.stringify(message);

    request.get(`https://slack.com/api/chat.postMessage?${query}`, (err, res, _body) => {
        const body = _body && JSON.parse(_body);
        if (err || res.statusCode < 200 || res.statusCode >= 300 || !body || body.ok === false) {
            err && console.error(err);
            body && console.error(body);
        }
    });
}

async function handleBotCommand(msgText: string, userID: string): Promise<string> {
    // strip the <@USERID> app mention
    msgText = msgText.replace(/<@.*> /g, "");

    const request = parseMessage(msgText, userID);
    if (!request.valid) {
        return request.errorMsg;
    }

    try {
        const backend: IBackend = await createBackend("google-sheets");
        switch (request.intent) {
            case UserIntent.Borrow: {
                console.log("handling a borrow.");
                const result = await backend.borrowBook(request.book.ISBN, userID);
                return result.message;
            }
            case UserIntent.Return: {
                console.log("handling a return.");
                const result = await backend.returnBook(request.book.ISBN, userID);
                return result.message;
            }
            case UserIntent.ListBooks: {
                console.log("handling a request to list all books in DB");
                const books = await backend.listBooks();
                return presentBookList(books);
            }
            default:
                return "Could not parse your request, sorry.";
        }
    } catch(err) {
        return err;
    }
}

// Post message to Slack - https://api.slack.com/methods/chat.postMessage
async function processEvent(event: any, callback: Callback) {
    const text = await handleBotCommand(event.text, event.user);
    postToSlack(event.channel, text);

    callback(
        null,
        makeApiGatewayCompatibleResponse({ message: "Success" }),
    );
}

// Lambda handler
const handler: Handler = (event: any, context: Context, callback: Callback) => {
    let body = JSON.parse(event.body)
    switch (body.type) {
        case "url_verification": verify(body, callback); break;
        case "event_callback": processEvent(body.event, callback); break;
        default: callback(null);
    }
};

export { handler };