import {Callback, Context, Handler} from 'aws-lambda';

import {parseMessage, UserIntent} from "./src/bot";
import {IBackend} from "./src/backends";
import {createBackend} from "./src/backends/factory";

const https = require('https');
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

async function handleBotCommand(msgText: string, userID: string): Promise<string> {
    // strip the <@USERID> app mention
    msgText = msgText.replace(/<@.*> /g, "");

    const [err, request] = parseMessage(msgText, userID);
    if (err !== null) {
        return err;
    }

    const backend: IBackend = createBackend("google-sheets");
    try {
        switch (request.intent) {
            case UserIntent.Borrow: {
                const result = await backend.borrowBook(request.book!.ISBN, userID);
                return result.message;
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
    const message = {
        token: ACCESS_TOKEN,
        channel: event.channel,
        text: text
    };

    const query = qs.stringify(message);
    https.get(`https://slack.com/api/chat.postMessage?${query}`);
    callback(
        null,
        makeApiGatewayCompatibleResponse({ message: "Success" }),
    );
}

// Lambda handler
const handler: Handler = (event: any, context: Context, callback: Callback) => {
    let body = JSON.parse(event.body)
    console.log(body.type);
    switch (body.type) {
        case "url_verification": verify(body, callback); break;
        case "event_callback": processEvent(body.event, callback); break;
        default: callback(null);
    }
};

export { handler };