/* global before, describe, it */

const assert = require('assert')
const express = require('express')
const operation = require('../operation')
const request = require('supertest')
const Simple = require('simplerdf-core')

describe('operation middleware', () => {
  const app = express()
  let host

  before(() => {
    return request(app).get('/').then((res) => {
      host = res.req.getHeader('host')
    })
  })

  it('should return not found error if no object is attached to the request', () => {
    app.use('/operation/no-object', operation())

    return request(app)
      .get('/operation/no-object')
      .set('Accept', 'application/ld+json')
      .expect(404)
  })

  it('should return method not allowed error if the object doesn\'t support the method', () => {
    app.use('/operation/object-unsupported-method', (req, res, next) => {
      req.hydra = {object: {
        iri: () => {
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

  it('should return no content if the requested operation has no return value', () => {
    app.use('/operation/object-no-return-value', (req, res, next) => {
      req.hydra = {object: {
        iri: () => {
          return 'http://' + host + '/operation/object-no-return-value'
        },
        get: () => {
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

  it('should return OK if the requested operation returns an object', () => {
    const result = new Simple({predicate: 'http://example.org/predicate'})

    result.predicate = 'object'

    app.use('/operation/object-return-value', (req, res, next) => {
      req.hydra = {object: {
        iri: () => {
          return 'http://' + host + '/operation/object-return-value'
        },
        get: () => {
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
      .then((res) => {
        assert(res.body)
        assert.equal(res.body.length, 1)
        assert.equal(res.body[0]['http://example.org/predicate'], result.predicate)
      })
  })

  it('should set Content-Location header if result subject is a NamedNode', () => {
    const result = new Simple({}, 'http://example.org/subject')

    app.use('/operation/content-location', (req, res, next) => {
      req.hydra = {object: {
        iri: () => {
          return 'http://' + host + '/operation/content-location'
        },
        get: () => {
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
      .then((res) => {
        assert(res.headers['content-location'])
        assert.equal(res.headers['content-location'], result.iri().toString())
      })
  })

  it('should return not found error if the property doesn\'t exist', () => {
    app.use('/operation/no-property', (req, res, next) => {
      req.hydra = {object: {
        iri: () => {
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

  it('should return 405 Method Not Allowed if the property doesn\'t support the method', () => {
    app.use('/operation/property-unsupported-method', (req, res, next) => {
      req.hydra = {object: {
        iri: () => {
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

  it('should return OK if the requested property operation returns an object', () => {
    const result = new Simple({predicate: 'http://example.org/predicate'})

    result.predicate = 'object'

    app.use('/operation/property-return-value', (req, res, next) => {
      req.hydra = {object: {
        iri: () => {
          return 'http://' + host + '/operation/property-return-value'
        },
        property: {
          get: () => {
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
      .then((res) => {
        assert(res.body)
        assert.equal(res.body.length, 1)
        assert.equal(res.body[0]['http://example.org/predicate'], result.predicate)
      })
  })

  it('should forward method errors', () => {
    app.use('/operation/error', (req, res, next) => {
      req.hydra = {object: {
        iri: () => {
          return 'http://' + host + '/operation/error'
        },
        get: () => {
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
