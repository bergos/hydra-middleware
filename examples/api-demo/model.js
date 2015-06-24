var
  hydra = require('hydra-core'),
  jsonldp = require('jsonld').promises(),
  path = require('path');


var Model = function () {
  this.init = function (api) {
    this.api = api;
  };

  this.createEntryPoint = function (iri, controller) {
    var entryPointClass = this.api.findClass(Model.ns.EntryPoint);

    return hydra.model.create(entryPointClass, {
      '@context': Model.ns.EntryPointContext,
      '@id': iri,

      issues: {
        '@id': path.join(iri, 'issues/'),
        '@get': function () {
          return hydra.utils.collection(this.issues['@id'], controller.getIssues());
        },
        '@post': function (issue, options) {
          return controller.createIssue(issue, options);
        }
      },

      registerUser: {
        '@id': path.join(iri, 'users/'),
        '@post': function (user) {
          return controller.createUser(user);
        }
      },

      users: {
        '@id': path.join(iri, 'users/'),
        '@get': function () {
          return hydra.utils.collection(this.users['@id'], controller.getUsers());
        }
      }
    });
  };

  this.createIssue = function (data, controller) {
    var issueClass = this.api.findClass(Model.ns.Issue);

    return jsonldp.compact(data, Model.ns.IssueContext)
      .then(function (data) {
        return hydra.model.create(issueClass, {
          '@context': Model.ns.IssueContext,
          '@id': data['@id'],

          description: data.description,
          isOpen: data.isOpen,
          title: data.title,
          raisedBy: data.raisedBy,

          '@delete': function () {
            return controller.deleteIssue(this['@id']);
          }
        });
      });
  };

  this.createUser = function (data, controller) {
    var userClass = this.api.findClass(Model.ns.User);

    return jsonldp.compact(data, Model.ns.UserContext)
      .then(function (data) {
        return hydra.model.create(userClass, {
          '@context': Model.ns.UserContext,
          '@id': data['@id'],

          email: data.email,
          name: data.name,
          password: data.password,

          '@delete': function () {
            return controller.deleteUser(this['@id']);
          },

          raisedIssues: {
            '@id': path.join(data['@id'], 'raised_issues'),
            '@get': function () {
              return hydra.utils.collection(this.raisedIssues['@id'], controller.getIssuesByRaisedBy(this['@id']));
            }
          }
        });
      });
  };
};


Model.ns = {
  EntryPoint: 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#EntryPoint',
  EntryPointContext: {'@vocab': 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#EntryPoint/'},
  Issue: 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#Issue',
  IssueContext: {'@vocab': 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#Issue/'},
  User: 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#User',
  UserContext: {'@vocab': 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#User/'}
};


module.exports = Model;
