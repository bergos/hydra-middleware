var Promise = require('bluebird')
var attachBodyParser = require('./lib/attach-body-parser')
var operation = Promise.promisify(require('./operation')())
var url = require('url')

function middleware (factory, attachBodyParser, req, res, next) {
  attachBodyParser(req, res).then(function () {
    var iri = url.resolve(req.absoluteUrl(), req.baseUrl)

    return factory(iri)
  }).then(function (object) {
    req.hydra = req.hydra || {}
    req.hydra.object = object

    return operation(req, res, next)
  }).catch(next)
}

function init (factory, context) {
  return middleware.bind(null, factory, attachBodyParser(context))
}

module.exports = init
