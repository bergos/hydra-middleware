var
  _ = require('lodash'),
  hydramw = require('../../hydra-middleware'),
  jsonld = require('jsonld'),
  jsonldp = jsonld.promises(),
  ns = require('./model').ns,
  EntryPoint = require('./model').EntryPoint,
  Event = require('./model').Event;


var Controller = function () {
  var self = this;

  var events = {};

  var nextIri = function (objects, path) {
    var id = 1;

    if (!_.isEmpty(objects)) {
      id = _.max(_.values(objects).map(function (object) {
        return parseInt(object['@id'].slice(path.length));
      })) + 1
    }

    return path + id;
  };

  this.getEntryPoint = function (iri) {
    return Promise.resolve(new EntryPoint(iri, self));
  };

  this.createEvent = function (data) {
    return jsonldp.compact(data, {'@context': ns.context})
      .then(function () {
        data['@id'] = nextIri(events, '/calendar/');

        var event = events[data['@id']] = new Event(data, self);

        return event;
      });
  };

  this.getEvent = function (iri) {
    if (!(iri in events)) {
      return Promise.reject(new hydramw.utils.NotFoundError('event <' + iri + '> doesn\'nt exist'));
    }

    return Promise.resolve(events[iri]);
  };

  this.getEvents = function () {
    return _.values(events);
  };
};


module.exports = Controller;
