const botBuilder = require('claudia-bot-builder')
const SlackTemplate = botBuilder.slackTemplate
const aws = require('aws-sdk')
const s3 = new aws.S3()

module.exports = botBuilder(request => {
  if (request.type === 'slack-slash-command') {
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
          const originalRequest = request.originalRequest
          console.log(originalRequest)

          const authorUsername = originalRequest.user_name
          const message = new SlackTemplate('Thanks!')
                .addAttachment('A1')
                .addAuthor(authorUsername)
                .addText('Promos deployed to production')

          return message.get()

        }).catch(error => error)
    }).catch(function (error) {
      console.log(error)
      return error
    })
  }
})
