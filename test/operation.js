/* global before, describe, it */

var assert = require('assert')
var express = require('express')
var operation = require('../operation')
var request = require('supertest-as-promised')
var SimpleRDF = require('simplerdf/lite')

describe('operation middleware', function () {
  var app = express()
  var host

  before(function () {
    return request(app).get('/').then(function (res) {
      host = res.req.getHeader('host')
    })
  })

  it('should return not found error if no object is attached to the request', function () {
    app.use('/operation/no-object', operation())

    return request(app)
      .get('/operation/no-object')
      .set('Accept', 'application/ld+json')
      .expect(404)
  })

  it('should return method not allowed error if the object doesn\'t support the method', function () {
    app.use('/operation/object-unsupported-method', function (req, res, next) {
      req.hydra = {object: {
        iri: function () {
          return 'http://' + host + '/operation/object-unsupported-method'
        }
      }}

      next()
    })

    app.use('/operation/object-unsupported-method', operation())

    return request(app)
      .get('/operation/object-unsupported-method')
      .set('Accept', 'application/ld+json')
      .expect(405)
  })

  it('should return no content if the requested operation has no return value', function () {
    app.use('/operation/object-no-return-value', function (req, res, next) {
      req.hydra = {object: {
        iri: function () {
          return 'http://' + host + '/operation/object-no-return-value'
        },
        get: function () {
        }
      }}

      next()
    })

    app.use('/operation/object-no-return-value', operation())

    return request(app)
      .get('/operation/object-no-return-value')
      .set('Accept', 'application/ld+json')
      .expect(204)
  })

  it('should return OK if the requested operation returns an object', function () {
    var result = new SimpleRDF({predicate: 'http://example.org/predicate'})

    result.predicate = 'object'

    app.use('/operation/object-return-value', function (req, res, next) {
      req.hydra = {object: {
        iri: function () {
          return 'http://' + host + '/operation/object-return-value'
        },
        get: function () {
          return result
        }
      }}

      next()
    })

    app.use('/operation/object-return-value', operation())

    return request(app)
      .get('/operation/object-return-value')
      .set('Accept', 'application/ld+json')
      .expect(200)
      .then(function (res) {
        assert(res.body)
        assert.equal(res.body.length, 1)
        assert.equal(res.body[0]['http://example.org/predicate'], result.predicate)
      })
  })

  it('should set Content-Location header if result subject is a NamedNode', function () {
    var result = new SimpleRDF({}, 'http://example.org/subject')

    app.use('/operation/content-location', function (req, res, next) {
      req.hydra = {object: {
        iri: function () {
          return 'http://' + host + '/operation/content-location'
        },
        get: function () {
          return result
        }
      }}

      next()
    })

    app.use('/operation/content-location', operation())

    return request(app)
      .get('/operation/content-location')
      .set('Accept', 'application/ld+json')
      .expect(200)
      .then(function (res) {
        assert(res.headers['content-location'])
        assert.equal(res.headers['content-location'], result.iri().toString())
      })
  })

  it('should return not found error if the property doesn\'t exist', function () {
    app.use('/operation/no-property', function (req, res, next) {
      req.hydra = {object: {
        iri: function () {
          return 'http://' + host + '/operation/no-property'
        }
      }}

      next()
    })

    app.use('/operation/no-property', operation())

    return request(app)
      .get('/operation/no-property/property')
      .set('Accept', 'application/ld+json')
      .expect(404)
  })

  it('should return 405 Method Not Allowed if the property doesn\'t support the method', function () {
    app.use('/operation/property-unsupported-method', function (req, res, next) {
      req.hydra = {object: {
        iri: function () {
          return 'http://' + host + '/operation/property-unsupported-method'
        },
        property: {}
      }}

      next()
    })

    app.use('/operation/property-unsupported-method', operation())

    return request(app)
      .get('/operation/property-unsupported-method/property')
      .set('Accept', 'application/ld+json')
      .expect(405)
  })

  it('should return OK if the requested property operation returns an object', function () {
    var result = new SimpleRDF({predicate: 'http://example.org/predicate'})

    result.predicate = 'object'

    app.use('/operation/property-return-value', function (req, res, next) {
      req.hydra = {object: {
        iri: function () {
          return 'http://' + host + '/operation/property-return-value'
        },
        property: {
          get: function () {
            return result
          }
        }
      }}

      next()
    })

    app.use('/operation/property-return-value', operation())

    return request(app)
      .get('/operation/property-return-value/property')
      .set('Accept', 'application/ld+json')
      .expect(200)
      .then(function (res) {
        assert(res.body)
        assert.equal(res.body.length, 1)
        assert.equal(res.body[0]['http://example.org/predicate'], result.predicate)
      })
  })

  it('should forward method errors', function () {
    app.use('/operation/error', function (req, res, next) {
      req.hydra = {object: {
        iri: function () {
          return 'http://' + host + '/operation/error'
        },
        get: function () {
          throw new Error('error')
        }
      }}

      next()
    })

    app.use('/operation/error', operation())

    return request(app)
      .get('/operation/error')
      .set('Accept', 'application/ld+json')
      .expect(500)
  })
})
