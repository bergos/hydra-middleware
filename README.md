# hydra-middleware

Middleware for [Hydra](http://www.hydra-cg.com/) hypermedia-driven Web APIs.

## Usage

The package contains different middleware functions to publish the Hydra API and handle API request.

### Classes

All API requests are handled by Hydra classes.
An existing class can be easily converted to a Hydra class by inheriting from the SimpleRDF class.
Please have a look at the [SimpleRDF documentation](https://github.com/simplerdf/simplerdf), if you are unfamiliar with that package.
Methods can be attached directly to the class or properties.
The method names are the same as the lower case HTTP methods (e.g. `.get`, `.put`, ...).

    // load the SimpleRDF class
    var SimpleRDF = require('simplerdf/lite').SimpleRDF

    // create the HydraClass and inherit from SimpleRDF
    function HydraClass() {}

    utils.inherits(HydraClass, SimpleRDF)

    // attach the methods

    HydraClass.prototype.get = function () {
      return this
    }

    HydraClass.prototype.put = function (input) {
       // handle SimpleRDF input object
    }

### API Header

Hydra requires an additional HTTP header that points to the [API Documentation](http://www.w3.org/ns/hydra/core#apiDocumentation).
This module adds the Link header.
The only parameter is the URL to the API Documentation.

    var apiHeader = require('hydra-middleware/api-header')

    app.use(apiHeader('/vocab')


If you also want to host the API Documentation in your application you can use the `rdf-serve-static` package.

    var formats = require('rdf-formats-common')()
    var serve = require('rdf-serve-static')

    app.use(serve('folder-that-contains-the-vocab-file', formats))

### Object

To host single instances of Hydra classes the `object` middleware can be used.
It requires the object instance and the SimpleRDF context, that should be used for the requests.

    var object = require('hydra-middleware/object')

    app.use('/path-to-object', object(instance, context))

### Factory

The `factory` middlware can be used if you don't want to store all Hydra objects in memory.
The factory function is called on each request.
It should return the Hydra object for the requested IRI.

    var factory = require('hydra-middleware/factory')

    function objectBuilder (iri) {
      return instance
    }

    app.use(factory(objectBuilder)

## Examples

The examples folder contains examples how to use the middleware.
