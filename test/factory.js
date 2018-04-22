/* global describe, it */

const assert = require('assert')
const express = require('express')
const factory = require('../factory')
const request = require('supertest')
const url = require('url')
const Simple = require('simplerdf-core')

describe('factory middleware', () => {
  const app = express()

  it('should call the given factory to handle requests', () => {
    let called = false

    app.use('/factory/call', factory(() => {
      called = true
    }))

    return request(app)
      .get('/factory/call')
      .then((res) => {
        assert(called)
      })
  })

  it('should forward the requested IRI to the factory', () => {
    let requestedIri

    app.use('/factory/iri', factory((iri) => {
      requestedIri = iri
    }))

    return request(app)
      .get('/factory/iri')
      .then((res) => {
        assert.equal(url.parse(requestedIri).path, '/factory/iri')
      })
  })

  it('should use the object built by the factory', () => {
    let called = false

    app.use('/factory/use', factory((iri) => {
      const instance = new Simple(null, iri)

      instance.get = () => {
        called = true
      }

      return instance
    }))

    return request(app)
      .get('/factory/use')
      .expect(204)
      .then((res) => {
        assert(called)
      })
  })

  it('should use the given context', () => {
    app.use('/factory/context', factory((iri) => {
      const instance = new Simple(null, iri)

      instance.post = (input) => {
        assert.equal(input.context().properties().shift(), 'test')
      }

      return instance
    }, {test: 'http://example.org/test'}))

    return request(app)
      .post('/factory/context')
      .expect(204)
  })

  it('should handle errors in factory call', () => {
    app.use('/factory/error', factory(() => {
      throw new Error('test')
    }))

    return request(app)
      .get('/factory/error')
      .expect(500)
  })
})
