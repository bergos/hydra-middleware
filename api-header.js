
function middleware (iri, req, res, next) {
  res.header('Link', '<' + iri + '>; rel="http://www.w3.org/ns/hydra/core#apiDocumentation"')

  next()
}

function init (iri) {
  return middleware.bind(null, iri)
}

module.exports = init
