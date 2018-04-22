/* global describe, it */

const api = require('../api')
const assert = require('assert')
const express = require('express')
const request = require('supertest')
const Simple = require('simplerdf-core')

describe('api', () => {
  const app = express()

  it('should return a function', () => {
    const middleware = api(new Simple())

    assert.equal(typeof middleware, 'function')
  })

  it('should attach a Link header', () => {
    app.use('/api/link', api(new Simple()))

    return request(app)
      .get('/api/link')
      .then((res) => {
        assert.equal(typeof res.headers.link, 'string')
      })
  })

  it('should use the given IRI', () => {
    app.use('/api/iri', api(new Simple(null, 'http://example.org/api/iri')))

    return request(app)
      .get('/api/iri')
      .then((res) => {
        assert.equal(res.headers.link, '<http://example.org/api/iri>; rel="http://www.w3.org/ns/hydra/core#apiDocumentation"')
      })
  })
})
