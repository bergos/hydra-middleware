var
  _ = require('lodash'),
  hydramw = require('../../hydra-middleware');


var Controller = function (model) {
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
    return model.createEntryPoint(iri, self);
  };

  this.createEvent = function (data) {
    data['@id'] = nextIri(events, '/calendar/');

    return model.createEvent(data, self)
      .then(function (event) {
        return events[event['@id']] = event;
      });
  };

  this.getEvent = function (iri) {
    if (!(iri in events)) {
      throw new hydramw.utils.NotFoundError('event <' + iri + '> doesn\'nt exist');
    }

    return events[iri];
  };

  this.getEvents = function () {
    return _.values(events);
  };
};


module.exports = Controller;
