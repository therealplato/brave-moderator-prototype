
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var moment = require('moment');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var rooms = {}; // temp state storage, cleared on script restart

// HTTP ROUTES: 
app.get('/',function(req, res){
  res.render('splash');
});

app.get('/create', function(req, res){
  var buf = require('crypto').pseudoRandomBytes(5);
  var room = buf.toString('hex');
  rooms[room]={
    id: room,
    name: null,
    moderator: null,
    floor: null,
    history: [],
  };
  res.redirect('/room/'+room);
});


app.get('/room/:id', function(req, res){
  var room = rooms[req.params.id];
  if(room == undefined){ return res.send(404) };
  res.locals.room = room;
  res.locals.prettify = function(timestamp){ // template helper function
    var d1 = new Date();
    var d2 = new Date(timestamp);
    if(d1-d2 < 1000*60*60*24*7){ // one week
      return moment(d2).fromNow();
    } else {
      return moment(d2).format("MMM D, YYYY");
    }
  };

  res.render('room');
});

// START HTTP SERVER
var server = require('http').createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// WEBSOCKET ROUTES:
// Listen on same port as app
var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket){
  socket.on('setRoom', function(roomId){
    socket.set('roomId', roomId, function(){
      socket.emit('roomIsSet');
    });
  });
  socket.on('writeUpdate', function(update, done){ 
    console.log('Got an update');
    // writeUpdate is a history object that is being sent by this client
    socket.get('roomId', function(err, roomId){
      var room = rooms[roomId];
      if(room == undefined){ 
        socket.emit('updatePublished', false);
        done('notFound');
      } else {
        console.log('Found room, broadcasting update');
        room.history.push(update);
        socket.broadcast.emit('publishUpdate', update);
        done(null);
      };
    });
  });

});

/*
example rooms object:

  rooms: {
    asdf: {
      moderator: 'Motre',
      floor: 'Motre',
      history: [
        { 
          timestamp: deadbeef,
          author: 'Motre',
          type: 'motion',
          text: 'penis',
        },
        { 
          timestamp: deadbeef,
          author: 'NJ',
          type: 'chat',
          text: 'Hmm i dunno bout that',
        },
        { 
          timestamp: deadbeef,
          author: 'Draleth',
          type: 'vote',
          text: 'no',
        },
        { 
          timestamp: deadbeef,
          author: 'Lquid',
          type: 'floor',
          text: 'IT updates',
        },
      ]
    }
  }
*/


