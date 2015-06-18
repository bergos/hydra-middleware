var
  _ = require('lodash'),
  hydra = require('hydra-core'),
  hydramw = require('../../hydra-middleware');


var ns = {
  context: { '@vocab': 'http://schema.org/' },
  EntryPoint: 'http://schema.org/EntryPoint',
  Event: 'http://schema.org/Event'
};


var EntryPoint = function (iri, controller) {
  var self = this;

  hydramw.Class.call(this, {
    '@context': ns.context,
    '@type': ns.EntryPoint,
    '@id': iri
  });

  this.event = {
    '@id': 'calendar/',
    '@get': function () {
      // creates a hydra collection based on the array of all events
      return Promise.resolve(hydra.utils.collection(self.event['@id'], controller.getEvents()));
    },
    '@post': function (event) {
      return controller.createEvent(event)
        .then(function (event) {
          // use the @get method to convert the object to a valid JSON-LD object
          return event['@get']();
        });
    }
  };
};

var Event = function (data, controller) {
  var self = this;

  hydramw.Class.call(this, {
    '@context': ns.context,
    '@type': ns.Event,
    '@id': data['@id']
  });

  this.startDate = data.startDate;
  this.name = data.name;
  this.description = data.description;

  var invitees = [];

  this.invite = {
    '@id': 'invite',
    '@patch': function (person) {
      invitees.push(person);

      return Promise.resolve();
    }
  };

  this.invitee = {
    '@id': 'invitee',
    '@get': function () {
      return Promise.resolve(hydra.utils.collection(self.invitee['@id'], invitees));
    }
  };
};


module.exports = {
  EntryPoint: EntryPoint,
  Event: Event,
  ns: ns
};
