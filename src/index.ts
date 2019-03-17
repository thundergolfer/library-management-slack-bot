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
const verify = (data: any, callback: any) => {
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

// Post message to Slack - https://api.slack.com/methods/chat.postMessage
function processEvent(event: any, callback: any) {
    // test the message for a match and not a bot
    if (!event.bot_id && /(aws|lambda)/ig.test(event.text)) {
        var text = `<@${event.user}> isn't AWS Lambda awesome?`;
        var message = {
            token: ACCESS_TOKEN,
            channel: event.channel,
            text: text
        };

        var query = qs.stringify(message); // prepare the querystring
        https.get(`https://slack.com/api/chat.postMessage?${query}`);
    }
    callback(null);
}

// Lambda handler
exports.handler = (event: any, context: any, callback: any) => {
    let body = JSON.parse(event.body)
    switch (body.type) {
        case "url_verification": verify(body, callback); break;
        case "event_callback": processEvent(body.event, callback); break;
        default: callback(null);
    }
};