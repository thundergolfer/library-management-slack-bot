// NOTE: This is a basic working Slack Lambda, kept here as a backup
var AWS = require('aws-sdk');

const https = require('https'),
    qs = require('querystring'),
    VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN,
    ACCESS_TOKEN = process.env.SLACK_ACCESS_TOKEN;

function makeApiGatewayCompatibleResponse(payload) {
    return {
        "statusCode": 200,
        "headers": {},
        "body": JSON.stringify(payload),
        "isBase64Encoded": false
    };
}

// Verify Url - https://api.slack.com/events/url_verification
function verify(data, callback) {
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
}

// Post message to Slack - https://api.slack.com/methods/chat.postMessage
function processEvent(event, callback) {
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
exports.handler = (event, context, callback) => {
    let body = JSON.parse(event.body)
    switch (body.type) {
        case "url_verification": verify(body, callback); break;
        case "event_callback": processEvent(body.event, callback); break;
        default: callback(null);
    }
};