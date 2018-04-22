const context = {
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
  }
}

module.exports = context
