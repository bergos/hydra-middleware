var Promise = require('bluebird')
var attachAbsoluteUrl = require('./lib/attach-absolute-url')
var operation = Promise.promisify(require('./operation')())
var url = require('url')

function middleware (factory, attachAbsoluteUrl, req, res, next) {
  attachAbsoluteUrl(req, res).then(function () {
    var iri = url.resolve(req.absoluteUrl(), req.baseUrl)

    return factory(iri)
  }).then(function (object) {
    req.hydra = req.hydra || {}
    req.hydra.object = object

    return operation(req, res, next)
  }).catch(next)
}

function init (factory) {
  return middleware.bind(null, factory, attachAbsoluteUrl())
}

module.exports = init
