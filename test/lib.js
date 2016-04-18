/* global describe, it */

var assert = require('assert')
var attachAbsoluteUrl = require('../lib/attach-absolute-url')
var attachBodyParser = require('../lib/attach-body-parser')
var express = require('express')
var request = require('supertest-as-promised')

describe('attach-absolute-url', function () {
  var app = express()

  it('should attach .absoluteUrl function', function () {
    var attach = attachAbsoluteUrl()
    var typeofAbsoluteUrl

    app.use('/attach-absolute-url/attach', function (req, res, next) {
      attach(req, res).then(function () {
        typeofAbsoluteUrl = typeof req.absoluteUrl

        next()
      })
    })

    return request(app)
      .get('/attach-absolute-url/attach')
      .then(function (res) {
        assert.equal(typeofAbsoluteUrl, 'function')
      })
  })

  it('should do nothing if there is already a .absoluteUrl function', function () {
    var absoluteUrl = function () {}
    var attach = attachAbsoluteUrl()
    var attachedAbsoluteUrl

    app.use('/attach-absolute-url/nothing', function (req, res, next) {
      req.absoluteUrl = absoluteUrl

      attach(req, res).then(function () {
        attachedAbsoluteUrl = req.absoluteUrl

        next()
      })
    })

    return request(app)
      .get('/attach-absolute-url/nothing')
      .then(function (res) {
        assert.equal(attachedAbsoluteUrl, absoluteUrl)
      })
  })
})

describe('attach-body-parser', function () {
  var app = express()

  it('should attach bodyParser', function () {
    var attach = attachBodyParser()
    var typeofSendSimple

    app.use('/attach-body-parser/attach', function (req, res, next) {
      attach(req, res).then(function () {
        typeofSendSimple = typeof res.sendSimple

        next()
      })
    })

    return request(app)
      .get('/attach-body-parser/attach')
      .then(function (res) {
        assert.equal(typeofSendSimple, 'function')
      })
  })

  it('should do nothing if there is already a .sendSimple function', function () {
    var sendSimple = function () {}
    var attach = attachBodyParser()
    var attachedSendSimple

    app.use('/attach-body-parser/nothing', function (req, res, next) {
      res.sendSimple = sendSimple

      attach(req, res).then(function () {
        attachedSendSimple = res.sendSimple

        next()
      })
    })

    return request(app)
      .get('/attach-body-parser/nothing')
      .then(function (res) {
        assert.equal(attachedSendSimple, sendSimple)
      })
  })
})
