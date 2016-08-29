# Promo Deploy Slack Slash Command

This repo contains an AWS Lambda function hooked up to a Slack [slash command](https://api.slack.com/slash-commands) that is used to promote JSON promo definitions from staging to production.

The promo data itself is stored in the [promo_data](https://github.com/ello/promo_data) repo, and is moved into the staging S3 bucket automatically by a CircleCI build/deploy step.


# Development
This bot uses [Claudia.js](https://github.com/claudiajs/claudia) to manage the
the Lambda function itself. Metadata is in `claudia.json`.

To install the Claudia tools:

  $ npm install claudia -g

To deploy a new version of the function to production:

  $ claudia update

There is not currently a staging version of the Lambda function.
