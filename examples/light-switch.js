/*

  Simple light switch example

  Check the status of the light switch:

    curl -H "Accept: application/ld+json" http://localhost:8080/status

  Turn the light on:

    curl -H "Accept: application/ld+json" -H "Content-Type: application/ld+json" -X PUT --data '{"@id":"http://localhost:8080/status","http://example.org/power":{"@id":"http://example.org/on"}}' http://localhost:8080/status

  Turn the light off:

    curl -H "Accept: application/ld+json" -H "Content-Type: application/ld+json" -X PUT --data '{"@id":"http://localhost:8080/status","http://example.org/power":{"@id":"http://example.org/off"}}' http://localhost:8080/status

 */

var object = require('../object')
var express = require('express')
var morgan = require('morgan')
var url = require('url')
var Simple = require('simplerdf')

// light switch JSON-LD context

var context = {
  label: 'ttp://www.w3.org/2000/01/rdf-schema#label',
  on: 'http://example.org/on',
  off: 'http://example.org/off',
  power: {
    '@id': 'http://example.org/power',
    '@type': '@id'
  },
  status: {
    '@id': 'http://example.org/status',
    '@type': '@id'
  }
}

// light switch class

var lightSwitch = new Simple(context)

lightSwitch.label = 'living room light switch'

lightSwitch.get = function () {
  return this
}

var status = new Simple(context, url.resolve(lightSwitch.iri().toString(), 'status'))

status.power = context.off

status.get = function () {
  return this
}

status.put = function (status) {
  this.power = status.power
}

lightSwitch.status = status

// express app

var app = express()

app.use(morgan('combined'))
app.use('/', object(lightSwitch, context))

var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('listening on http://%s:%s', host, port)
})
