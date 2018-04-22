/*

  Simple light switch example

  Check the status of the light switch:

    curl -H "Accept: application/ld+json" http://localhost:8080/status

  Turn the light on:

    curl -H "Accept: application/ld+json" -H "Content-Type: application/ld+json" -X PUT --data '{"@id":"http://localhost:8080/status","http://example.org/power":{"@id":"http://example.org/on"}}' http://localhost:8080/status

  Turn the light off:

    curl -H "Accept: application/ld+json" -H "Content-Type: application/ld+json" -X PUT --data '{"@id":"http://localhost:8080/status","http://example.org/power":{"@id":"http://example.org/off"}}' http://localhost:8080/status

 */

const api = require('../../api')
const apiDocumentation = require('hydra-base/documentation')
const context = require('./context')
const object = require('../../object')
const express = require('express')
const morgan = require('morgan')
const url = require('url')
const LightSwitch = require('./LightSwitch')
const LightSwitchStatus = require('./LightSwitchStatus')

const baseIri = 'http://localhost:8080/'

const app = express()

// log a request to the console
app.use(morgan('combined'))

// add api Link header and host the documentation
app.use(api(apiDocumentation(url.resolve(baseIri, '/api'), [
  LightSwitch,
  LightSwitchStatus
])))

// use the object middleware to handle request to the light switch
const lightSwitch = new LightSwitch(baseIri, 'living room light switch')

app.use('/', object(lightSwitch, context))

const server = app.listen(url.parse(lightSwitch['@id']).port, () => {
  const host = server.address().address
  const port = server.address().port

  console.log('listening on http://%s:%s', host, port)
})
