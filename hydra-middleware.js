var
  _ = require('lodash'),
  hydra = require('hydra-core'),
  url = require('url');


hydra.mw = {};


var utils = {};


utils.sendApiHeader = function (apiUrl) {
  return function (req, res, next) {
    var fullUrl = url.format({
      protocol: 'http',
      hostname: req.hostname,
      port: req.socket.localPort,
      pathname: apiUrl
    });

    res.setHeader('Link', '<' + fullUrl + '>; rel="http://www.w3.org/ns/hydra/core#apiDocumentation"');

    next();
  }
};


utils.sendJsonLd = function (res, json) {
  res
    .set('Content-Type', 'application/ld+json')
    .send(JSON.stringify(json));
};


hydra.mw.App = function (apiDef, factory) {
  var self = this;

  if (typeof apiDef === 'string') {
    apiDef = JSON.parse(apiDef);
  }

  this.init = function (app) {
    return hydra.api(apiDef)
      .then(function (api) {
        self.api = api;

        // send API link in header
        app.use(utils.sendApiHeader(self.api.iri));

        // publish API
        app.get(self.api.iri, function (req, res) { utils.sendJsonLd(res, apiDef); });

        // handle operations
        app.use(self.middleware);

        return self;
      });
  };

  this.middleware = function (req, res, next) {
    var methodPropert = '@' + req.method.toLowerCase();

    var object = factory(req.path);

    if (object) {
      var objectPath = object['@id'];
      var propertyPath = req.path.slice(objectPath.length);

      var operation = null;

      if (propertyPath === '') {
        if (methodPropert in object) {
          operation = object[methodPropert].bind(object);
        }
      } else {
        _.keys(object).forEach(function (key) {
          if (_.isObject(object[key]) && '@id' in object[key] && object[key]['@id'] === propertyPath && methodPropert in object[key]) {
            operation = object[key][methodPropert].bind(object);
          }
        });
      }

      if (operation) {
        return operation(req.body)
          .then(function (result) {
            return utils.sendJsonLd(res, result);
          });
      }
    }

    next();
  };
};


hydra.mw.Class = function (iri, type, context) {
  var self = this;

  this['@id'] = iri;
  this['@type'] = type;

  if (typeof context === 'string') {
    this['@context'] = {
      '@vocab': context
    };
  } else {
    this['@context'] = context;
  }

  this['@get'] = function () {
    return Promise.resolve(_.difference(_.keys(self), hydra.mw.Class.propertyBlackList).reduce(function (json, key) {
      if (_.isString(self[key])) {
        json[key] = self[key];
      } else {
        json[key] = _.omit(self[key], hydra.mw.Class.propertyBlackList);
      }

      return json;
    }, {}));
  };
};

hydra.mw.Class.propertyBlackList = ['@delete', '@get', '@post', '@put'];

hydra.mw.Class.buildCollection = function (property, collection) {
  return {
    '@id': property['@id'],
    '@type': 'http://www.w3.org/ns/hydra/core#Collection',
    'http://www.w3.org/ns/hydra/core#member': _.values(collection).map(function (issue) {
      return {
        '@id': issue['@id'],
        '@type': issue['@type']
      };
    })
  };
};


hydra.mw.Factory = function (routing) {
  var self = this;

  this.routing = routing;
  this.objects = {};

  var findRouting = function (iri) {
    for (var i=0; i<self.routing.length; i++) {
      if(self.routing[i].path.test(iri)) {
        return self.routing[i];
      }
    }

    return undefined;
  };

  this.build = function (iri) {
    var routing = findRouting(iri);

    if (!routing) {
      return undefined;
    }

    var result = routing.path.exec(iri);

    if (result && result.length > 1) {
      iri = result[1];
    }

    if (!(iri in self.objects)) {
      self.objects[iri] = new routing.Class(iri);
    }

    return self.objects[iri];
  };
};


module.exports = hydra.mw;
