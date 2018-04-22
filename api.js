const setLink = require('set-link')
const simpleBodyParser = require('simplerdf-body-parser')()
const url = require('url')
const Router = require('express').Router

function init (documentation) {
  const router = new Router()

  router.use(setLink, (req, res, next) => {
    res.setLink(documentation['@id'], 'http://www.w3.org/ns/hydra/core#apiDocumentation')

    next()
  })

  router.use(url.parse(documentation['@id']).pathname, simpleBodyParser, (req, res) => {
    res.simple(documentation)
  })

  return router
}

module.exports = init
