var
  _ = require('lodash'),
  jsonld = require('jsonld'),
  jsonldp = jsonld.promises(),
  EntryPoint = require('./model').EntryPoint,
  Issue = require('./model').Issue,
  User = require('./model').User;


var Controller = function () {
  var self = this;

  var issues = {};
  var users = {};

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

  this.createIssue = function (data) {
    return jsonldp.compact(data, {'@context': Issue['@context']})
      .then(function (data) {
        data['@id'] = nextIri(issues, '/hydra/api-demo/issues/');

        issues[data['@id']] = new Issue(data, self);

        return Promise.resolve(issues[data['@id']]);
      });
  };

  this.deleteIssue = function (iri) {
    if (!(iri in issues)) {
      return Promise.resolve();
    }

    delete issues[iri];

    return Promise.resolve();
  };

  this.getIssue = function (iri) {
    if (!(iri in issues)) {
      return Promise.resolve();
    }

    return Promise.resolve(issues[iri]);
  };

  this.getIssuesRaisedBy = function (userIri) {
    return _.values(issues).filter(function (issue) {
      return issue.raisedBy === userIri;
    });
  };

  this.createUser = function (data) {
    return jsonldp.compact(data, {'@context': User['@context']})
      .then(function (data) {
        data['@id'] = nextIri(users, '/hydra/api-demo/users/');

        users[data['@id']] = new User(data, self);

        return Promise.resolve(users[data['@id']]);
      });
  };

  this.deleteUser = function (iri) {
    if (!(iri in users)) {
      return Promise.resolve();
    }

    delete users[iri];

    return Promise.resolve();
  };

  this.getUser = function (iri) {
    if (!(iri in users)) {
      return Promise.resolve();
    }

    return Promise.resolve(users[iri]);
  };

  this.getAuthUser = function (email, password) {
    var authUser = _.values(users)
      .filter(function (user) {
        return user.email === email && user.password === password;
      })
      .shift();

    if (!authUser) {
      return Promise.reject();
    }

    return Promise.resolve(authUser);
  };
};


module.exports = Controller;
