/* global describe, it */

var apiHeader = require('../api-header')
var assert = require('assert')
var express = require('express')
var request = require('supertest-as-promised')

describe('api-header middleware', function () {
  var app = express()

  it('should return a function', function () {
    var middleware = apiHeader('')

    assert.equal(typeof middleware, 'function')
  })

  it('should attach a Link header', function () {
    app.use('/api-header/link', apiHeader(''))

    return request(app)
      .get('/api-header/link')
      .then(function (res) {
        assert.equal(typeof res.headers.link, 'string')
      })
  })

  it('should use the given IRI', function () {
    app.use('/api-header/iri', apiHeader('/vocab'))

    return request(app)
      .get('/api-header/iri')
      .then(function (res) {
        assert.equal(res.headers.link, '</vocab>; rel="http://www.w3.org/ns/hydra/core#apiDocumentation"')
      })
  })
})
