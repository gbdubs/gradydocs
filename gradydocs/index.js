var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var userNumbersUnused = []
var userNumber = 0;
var allOperationsThusFar = [];
/*
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');





// Connection URL
var url = 'mongodb://localhost:27017/myproject';
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");

  db.close();
});

*/

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
