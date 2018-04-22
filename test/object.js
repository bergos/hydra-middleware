/* global before, describe, it */

const assert = require('assert')
const express = require('express')
const object = require('../object')
const request = require('supertest')
const Simple = require('simplerdf-core')

describe('object middleware', () => {
  const app = express()
  let host

  before(() => {
    return request(app).get('/').then((res) => {
      host = res.req.getHeader('host')
    })
  })

  it('should use the given object to handle requests', () => {
    const instance = new Simple(null, 'http://' + host + '/object/use')
    let called = false

    instance.get = () => {
      called = true
    }

    app.use('/object/use', object(instance))

    return request(app)
      .get('/object/use')
      .expect(204)
      .then((res) => {
        assert(called)
      })
  })

  it('should handle errors', () => {
    const instance = new Simple(null, 'http://' + host + '/object/error')

    instance.get = () => {
      throw new Error('error')
    }

    app.use('/object/error', object(instance))

    return request(app)
      .get('/object/error')
      .expect(500)
  })
})
