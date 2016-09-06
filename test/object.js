/* global before, describe, it */

var assert = require('assert')
var express = require('express')
var object = require('../object')
var request = require('supertest-as-promised')
var SimpleRDF = require('simplerdf/lite')

describe('object middleware', function () {
  var app = express()
  var host

  before(function () {
    return request(app).get('/').then(function (res) {
      host = res.req.getHeader('host')
    })
  })

  it('should use the given object to handle requests', function () {
    var instance = new SimpleRDF(null, 'http://' + host + '/object/use')
    var called = false

    instance.get = function () {
      called = true
    }

    app.use('/object/use', object(instance))

    return request(app)
      .get('/object/use')
      .expect(204)
      .then(function (res) {
        assert(called)
      })
  })

  it('should handle errors', function () {
    var instance = new SimpleRDF(null, 'http://' + host + '/object/error')

    instance.get = function () {
      throw new Error('error')
    }

    app.use('/object/error', object(instance))

    return request(app)
      .get('/object/error')
      .expect(500)
  })
})
