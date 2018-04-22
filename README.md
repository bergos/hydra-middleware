# hydra-middleware

Middleware for [Hydra](http://www.hydra-cg.com/) hypermedia-driven Web APIs.

## Usage

The package contains different middleware functions to publish the Hydra API and handle API requests.

### Classes

All API requests are handled by Hydra classes.
An existing class can be easily converted to a Hydra class by inheriting from HydraBase, which is based on SimpleRDF.
Please have a look at the [SimpleRDF documentation](https://github.com/simplerdf/simplerdf), if you are unfamiliar with that package.
Methods can be attached directly to the class or properties.
The method names are the same as the lower case HTTP methods (e.g. `.get`, `.put`, ...).

    // load the SimpleRDF class
    const HydraBase = require('hydra-base')

    // create the ExampleClass, inherit from HydraBase and attach methods    
    class ExampleClass extends HydraBase {
      get () {
        return this
      }

      put (input) {
       // handle SimpleRDF input object
      }
    }

Besides the method implementations, a description is required.
HydraBase provides a `fromJSON` function for easy-peasy API descriptions. 

    const apiFromJSON = require('hydra-base/fromJSON')

	ExampleClass.api(apiFromJSON({
	  '@id': 'http://example.org/ExampleClass',
	  label: 'Example Class',
	  supportedOperation: [{
	    method: 'GET',
	    label: 'Retrieves an Example Class',
	    returns: 'http://example.org/ExampleClass'
	  }, {
	    method: 'PUT',
	    label: 'Update an Example Class',
	    expects: 'http://example.org/ExampleClass'
	  }]	  
	}))

### API Header

Hydra requires an additional HTTP header that points to the [API Documentation](http://www.w3.org/ns/hydra/core#apiDocumentation).
The API middleware takes care of that.
It only requires the API documentation (a set of API class descriptions).
HydraBase provides a `documentation` function to create the API documentation.

    const api = require('hydra-middleware/api')
    const apiDocumentation = require('hydra-base/documentation')

    app.use(api(apiDocumentation('http://example.org/api'), [
      ExampleClass
    ])))

### Object

To host single instances of Hydra classes the `object` middleware can be used.
It requires the object instance and the SimpleRDF context, that should be used for the requests.

    const object = require('hydra-middleware/object')

    app.use('/path-to-object', object(instance, context))

### Factory

The `factory` middlware can be used if you don't want to store all Hydra objects in memory.
The factory function is called on each request.
It should return the Hydra object for the requested IRI.

    const factory = require('hydra-middleware/factory')

    app.use(factory(iri => {
      return instance
    })

## Examples

The examples folder contains examples how to use the middleware.
