const simpleBodyParser = require('simplerdf-body-parser')
const Promise = require('bluebird')
const SimpleCore = require('simplerdf-core')
const SimpleIriFinder = require('simplerdf-iri-finder')
const Simple = SimpleCore.extend(SimpleIriFinder)

function attachBodyParser (bodyParser, req, res) {
  if (res.simple && req.simple) {
    return Promise.resolve()
  }

  return bodyParser(req, res)
}

function init (context) {
  return attachBodyParser.bind(null, Promise.promisify(simpleBodyParser(context, {Simple})))
}

module.exports = init
