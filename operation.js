const attachBodyParser = require('./lib/attach-body-parser')
const trim = require('lodash/trim')

function middleware (attachBodyParser, req, res, next) {
  const method = req.method.toLowerCase()
  let target = req.hydra ? req.hydra.object : null

  // hydra object attached to request?
  if (!target) {
    return next()
  }

  attachBodyParser(req, res).then(() => {
    const property = trim(req.absoluteUrl().slice(target.iri().toString().length), '/')

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

    return Promise.resolve().then(() => {
      return target[method](req.simple)
    }).then((result) => {
      if (!result) {
        return res.status(204).end() // No Content
      }

      if (result.iri().termType === 'NamedNode') {
        res.setHeader('content-location', result.iri().toString())
      }

      return res.simple(result)
    })
  }).catch(next)
}

function init () {
  return middleware.bind(null, attachBodyParser({}))
}

module.exports = init
