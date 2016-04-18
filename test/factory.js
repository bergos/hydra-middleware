/* global describe, it */

var assert = require('assert')
var express = require('express')
var factory = require('../factory')
var request = require('supertest-as-promised')
var url = require('url')
var SimpleRDF = require('simplerdf/lite')

describe('factory middleware', function () {
  var app = express()

  it('should call the given factory to handle requests', function () {
    var called = false

    app.use('/factory/call', factory(function () {
      called = true
    }))

    return request(app)
      .get('/factory/call')
      .then(function (res) {
        assert(called)
      })
  })

  it('should forward the requested IRI to the factory', function () {
    var requestedIri

    app.use('/factory/iri', factory(function (iri) {
      requestedIri = iri
    }))

    return request(app)
      .get('/factory/iri')
      .then(function (res) {
        assert.equal(url.parse(requestedIri).path, '/factory/iri')
      })
  })

  it('should use the object built by the factory', function () {
    var called = false

    app.use('/factory/use', factory(function () {
      var instance = new SimpleRDF()

      instance.get = function () {
        called = true
      }

      return instance
    }))

    return request(app)
      .get('/factory/use')
      .expect(204)
      .then(function (res) {
        assert(called)
      })
  })

  it('should handle errors in factory call', function () {
    app.use('/factory/error', factory(function () {
      throw new Error('test')
    }))

    return request(app)
      .get('/factory/error')
      .expect(500)
  })
})
