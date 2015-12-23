var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var userNumber = 0;
var allOperationsThusFar = [];

app.get('/catchup-plz', function(req, res){
  res.send(JSON.stringify(allOperationsThusFar));
});

app.get('/user-number-plz', function(req, res){
  userNumber = userNumber + 1;
  res.send("" + userNumber);
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

io.on('connection', function(socket){
  socket.on('modification', function(msg){
    socket.broadcast.emit('modification', msg);
    allOperationsThusFar.push(msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
