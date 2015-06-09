global.Promise = require('es6-promise').Promise;


var
  bodyParser = require('body-parser'),
  express = require('express'),
  fs = require('fs'),
  hydramw = require('../../hydra-middleware'),
  morgan = require('morgan'),
  Controller = require('./controller');


var controller = new Controller();

var factoryRouting = [{
  path: RegExp('^(/hydra/api-demo/)$'),
  factory : controller.getEntryPoint
},{
  path: RegExp('^(/hydra/api-demo/)issues/$'),
  factory : controller.getEntryPoint
},{
  path: RegExp('^(/hydra/api-demo/)users/$'),
  factory : controller.getEntryPoint
},{
  path: RegExp('^(/hydra/api-demo/issues/[0-9]*).*'),
  factory: controller.getIssue
},{
  path: RegExp('^(/hydra/api-demo/users/[0-9]*).*'),
  factory: controller.getUser
}];

var factory = new hydramw.Factory(factoryRouting);
var middleware = new hydramw.Middleware(fs.readFileSync(__dirname + '/api.json').toString(), factory.build);

var app = express();

app.use(morgan('combined'));
app.use(bodyParser.json({type: 'application/ld+json'}));


middleware.use(app)
  .then(function() {
    app.listen(8080);

    console.log('listening on http://localhost:8080');
  })
  .catch(function (error) {
    console.error(error.stack);
  });
