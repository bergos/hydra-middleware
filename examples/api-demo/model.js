var
  _ = require('lodash'),
  hydramw = require('../../hydra-middleware');


var EntryPoint = hydramw.createClass({
  '@context': {
    '@vocab': 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#EntryPoint/'
  },
  '@type':'http://www.markus-lanthaler.com/hydra/api-demo/vocab#EntryPoint',
  init: function (iri, controller) {
    this['@id'] = iri;

    this.controller = controller;
    this.controller['@omit'] = true;
  },
  issues: {
    '@id': 'issues/',
    '@get': function () {
      var self = this;

      return Promise.resolve(hydramw.buildCollection(self.issues['@id'], self.controller.issues));
    },
    '@post': function (issue, options) {
      var self = this;

      return self.controller.getAuthUser(options.user, options.password)
        .then(function (user) {
          issue.raisedBy = user['@id'];

          return self.controller.createIssue(issue)
        })
        .then(function (issue) {
          return issue['@get']();
        });
    }
  },
  registerUser: {
    '@id': 'users/',
    '@post': function (user) {
      var self = this;

      return self.controller.createUser(user)
        .then(function (user) {
          return user['@get']();
        });
    }
  },
  users: {
    '@id': 'users/',
    '@get': function () {
      var self = this;

      return Promise.resolve(hydramw.buildCollection(self.users['@id'], self.controller.users));
    }
  }
});


var Issue = hydramw.createClass({
  '@context': {
    '@vocab': 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#Issue/'
  },
  '@type': 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#Issue',
  init: function (data, controller) {
    this.description = data.description;
    this.isOpen = data.isOpen;
    this.title = data.title;
    this.raisedBy = data.raisedBy;

    this.controller = controller;
    this.controller['@omit'] = true;
  },
  '@delete': function () {
    var self = this;

    return self.controller.deleteIssue(self['@id']);
  },
  '@put': function (issue) {
    var self = this;

    return jsonldp.compact(issue, self['@context'])
      .then(function (issue) {
        self.controller.issues[self['@id']] = issue;

        return issue;
      });
  }
});


var User = hydramw.createClass({
  '@context': {
    '@vocab': 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#User/'
  },
  '@type': 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#User',
  init: function (data, controller) {
    this.email = data.email;
    this.name = data.name;
    this.password = data.password;

    this.controller = controller;
    this.controller['@omit'] = true;
  },
  '@delete': function () {
    var self = this;

    return self.controller.deleteUser(this['@id']);
  },
  '@put': function (user) {
    var self = this;

    return jsonldp.compact(user, self['@context'])
      .then(function (user) {
        self.controller.users[self['@id']] = user;

        return user;
      });
  },
  raisedIssues: {
    '@id': 'raised_issues/',
    '@get': function () {
      var self = this;

      return Promise.resolve(hydramw.buildCollection(
        self.raised_issues,
        self.controller.getIssuesRaisedBy(self['@id'])));
    }
  }
});


module.exports = {
  EntryPoint: EntryPoint,
  Issue: Issue,
  User: User
};
