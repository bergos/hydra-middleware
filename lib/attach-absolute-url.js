var Promise = require('bluebird')
var absoluteUrl = require('absolute-url')

function attachAbsoluteUrl (absoluteUrl, req, res) {
  if (req.absoluteUrl) {
    return Promise.resolve()
  }

  return absoluteUrl(req, res)
}

function init () {
  return attachAbsoluteUrl.bind(null, Promise.promisify(absoluteUrl()))
}

module.exports = init
