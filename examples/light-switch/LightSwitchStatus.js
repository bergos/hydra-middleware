const apiFromJSON = require('hydra-base/fromJSON')
const context = require('./context')
const HydraBase = require('hydra-base')

class LightSwitchStatus extends HydraBase {
  constructor (iri) {
    super(context, iri)

    this['@type'] = context.Status
    this.power = context.off
  }

  get () {
    return this
  }

  put (status) {
    this.power = status.power
  }
}

LightSwitchStatus.api(apiFromJSON({
  '@id': 'http://example.org/Status',
  label: 'Power Status',
  supportedOperation: [{
    method: 'GET',
    label: 'Retrieves the Power Status',
    returns: 'http://example.org/LightSwitch'
  }],
  supportedProperty: [{
    property: 'http://example.org/power'
  }]
}))

module.exports = LightSwitchStatus
