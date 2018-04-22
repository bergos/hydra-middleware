const Promise = require('bluebird')
const attachBodyParser = require('./lib/attach-body-parser')
const operation = Promise.promisify(require('./operation')())
const url = require('url')

function middleware (factory, attachBodyParser, req, res, next) {
  attachBodyParser(req, res).then(() => {
    const iri = url.resolve(req.absoluteUrl(), req.baseUrl)

    return factory(iri)
  }).then((object) => {
    req.hydra = req.hydra || {}
    req.hydra.object = object

    return operation(req, res, next)
  }).catch(next)
}

function init (factory, context) {
  return middleware.bind(null, factory, attachBodyParser(context))
}

module.exports = init
