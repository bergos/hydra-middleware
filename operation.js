var attachBodyParser = require('./lib/attach-body-parser')

function middleware (attachBodyParser, req, res, next) {
  var method = req.method.toLowerCase()
  var target = req.hydra ? req.hydra.object : null
  var property = req.url.slice(0, 1) === '/' ? req.url.slice(1) : req.url

  // hydra object attached to request?
  if (!target) {
    return next()
  }

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

  attachBodyParser(req, res).then(function () {
    return target[method](req.simple)
  }).then(function (result) {
    if (!result) {
      return res.status(204).end() // No Content
    }

    if (result.iri().interfaceName === 'NamedNode') {
      res.setHeader('Content-Location', result.iri().toString())
    }

    return res.sendSimple(result)
  }).catch(next)
}

function init () {
  return middleware.bind(null, attachBodyParser())
}

module.exports = init
