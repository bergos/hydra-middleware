var
  _ = require('lodash'),
  basicAuth = require('basic-auth'),
  hydra = require('hydra-core'),
  path = require('path'),
  url = require('url'),
  util = require('util');


var hydramw = {};

var utils = hydramw.utils = {};


utils.ForbiddenError = function (message) {
  Error.call(this);

  this.message = message;
  this.statusCode = 403;
};

util.inherits(utils.ForbiddenError, Error);


utils.NotFoundError = function (message) {
  Error.call(this);

  this.message = message;
  this.statusCode = 404;
};

util.inherits(utils.NotFoundError, Error);


utils.ConflictError = function (message) {
  Error.call(this);

  this.message = message;
  this.statusCode = 409;
};

util.inherits(utils.ConflictError, Error);


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


hydramw.Class = function (properties) {
  var self = this;

  _.keys(properties).forEach(function (property) {
    self[property] = properties[property];
  });

  self['@get'] = hydramw.Class.prototype['@get'];
};



hydramw.Class.prototype['@get'] = function () {
  var copyJsonLdProperties = function (object, root) {
    if (!object) {
      return null;
    }

    // extend @id property to full path
    if ('@id' in object) {
      root = path.join(root || '', object['@id']);
    }

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

      // use full path
      if (key === '@id') {
        value = root;
      }

      if (_.isString(value)) {
        json[key] = value;
      } else {
        json[key] = copyJsonLdProperties(value, root);
      }

      return json;
    }, {});
  };

  return Promise.resolve(copyJsonLdProperties(this));
};


hydramw.Middleware = function (apiDef, factory) {
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

  var getObjectPath = function (fullPath, objectIri) {
    var objectPath = url.parse(objectIri).path;

    if (objectPath.slice(0, 1) !== '/') {
      objectPath = path.join(fullPath, objectPath);
    }

    return objectPath;
  };

  var getPropertyPath = function (fullPath, objectPath) {
    var propertyPath = fullPath.slice(objectPath.length);

    // remove leading /
    if (propertyPath.slice(0, 1) === '/') {
      propertyPath = propertyPath.slice(1);
    }

    return propertyPath;
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
      .then(function (object) {
        // split path into object and property path
        var objectPath = getObjectPath(req.path, object['@id']);
        var propertyPath = getPropertyPath(req.path, objectPath);

        // search for operation
        var operation = findOperation(object, objectPath, propertyPath, req.method);

        if (!operation) {
          return Promise.reject(new utils.NotFoundError('operation not found'));
        }

        // options for the operation call
        var options = {};

        // add credentials, if available
        var credentials = basicAuth(req);

        if (credentials) {
          options.user = credentials.name;
          options.password = credentials.pass;
        }

        // call operation
        return operation(req.body, options)
          .then(function (result) {
            if (result) {
              // send JSON-LD response if there is any result
              return utils.sendJsonLd(res, result);
            } else {
              // or no content status code
              return res.status(204).send();
            }
          });
      })
      .catch(function (error) {
        // handle error -> default internal server error
        message = error.message || 'internal server error';
        statusCode = error.statusCode || 500;
        stack = error.stack || message;

        // call next on not found
        if (statusCode === 404) {
          return next();
        }

        console.error(stack);

        res.status(statusCode).send(message);
      })
  };
};


hydramw.Factory = function (routing) {
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
      return Promise.reject(new utils.NotFoundError('no routing for <' + iri + '>'));
    }

    var result = routing.path.exec(iri);

    if (result && result.length > 1) {
      iri = result[1];
    }

    return routing.factory(iri);
  };
};


module.exports = hydramw;
