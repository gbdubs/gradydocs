var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var userNumbersUnused = []
var userNumbers = {};
var theLog = {};

function GET_USER_NUMBER (docUuid) {
	if (userNumbers[docUuid] == undefined){
		userNumbers[docUuid] = 1;
		return 1;
	} else {
		userNumbers[docUuid]++;
		return userNumbers[docUuid];
	}
}

function LOG (docUuid, msg){
	if (theLog[docUuid] == undefined){
		theLog[docUuid] = [];
	}
	theLog[docUuid].push(msg);
}

function GET_LOG (docUuid) {
	return JSON.stringify(theLog[docUuid]);
}

function getDocUuid (req) {
	return req.url.substring(req.url.lastIndexOf("/"));
}

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

app.get(/\/catchup-plz\/.*/, function(req, res){
  var docUuid = getDocUuid(req);
  console.log("DOCID: " + docUuid); 
  res.send(GET_LOG(docUuid));
});

app.get('/user-number-plz', function(req, res){
  res.send("" + GET_USER_NUMBER);
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

io.on('connection', function(socket){
  socket.join('someroom');

  socket.on('modification', function(msg){
  	var parsed = JSON.parse(msg);
  	var docUuid = parsed.docUuid;
  	console.log("DOCUUUID = ["+docUuid+"]");
    socket.broadcast.emit('modification', msg);
    allOperationsThusFar.push(msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
