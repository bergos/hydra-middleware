var Promise = require('bluebird')
var simpleBodyParser = require('simplerdf-body-parser')

function attachBodyParser (bodyParser, req, res) {
  if (res.sendSimple) {
    return Promise.resolve()
  }

  return bodyParser(req, res)
}

function init (context) {
  return attachBodyParser.bind(null, Promise.promisify(simpleBodyParser(context)))
}

module.exports = init
