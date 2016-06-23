'use strict'

/*

  Simple light switch example

  Check the status of the light switch:

    curl -H "Accept: application/ld+json" http://localhost:8080/status

  Turn the light on:

    curl -H "Accept: application/ld+json" -H "Content-Type: application/ld+json" -X PUT --data '{"@id":"http://localhost:8080/status","http://example.org/power":{"@id":"http://example.org/on"}}' http://localhost:8080/status

  Turn the light off:

    curl -H "Accept: application/ld+json" -H "Content-Type: application/ld+json" -X PUT --data '{"@id":"http://localhost:8080/status","http://example.org/power":{"@id":"http://example.org/off"}}' http://localhost:8080/status

 */

const apiHeader = require('../api-header')
const formats = require('rdf-formats-common')()
const object = require('../object')
const express = require('express')
const morgan = require('morgan')
const serve = require('rdf-serve-static')
const url = require('url')
const SimpleRDF = require('simplerdf/lite').SimpleRDF

/*
  light switch SimpleRDF context
*/

let context = {
  LightSwitch: 'http://example.org/LightSwitch',
  Status: 'http://example.org/Status',
  label: 'http://www.w3.org/2000/01/rdf-schema#label',
  on: 'http://example.org/on',
  off: 'http://example.org/off',
  power: {
    '@id': 'http://example.org/power',
    '@type': '@id'
  },
  status: {
    '@id': 'http://example.org/status',
    '@type': '@id'
  },
  type: {
    '@id': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    '@type': '@id'
  }
}

/*
  light switch class
*/

class LightSwitchStatus extends SimpleRDF {
  constructor (iri) {
    super(context, iri)

    this.type = context.Status
    this.power = context.off
  }

  get () {
    return this
  }

  put (status) {
    this.power = status.power
  }
}

class LightSwitch extends SimpleRDF {
  constructor (iri, label) {
    super(context, iri)

    this.type = context.LightSwitch
    this.label = label
    this.status = new LightSwitchStatus(url.resolve(iri.toString(), 'status'))
  }

  get () {
    return this
  }
}

/*
  express app
*/

let app = express()

// log a request to the console
app.use(morgan('combined'))

// add api Link header
app.use(apiHeader('/light-switch-vocab'))

// user rdf-serve-static to publich the API vocab
app.use(serve(__dirname, formats))

// use the object middleware to handle request to the light switch
let lightSwitch = new LightSwitch('http://localhost:8080/', 'living room light switch')
app.use('/', object(lightSwitch, context))

let server = app.listen(url.parse(lightSwitch.iri().toString()).port, () => {
  let host = server.address().address
  let port = server.address().port

  console.log('listening on http://%s:%s', host, port)
})
