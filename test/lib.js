/* global describe, it */

const assert = require('assert')
const attachBodyParser = require('../lib/attach-body-parser')
const express = require('express')
const request = require('supertest')

describe('attach-body-parser', () => {
  const app = express()

  it('should attach bodyParser', () => {
    const attach = attachBodyParser()
    let typeofSendSimple

    app.use('/attach-body-parser/attach', (req, res, next) => {
      attach(req, res).then(() => {
        typeofSendSimple = typeof res.simple

        next()
      })
    })

    return request(app)
      .get('/attach-body-parser/attach')
      .then((res) => {
        assert.equal(typeofSendSimple, 'function')
      })
  })

  it('should do nothing if there is already a .sendSimple function', () => {
    const sendSimple = () => {}
    const attach = attachBodyParser()
    let attachedSendSimple

    app.use('/attach-body-parser/nothing', (req, res, next) => {
      res.sendSimple = sendSimple

      attach(req, res).then(() => {
        attachedSendSimple = res.sendSimple

        next()
      })
    })

    return request(app)
      .get('/attach-body-parser/nothing')
      .then((res) => {
        assert.equal(attachedSendSimple, sendSimple)
      })
  })
})
