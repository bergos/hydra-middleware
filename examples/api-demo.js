global.Promise = require('es6-promise').Promise;


var
  _ = require('lodash'),
  bodyParser = require('body-parser'),
  express = require('express'),
  fs = require('fs'),
  jsonld = require('jsonld'),
  jsonldp = jsonld.promises(),
  hydramw = require('../hydra-middleware'),
  morgan = require('morgan');


var
  app = express();


app.use(morgan('combined'));
app.use(bodyParser.json({type: 'application/ld+json'}));


var store = {};

store.users = {};
store.issues = {};


var EntryPoint = function (iri) {
  var self = this;

  hydramw.Class.call(
    this,
    iri,
    'http://www.markus-lanthaler.com/hydra/api-demo/vocab#EntryPoint',
    'http://www.markus-lanthaler.com/hydra/api-demo/vocab#EntryPoint/');

  console.log('created EntryPoint: ' + iri);
  entryPoint = this;

  var nextIri = function (objects, path) {
    var id = 1;

    var objectToId = function (object) {
      return parseInt(object['@id'].slice(path.length));
    };

    if (!_.isEmpty(objects)) {
      id = objectToId(_.max(_.values(objects), objectToId)) + 1
    }

    return path + id;
  };

  this.issues = {
    '@id': 'issues/',
    '@get': function () {
      return Promise.resolve(hydramw.Class.buildCollection(self.issues, store.issues));
    },
    '@post': function (issue) {
      return jsonldp.compact(issue, {'@context': {'@vocab': 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#Issue/'}})
        .then(function (issue) {
          issue['@id'] = nextIri(store.issues, '/hydra/api-demo/issues/');
          store.issues[issue['@id']] = issue;

          return issue;
        });
    }
  };

  this.registerUser = {
    '@id': 'users/',
    '@post': function (user) {
      return jsonldp.compact(user, {'@context': {'@vocab': 'http://www.markus-lanthaler.com/hydra/api-demo/vocab#User/'}})
        .then(function (user) {
          user['@id'] = nextIri(store.users, '/hydra/api-demo/users/');
          store.users[user['@id']] = user;

          return user;
        });
    }
  };

  this.users = {
    '@id': 'users/',
    '@get': function () {
      return Promise.resolve(hydramw.Class.buildCollection(self.users, store.users));
    }
  };
};


var Issue = function (iri) {
  hydramw.Class.call(
    this,
    iri,
    'http://www.markus-lanthaler.com/hydra/api-demo/vocab#Issue',
    'http://www.markus-lanthaler.com/hydra/api-demo/vocab#Issue/');

  console.log('created Issue: ' + iri);

  this['@delete'] = function () {
    delete store.issues[this['@id']];

    return Promise.resolve();
  };

  this['@put'] = function (issue) {
    return jsonldp.compact(issue, self['@context'])
      .then(function (issue) {
        store.issues[this['@id']] = issue;

        return user;
      });
  };
};


var User = function (iri) {
  var self = this;

  hydramw.Class.call(
    this,
    iri,
    'http://www.markus-lanthaler.com/hydra/api-demo/vocab#User',
    'http://www.markus-lanthaler.com/hydra/api-demo/vocab#User/');

  console.log('created User: ' + iri);

  this['@delete'] = function () {
    delete store.users[this['@id']];

    return Promise.resolve();
  };

  this['@put'] = function (user) {
    return jsonldp.compact(user, self['@context'])
      .then(function (user) {
        store.users[this['@id']] = user;

        return user;
      });
  };

  this.raisedIssues = {
    '@id': 'raised_issues/',
    '@get': function () {
      return Promise.resolve(hydramw.Class.buildCollection(this.raised_issues, store.issues.filter(function (issue) {
        return issue.raisedBy === self['@id'];
      })));
    }
  };
};


var classRouting = [{
  path: RegExp('^(/hydra/api-demo/)$'),
  Class: EntryPoint
},{
  path: RegExp('^(/hydra/api-demo/)issues/$'),
  Class: EntryPoint
},{
  path: RegExp('^(/hydra/api-demo/)users/$'),
  Class: EntryPoint
},{
  path: RegExp('^/hydra/api-demo/issues/.*'),
  Class: Issue
},{
  path: RegExp('^/hydra/api-demo/users/.*'),
  Class: User
}];

var factory = new hydramw.Factory(classRouting);

var hydraApp = new hydramw.App(fs.readFileSync('examples/api-demo.json').toString(), factory.build);


hydraApp.init(app)
  .then(function() {
    app.listen(8080);

    console.log('listening on http://localhost:8080');
  })
  .catch(function (error) {
    console.error(error.stack);
  });
