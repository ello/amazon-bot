const botBuilder = require('claudia-bot-builder')
const SlackTemplate = botBuilder.slackTemplate
const aws = require('aws-sdk')
const s3 = new aws.S3()
const cloudfront = new aws.CloudFront()

const helpMessage = () => new SlackTemplate(
`Deploy and control promotion data for the webapp

Commands:

  \`deploy\` - Promotes staging data to production
  \`invalidate <environment>\` - invalidates the CDN cache for a given environment.
    Note: Invalidation can take a little time
`).get()

const deployPromos = () => {
  const listResponse = s3.listObjects({ Bucket: 'ello-staging-promos' })

    const chatPromise = listResponse.promise()

    return chatPromise.then(data => {
      const keys = data.Contents.map(obj => obj.Key)

      const copyOperations = keys.map(key => {
        const request = s3.copyObject({
          Bucket: 'ello-production-promos',
          Key: key,
          CopySource: `ello-staging-promos/${key}`
        })

        return request.promise()
      })

      return Promise.all(copyOperations)
        .then(copyResponses => {

          const message = new SlackTemplate('Thanks!')
                .addAttachment('A1')
                .addText('Promos deployed to production')

          return message.get()

        }).catch(error => error)
    }).catch(function (error) {
      console.log(error)
      return error
    })
}

const invalidateCache = cdnEnvironment => {
  if (cdnEnvironment !== 'staging' && cdnEnvironment !== 'production') {
    return new SlackTemplate(`${cdnEnvironment} is not a valid environment`).get()
  }

  const distributionId = cdnEnvironment === 'staging' ? 'E233P4CE1268H7' : 'ENFF23C7D8VH0'

  var invalidateRequest = cloudfront.createInvalidation({
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: `BotInvalidation${new Date().toJSON()}`,
      Paths: {
        Quantity: 1,
        Items: [ '/*.json' ]
      }
    }
  }).promise()

  return invalidateRequest.then(() => {
    return new SlackTemplate(`Invalidating ${cdnEnvironment} promos. This may take a little while`).get()
  }).catch(err => {
    return new SlackTemplate(`Error! ${err}`).get()
  })
}

const responder = request => {
  const text = request.text
  const args = text.split(/\W+/)

  const command = args[0]

  switch (command) {
  case 'help':
    return helpMessage()
  case 'deploy':
    return deployPromos().then(() => invalidateCache('production'))
  case 'invalidate':
    return invalidateCache(args[1])
  default:
    return helpMessage()
  }
}

const botMainFunction = request => {
  if (request.type === 'slack-slash-command') {
    return responder(request)
  }
}

exports = module.exports = botBuilder(botMainFunction)

exports.helpMessage = helpMessage
exports.mainFunction = botMainFunction
