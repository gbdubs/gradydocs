var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

io.on('connection', function(socket){
  socket.on('modification', function(msg){
    socket.broadcast.emit('modification', msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
