var attachBodyParser = require('./lib/attach-body-parser')
var trim = require('lodash/trim')

function middleware (attachBodyParser, req, res, next) {
  var method = req.method.toLowerCase()
  var target = req.hydra ? req.hydra.object : null

  // hydra object attached to request?
  if (!target) {
    return next()
  }

  attachBodyParser(req, res).then(function () {
    var property = trim(req.absoluteUrl().slice(target.iri().toString().length), '/')

    if (property) {
      if (!(property in target)) {
        return next()
      }

      target = target[property]
    }

    // method supported?
    if (!(method in target)) {
      return res.status(405).end() // Method Not Allowed
    }

    return Promise.resolve().then(function () {
      return target[method](req.simple)
    }).then(function (result) {
      if (!result) {
        return res.status(204).end() // No Content
      }

      if (result.iri().interfaceName === 'NamedNode') {
        res.setHeader('Content-Location', result.iri().toString())
      }

      return res.sendSimple(result)
    })
  }).catch(next)
}

function init () {
  return middleware.bind(null, attachBodyParser())
}

module.exports = init
