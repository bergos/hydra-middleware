var
  _ = require('lodash'),
  hydramw = require('../../hydra-middleware');


var Controller = function (model) {
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
    return model.createEntryPoint(iri, self);
  };

  this.createIssue = function (data, options) {
    return Promise.resolve()
      .then(function () {
        // check if user is authenticated
        return self.checkAuth(options.user, options.password)
      })
      .then(function (user) {
        data.raisedBy = {'@id': user['@id']};
      })
      .then(function () {
        data['@id'] = nextIri(issues, '/hydra/api-demo/issues/');

        return model.createIssue(data, self);
      })
      .then(function (issue) {
        return issues[data['@id']] = issue;
      });
  };

  this.deleteIssue = function (iri) {
    if (!(iri in issues)) {
      throw new hydramw.utils.NotFoundError('issue <' + iri + '> doesn\'t exist');
    }

    delete issues[iri];
  };

  this.getIssue = function (iri) {
    if (!(iri in issues)) {
      throw new hydramw.utils.NotFoundError('issue <' + iri + '> doesn\'t exist');
    }

    return issues[iri];
  };

  this.getIssues = function () {
    return _.values(issues);
  };

  this.getIssuesByRaisedBy = function (userIri) {
    return _.values(issues).filter(function (issue) {
      return issue.raisedBy === userIri;
    });
  };

  this.createUser = function (data) {
    data['@id'] = nextIri(users, '/hydra/api-demo/users/');

    return model.createUser(data, self)
      .then(function (user) {
        // check if there is already a user with the same email
        if (self.getUserByEmail(user.email)) {
          throw new hydramw.utils.ConflictError('emails is already in use');
        }

        return users[user['@id']] = user;
      });
  };

  this.deleteUser = function (iri) {
    if (!(iri in users)) {
      throw new hydramw.utils.NotFoundError('user <' + iri + '> doesn\'t exist');
    }

    delete users[iri];
  };

  this.getUser = function (iri) {
    if (!(iri in users)) {
      throw new hydramw.utils.NotFoundError('user <' + iri + '> doesn\'t exist');
    }

    return users[iri];
  };

  this.getUsers = function () {
    return _.values(users);
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
      throw new hydramw.utils.ForbiddenError('authentiation required');
    }

    return user;
  };
};


module.exports = Controller;
