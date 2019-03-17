# Library Management Slack Bot

Slack bot that helps facilitate tracking of books and borrowers in your office/home library

-----

## How It Works

This bot exists to manage an index of physical books in a home or office library, and 
also track borrows and returns of the library users. Via simple Slack interactions, 
users can search for available books, record their borrow, and record their return. 

**TODO:** *Specific commands coming soon*


## Development

### Prerequisites 

- **Serverless Framework** ([`npm install -g serverless@1.38.0`](https://serverless.com/framework/docs/getting-started/))
- **Typescript** ([`npm install -g typescript`](https://www.typescriptlang.org/#download-links))

### Installation 

`npm install`

### Testing 

`coming soon`

## Deployment 

Currently deployment involves manually uploading the `.zip` artifact for the 
function at [https://console.aws.amazon.com/lambda/](https://console.aws.amazon.com/lambda/). 
This can be automated using **Serverless**, and will be soon. For the moment: 

1. `npm run package` (creates `library-management-slack-bot.zip` in `artifact/`)
2. Go to AWS Lambda console and upload `.zip` for `slack-library`
 
