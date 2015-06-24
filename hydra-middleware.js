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
  json = typeof json === 'string' ? JSON.parse(json) : json;

  if ('@id' in json) {
    //TODO: expand and search for non blank node subject
    res.setHeader('Content-Location', json['@id']);
  }

  res.set('Content-Type', 'application/ld+json').send(JSON.stringify(json));
};


hydramw.Middleware = function (apiDef, factory) {
  var self = this;

  var findOperation = function (object, objectPath, fullPath, method) {
    method = '@' + method.toLowerCase();

    if (fullPath === object['@id']) {
      if (method in object) {
        return object[method].bind(object);
      }
    } else {
      return _.values(object)
        .filter(function (property) {
          return _.isObject(property) && '@id' in property && property['@id'] === fullPath && method in property;
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

  this.init = function () {
    return hydra.api(apiDef)
      .then(function (api) {
        self.api = api;

        return self;
      });
  };

  this.use = function (path, app) {
    if (arguments.length === 1) {
      app = path;
      path = '/';
    }

    // send API link in header
    app.use(path, utils.sendApiHeader(self.api.iri));

    // publish API
    app.get(self.api.iri, function (req, res) {
      utils.sendJsonLd(res, apiDef);
    });

    // handle operations
    app.use(path, self.middleware);

    return self;
  };

  this.middleware = function (req, res, next) {
    Promise.resolve()
      .then(function () {
        return factory(req.path);
      })
      .then(function (object) {
        // remove property part of path
        var objectPath = getObjectPath(req.path, object['@id']);

        // search for operation
        var operation = findOperation(object, objectPath, req.path, req.method);

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
        return Promise.resolve()
          .then(function () {
            return operation.call(object, req.body, options)
          })
          .then(function (result) {
            if (result) {
              if (result.toJSON) {
                result = result.toJSON();
              }

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
      throw new utils.NotFoundError('no routing for <' + iri + '>');
    }

    var result = routing.path.exec(iri);

    if (result && result.length > 1) {
      iri = result[1];
    }

    return routing.factory(iri);
  };
};


hydra.defaults.model.createInvoke = function (operation) {
  if (operation.method === 'GET') {
    return function () {
      return Promise.resolve(this.toJSON());
    };
  }

  return function () {
    console.error('not implemented');
  };
};


module.exports = hydramw;
