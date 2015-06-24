var
  _ = require('lodash'),
  basicAuth = require('basic-auth'),
  express = require('express'),
  hydra = require('hydra-core'),
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


hydramw.Middleware = function (apiDef, options) {
  var self = this;

  options = options || {};

  var findOperation = function (object, objectPath, fullPath, method) {
    method = '@' + method.toLowerCase();

    if (fullPath === object['@id'] || fullPath === object['@id']+'/') {
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

  var getObjectPath = function (fullPath, regex) {
    var objectPath = regex.exec(fullPath);

    if (objectPath.length < 2) {
      throw utils.NotFoundError('RegExp contains no group');
    }

    return objectPath[1];
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
    self.router = express.Router({strict: true});

    // add routings if options contains already a list
    if (options.routings) {
      options.routings.forEach(function (routing) {
        self.addRouting(routing);
      });
    }

    // add own router
    app.use(path, self.router);

    return self;
  };

  this.addRouting = function (routing) {
    self.router.use(routing.path, self.middleware.bind(self, routing));
  };

  this.middleware = function (routing, req, res, next) {
    var fullPath = req.originalUrl;
    var objectPath = getObjectPath(fullPath, routing.path);

    Promise.resolve()
      .then(function () {
        return routing.factory(objectPath);
      })
      .then(function (object) {
        // search for operation
        var operation = findOperation(object, objectPath, fullPath, req.method);

        if (!operation) {
          throw new utils.NotFoundError('operation not found');
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
