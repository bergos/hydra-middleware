var
  bodyParser = require('body-parser'),
  cors = require('cors'),
  express = require('express'),
  fs = require('fs'),
  hydramw = require('../../hydra-middleware'),
  morgan = require('morgan'),
  Controller = require('./controller'),
  Model = require('./model');


var model = new Model();
var controller = new Controller(model);


var routings = [{
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


var middleware = new hydramw.Middleware(fs.readFileSync(__dirname + '/api.json').toString(), {
  routings: routings
});


var app = express();


app.use(cors({
  allowedHeaders: ['Authorization', 'Content-Type'],
  exposedHeaders: ['Content-Location', 'Link']
}));
app.use(morgan('combined'));
app.use(bodyParser.json({type: 'application/ld+json'}));


middleware.init()
  .then(function () {
    return model.init(middleware.api);
  })
  .then(function () {
    return middleware.use(app);
  })
  .then(function() {
    app.listen(8080);

    console.log('listening on http://localhost:8080');
  })
  .catch(function (error) {
    console.error(error.stack);
  });
