/* global describe, it */

const api = require('../api')
const assert = require('assert')
const express = require('express')
const request = require('supertest')

describe('api', () => {
  const app = express()

  it('should return a function', () => {
    const middleware = api()

    assert.equal(typeof middleware, 'function')
  })

  it('should attach a Link header', () => {
    app.use('/api-header/link', api(''))

    return request(app)
      .get('/api-header/link')
      .then((res) => {
        assert.equal(typeof res.headers.link, 'string')
      })
  })

  it('should use the given IRI', () => {
    app.use('/api-header/iri', api('/vocab'))

    return request(app)
      .get('/api-header/iri')
      .then((res) => {
        assert.equal(res.headers.link, '</vocab>; rel="http://www.w3.org/ns/hydra/core#apiDocumentation"')
      })
  })
})
