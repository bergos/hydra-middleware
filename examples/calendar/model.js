var
  hydra = require('hydra-core'),
  jsonldp = require('jsonld').promises(),
  path = require('path');


var Model = function() {
  this.init = function (api) {
    this.api = api;
  };

  this.createEntryPoint = function (iri, controller) {
    var entryPointClass = this.api.findClass(Model.ns.EntryPoint);

    return hydra.model.create(entryPointClass, {
      '@context': Model.ns.context,
      '@id': iri,

      event: {
        '@id': path.join(iri, 'calendar/'),
        '@get': function () {
          // creates a hydra collection based on the array of all events
          return hydra.utils.collection(this.event['@id'], controller.getEvents());
        },
        '@post': function (event) {
          return controller.createEvent(event);
        }
      }
    });
  };

  this.createEvent = function (data, controller) {
    var eventClass = this.api.findClass(Model.ns.Event);

    return jsonldp.compact(data, Model.ns.context)
      .then(function () {
        return hydra.model.create(eventClass, {
          '@context': Model.ns.context,
          '@id': data['@id'],

          // hidden property
          invitees: hydra.model.hide(new Array()),

          startDate: data.startDate,
          name: data.name,
          description: data.description,

          invite: {
            '@id': path.join(data['@id'], 'invite'),
            '@patch': function (person) {
              this.invitees.push(person);
            }
          },

          invitee: {
            '@id': path.join(data['@id'], 'invitee'),
            '@get': function () {
              return hydra.utils.collection(this.invitee['@id'], this.invitees);
            }
          }
        });
      });
  };
};


Model.ns = {
  context: { '@vocab': 'http://schema.org/' },
  EntryPoint: 'http://schema.org/EntryPoint',
  Event: 'http://schema.org/Event'
};


module.exports = Model;
