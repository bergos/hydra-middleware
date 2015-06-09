var
  _ = require('lodash'),
  hydra = require('hydra-core'),
  hydramw = require('../../hydra-middleware'),
  path = require('path');


var EntryPoint = function (iri, controller) {
  var self = this;

  hydramw.Class.call(this, {
    '@context': EntryPoint['@context'],
    '@type': EntryPoint['@type'],
    '@id': iri
  });

  this.issues = {
    '@id': 'issues/',
    '@get': function () {
      return Promise.resolve(hydra.utils.collection(self.issues['@id'], controller.issues));
    },
    '@post': function (issue, options) {
      return controller.createIssue(issue, options)
        .then(function (issue) {
          return issue['@get']();
        });
    }
  };

  this.registerUser = {
    '@id': 'users/',
    '@post': function (user) {
      return controller.createUser(user)
        .then(function (user) {
          return user['@get']();
        });
    }
  };

  this.users = {
    '@id': 'users/',
    '@get': function () {
      return Promise.resolve(hydra.utils.collection(self.users['@id'], controller.users));
    }
  };
};

EntryPoint['@context'] = {
  '@vocab': 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#EntryPoint/'
};

EntryPoint['@type'] = 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#EntryPoint';


var Issue = function (data, controller) {
  var self = this;

  hydramw.Class.call(this, {
    '@context': Issue['@context'],
    '@type': Issue['@type'],
    '@id': data['@id']
  });

  this.description = data.description;
  this.isOpen = data.isOpen;
  this.title = data.title;
  this.raisedBy = data.raisedBy;

  this['@delete'] = function () {
    return controller.deleteIssue(self['@id']);
  };

  this['@put'] = function (issue) {
    return jsonldp.compact(issue, self['@context'])
      .then(function (issue) {
        controller.issues[self['@id']] = issue;

        return issue['@get']();
      });
  };
};

Issue['@context'] = {
  '@vocab': 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#Issue/'
};

Issue['@type'] = 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#Issue';


var User = function (data, controller) {
  var self = this;

  hydramw.Class.call(this, {
    '@context': User['@context'],
    '@type': User['@type'],
    '@id': data['@id']
  });

  this.email = data.email;
  this.name = data.name;
  this.password = data.password;

  this['@delete'] = function () {
    return controller.deleteUser(this['@id']);
  };

  this['@put'] = function (user) {
    return jsonldp.compact(user, self['@context'])
      .then(function (user) {
        controller.users[self['@id']] = user;

        return user['@get']();
      });
  };

  this.raisedIssues = {
    '@id': 'raised_issues',
    '@get': function () {
      return Promise.resolve(hydra.utils.collection(
        path.join(self['@id'], self.raisedIssues['@id']),
        controller.getIssuesByRaisedBy(self['@id'])));
    }
  };
};

User['@context'] = {
  '@vocab': 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#User/'
};

User['@type'] = 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#User';


module.exports = {
  EntryPoint: EntryPoint,
  Issue: Issue,
  User: User
};
