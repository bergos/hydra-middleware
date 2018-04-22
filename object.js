const Promise = require('bluebird')
const attachBodyParser = require('./lib/attach-body-parser')
const operation = Promise.promisify(require('./operation')())

function middleware (object, attachBodyParser, req, res, next) {
  req.hydra = req.hydra || {}
  req.hydra.object = object

  attachBodyParser(req, res).then(() => {
    return operation(req, res, next)
  }).catch(next)
}

function init (object, context) {
  return middleware.bind(null, object, attachBodyParser(context))
}

module.exports = init
