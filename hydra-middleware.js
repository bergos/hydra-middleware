var
  _ = require('lodash'),
  basicAuth = require('basic-auth'),
  hydra = require('hydra-core'),
  url = require('url');


hydra.mw = {};


var utils = {};


utils.sendApiHeader = function (apiUrl) {
  return function (req, res, next) {
    /*var fullUrl = url.format({
      protocol: 'http',
      hostname: req.hostname,
      port: req.socket.localPort,
      pathname: apiUrl
    });

    res.setHeader('Link', '<' + fullUrl + '>; rel="http://www.w3.org/ns/hydra/core#apiDocumentation"');*/
    res.setHeader('Link', '<' + apiUrl + '>; rel="http://www.w3.org/ns/hydra/core#apiDocumentation"');

    next();
  }
};


utils.sendJsonLd = function (res, json) {
  var text = typeof json !== 'string' ? JSON.stringify(json) : json;

  res.set('Content-Type', 'application/ld+json').send(text);
};


hydra.mw.createClass = function (properties) {
  var hydraClass = function (data) {
    var self = this;

    if (_.isObject(data) && '@id' in data) {
      self['@id'] = data['@id'].toString();
    }

    self['@get'] = function () {
      var omitFunctions = function (object) {
        return _.keys(object).reduce(function (json, key) {
          var value = object[key];

          // don't add function properties
          if (_.isFunction(value)) {
            return json;
          }

          // don't add properties with @omit flag
          if (_.isObject(value) && '@omit' in value && value['@omit']) {
            return json;
          }

          if (_.isString(value)) {
            json[key] = value;
          } else {
            json[key] = omitFunctions(value);
          }

          return json;
        }, {});
      };

      return Promise.resolve(omitFunctions(self));
    };

    _.keys(properties).forEach(function (property) {
      self[property] = properties[property];
    });

    if (properties.init) {
      properties.init.apply(self, arguments);
    }
  };

  if ('@context' in properties) {
    hydraClass['@context'] = properties['@context'];
  }

  if ('@type' in properties) {
    hydraClass['@type'] = properties['@type'];
  }

  return hydraClass;
};


hydra.mw.buildCollection = function (iri, collection) {
  return {
    '@id': iri,
    '@type': 'http://www.w3.org/ns/hydra/core#Collection',
    'http://www.w3.org/ns/hydra/core#member': _.values(collection).map(function (member) {
      return {
        '@id': member['@id'],
        '@type': member['@type']
      };
    })
  };
};


hydra.mw.Middleware = function (apiDef, factory) {
  var self = this;

  var findOperation = function (object, objectPath, propertyPath, method) {
    method = '@' + method.toLowerCase();

    if (_.isEmpty(propertyPath)) {
      if (method in object) {
        return object[method].bind(object);
      }
    } else {
      return _.values(object)
        .filter(function (property) {
          return _.isObject(property) && '@id' in property && property['@id'] === propertyPath && method in property;
        })
        .map(function (property) {
          return property[method].bind(object);
        })
        .shift();
    }
  };

  this.use = function (path, app) {
    if (arguments.length === 1) {
      app = path;
      path = '/';
    }

    return hydra.api(apiDef)
      .then(function (api) {
        self.api = api;

        // send API link in header
        app.use(path, utils.sendApiHeader(self.api.iri));

        // publish API
        app.get(self.api.iri, function (req, res) {
          utils.sendJsonLd(res, apiDef);
        });

        // handle operations
        app.use(path, self.middleware);

        return self;
      });
  };

  this.middleware = function (req, res, next) {
    factory(req.path)
      .then(function (result) {
        // no route found
        if (!result) {
          return next();
        }

        var object = result.object;
        var objectPath = result.base;

        // no object found
        if (!object) {
          return next();
        }

        var propertyPath = req.path.slice(objectPath.length);

        // remove leading /
        if (propertyPath.indexOf('/') === 0) {
          propertyPath = propertyPath.slice(1);
        }

        var operation = findOperation(object, objectPath, propertyPath, req.method);
        var credentials = basicAuth(req);
        var options = {};

        if (credentials) {
          options.user = credentials.name;
          options.password = credentials.pass;
        }

        if (!operation) {
          return next();
        }

        return operation(req.body, options)
          .then(function (result) {
            if (result) {
              return utils.sendJsonLd(res, result);
            } else {
              return res.status(204).send();
            }
          });
      })
      .catch(function (error) {
        error = error || 'internal server error';

        if (error.stack) {
          console.error(error.stack);
        } else {
          console.error(error);
        }

        res.status(500).send(error);
      })
  };
};


hydra.mw.createMiddleware = function (apiDef, factory) {
  return new hydra.mw.Middleware(apiDef, factory);
};


hydra.mw.Factory = function (routing) {
  var self = this;

  this.routing = routing;

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

    return routing.factory(iri)
      .then(function (object) {
        return {
          base: iri,
          object: object
        };
      });
  };
};


hydra.mw.createFactory = function (routing) {
  return new hydra.mw.Factory(routing);
};


module.exports = hydra.mw;
