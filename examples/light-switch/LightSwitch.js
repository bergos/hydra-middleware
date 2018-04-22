const context = require('./context')
const apiFromJSON = require('hydra-base/fromJSON')
const url = require('url')
const HydraBase = require('hydra-base')
const LightSwitchStatus = require('./LightSwitchStatus')

class LightSwitch extends HydraBase {
  constructor (iri, label) {
    super(context, iri)

    this['@type'] = context.LightSwitch
    this.label = label
    this.status = new LightSwitchStatus(url.resolve(iri.toString(), 'status'))
  }

  get () {
    return this
  }
}

LightSwitch.api(apiFromJSON({
  '@id': 'http://example.org/LightSwitch',
  label: 'Light Switch',
  supportedOperation: [{
    method: 'GET',
    label: 'Retrieves a Light Switch',
    returns: 'http://example.org/LightSwitch'
  }],
  supportedProperty: [{
    property: {
      '@id': 'http://example.org/status',
      supportedOperation: [{
        method: 'GET',
        label: 'Retrieves the status',
        returns: 'http://example.org/Status'
      }, {
        method: 'PUT',
        label: 'Sets the status',
        expects: 'http://example.org/Status',
        returns: 'http://example.org/Status'
      }]
    }
  }]
}))

module.exports = LightSwitch
