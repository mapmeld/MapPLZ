
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  ;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { pretty: true });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());

  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.helpers({
    title: 'MapPLZ'
});

// Routes

app.get('/', routes.site.index);

app.get('/users', routes.users.list);
app.post('/users', routes.users.create);
app.get('/users/:id', routes.users.show);
app.post('/users/:id', routes.users.edit);
app.del('/users/:id', routes.users.del);
app.post('/users/:id/follow', routes.users.follow);
app.post('/users/:id/unfollow', routes.users.unfollow);

app.post('/program', routes.program.create);
app.get('/program/xml/:id', routes.program.xmlout);
app.get('/program/history/:id', routes.program.historyout);
app.get('/program/:id', routes.program.show);

app.get('/code-env/from/:id', routes.program.code);
app.get('/code-env', routes.program.code);

app.listen(process.env.PORT || 3000);