var
  _ = require('lodash'),
  hydramw = require('../../hydra-middleware'),
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

  this.createIssue = function (data, options) {
    return jsonldp.compact(data, {'@context': Issue['@context']})
      .then(function (data) {
        // check if user is authenticated
        return self.checkAuth(options.user, options.password)
          .then(function (user) {
            data.raisedBy = user['@id'];
          })
          .then(function () {
            data['@id'] = nextIri(issues, '/hydra/api-demo/issues/');

            issues[data['@id']] = new Issue(data, self);

            return Promise.resolve(issues[data['@id']]);
          });
      });
  };

  this.deleteIssue = function (iri) {
    if (!(iri in issues)) {
      return Promise.reject(new hydramw.utils.NotFoundError('issue <' + iri + '> doesn\'nt exist'));
    }

    delete issues[iri];

    return Promise.resolve();
  };

  this.getIssue = function (iri) {
    if (!(iri in issues)) {
      return Promise.reject(new hydramw.utils.NotFoundError('issue <' + iri + '> doesn\'nt exist'));
    }

    return Promise.resolve(issues[iri]);
  };

  this.getIssuesByRaisedBy = function (userIri) {
    return _.values(issues).filter(function (issue) {
      return issue.raisedBy === userIri;
    });
  };

  this.createUser = function (data) {
    return jsonldp.compact(data, {'@context': User['@context']})
      .then(function (data) {
        // check if there is already a user with the same email
        if (self.getUserByEmail(data.email)) {
          return Promise.reject(new hydramw.utils.ConflictError('emails is already in use'));
        }

        data['@id'] = nextIri(users, '/hydra/api-demo/users/');

        users[data['@id']] = new User(data, self);

        return Promise.resolve(users[data['@id']]);
      });
  };

  this.deleteUser = function (iri) {
    if (!(iri in users)) {
      return Promise.reject(new hydramw.utils.NotFoundError('user <' + iri + '> doesn\'nt exist'));
    }

    delete users[iri];

    return Promise.resolve();
  };

  this.getUser = function (iri) {
    if (!(iri in users)) {
      return Promise.reject(new hydramw.utils.NotFoundError('user <' + iri + '> doesn\'nt exist'));
    }

    return Promise.resolve(users[iri]);
  };

  this.getUserByEmail = function (email) {
    return _.values(users)
      .filter(function (user) {
        return user.email === email;
      })
      .shift();
  };

  this.checkAuth = function (email, password) {
    var user = _.values(users)
      .filter(function (user) {
        return user.email === email && user.password === password;
      })
      .shift();

    if (!user) {
      return Promise.reject(new hydramw.utils.ForbiddenError('authentiation required'));
    }

    return Promise.resolve(user);
  };
};


module.exports = Controller;
