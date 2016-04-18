var Promise = require('bluebird')
var attachBodyParser = require('./lib/attach-body-parser')
var operation = Promise.promisify(require('./operation')())

function middleware (object, attachBodyParser, req, res, next) {
  req.hydra = req.hydra || {}
  req.hydra.object = object

  attachBodyParser(req, res).then(function () {
    return operation(req, res, next)
  }).catch(next)
}

function init (object, context) {
  return middleware.bind(null, object, attachBodyParser(context))
}

module.exports = init
