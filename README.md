# Library Management Slack Bot

Slack bot that helps facilitate tracking of books and borrowers in your office/home library

-----

## How It Works

This bot exists to manage an index of physical books in a home or office library, and 
also track borrows and returns of the library users. Via simple Slack interactions, 
users can search for available books, record their borrow, and record their return. 

### Commands 

> *Note:* This is currently an MVP. In future, the bot will *not* require the user manually inputting an ISBN.

##### **[@librarybot](/README.md) `borrow <ISBN>`** - Borrow a book with the ISBN of value `<ISBN>`
##### **[@librarybot](/README.md) `add <ISBN>`** - Return an book with the ISBN of value `<ISBN>`
##### **[@librarybot](/README.md) `return <ISBN>`** - Register to the library database a new book with the ISBN of value `<ISBN>`
##### **[@librarybot](/README.md) `search "<Title>"`** - 🚧 *COMING SOON* 🚧

## Development

### Prerequisites 

- **Access to API Gateway and Lambda on the AWS Account where this bot is deployed** 
- **Serverless Framework** ([`npm install -g serverless@1.38.0`](https://serverless.com/framework/docs/getting-started/))
- **Typescript** ([`npm install -g typescript`](https://www.typescriptlang.org/#download-links))
- **Jsonnet** ([`brew install jsonnet`](https://formulae.brew.sh/formula/jsonnet))

### Installation 

`npm install`

### Testing 

#### Unit

All unit tests are contained in [`tests/`](tests/). Run them with:

`npm run test`

#### Integration: `serverless` Local Testing

Using `serverless invoke local -f <function name> -p <path to JSON payload>` we can test the Lambda locally
before deploying to AWS.

Currently the function name is `hello` and the JSON payloads live in [`tests/data/`](/tests/data). The payloads
are generated by _Jsonnet_ (see [**Generating Mock Event Payloads**](#generating-mock-event-payloads)).

For example this command will execute a borrow against the [development Google Sheets DB](https://docs.google.com/spreadsheets/d/1Vbvys2uiSyJWPKsFWjMyHeZ-1mTWDTZCyeFfYCkemuQ/edit#gid=0): 

`serverless invoke local -f hello -p  tests/data/book_message.json`

It won't actually send a message to Slack. It will just `console.log` what would be sent 😊.

#### Generating Mock Event Payloads 

From repository root, run `jsonnet -m test/data test/data/jsonnet/api_gateway_base.jsonnet`. Valid AWS API Gateway payloads
*containing* Slack Event API payloads as strings (`event.body`) will be generated in `test/data`.

## Deployment 

Currently deployment involves manually uploading the `.zip` artifact for the 
function at [https://console.aws.amazon.com/lambda/](https://console.aws.amazon.com/lambda/). 
This can be automated using **Serverless**, and will be soon. For the moment: 

1. `npm run package` (creates `library-management-slack-bot.zip` in `artifact/`)
2. Go to AWS Lambda console and upload `.zip` for `slack-library`
 
