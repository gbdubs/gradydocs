var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Database Connection URL
var databaseUrl = 'mongodb://localhost:27017/myproject';

var userNumbers = {};
var theLog = {};
var editsSinceLastSave = {};

function GET_USER_NUMBER (docUuid, callback) {
	if (userNumbers[docUuid] == undefined){
    LOAD_DOCUMENT(docUuid, function() {
      userNumbers[docUuid]++;
      callback(userNumbers[docUuid]);
    });
	} else {
    userNumbers[docUuid]++;
		callback(userNumbers[docUuid]);
	}
}

function LOG (docUuid, msg){
	if (theLog[docUuid] == undefined){
		theLog[docUuid] = [];
	}
	theLog[docUuid].push(msg);
  CONSIDER_A_SAVE(docUuid);
}

function GET_LOG (docUuid, callback) {
  var log = theLog[docUuid];
  if (log == undefined){
    LOAD_DOCUMENT(docUuid, function(){
      callback(theLog[docUuid]);
    });
  } else {
    callback(theLog[docUuid]);
  }
}

function CONSIDER_A_SAVE (docUuid){
  if (editsSinceLastSave[docUuid] == undefined){
    editsSinceLastSave[docUuid] = 0;
  }
  editsSinceLastSave[docUuid]++;

  if (editsSinceLastSave[docUuid] % 50 == 0){
    SAVE_DOCUMENT(docUuid);
  }
}

function SAVE_DOCUMENT (docUuid){

  var data = {
    userNumber : userNumbers[docUuid],
    log: theLog[docUuid]
  }

  MongoClient.connect(databaseUrl, function(err, db) {
    assert.equal(null, err);
    var collection = db.collection('documents');
    collection.update({ _id : docUuid }, {$set : data}, {upsert : true}, function (err, result){
      assert.equal(err, null);
      console.log("Saved Document with id ["+docUuid+"] into the document collection.");
      db.close();
    });
  });
}

function LOAD_DOCUMENT (docUuid, callback) {
  MongoClient.connect(databaseUrl, function(err, db) {
    assert.equal(null, err);
    var collection = db.collection('documents');
    collection.find({ _id : docUuid }).toArray(function(err, docs){
      assert.equal(err, null);
      
      if (docs.length == 0){
        console.log("Did not find a document with id: " + docUuid + ", so I set the state vars to be new.");
        userNumbers[docUuid] = 1;
        theLog[docUuid] = [];
        callback();
        return;
      }

      var resultingDocument = docs[0];

      //db.close();

      console.log("Successfully retrieved document "+(docs.length)+" with id: " + docUuid + ", and updated state vars.");
      userNumbers[docUuid] = resultingDocument.userNumber;
      console.log("   N USERS = " + userNumbers[docUuid]);
      theLog[docUuid] = resultingDocument.log;
      console.log("   LOG LEN = " + theLog[docUuid].length);
      callback();
    });
  });
}

function getDocUuid (req) {
	return req.url.substring(req.url.lastIndexOf("/")+1);
}

  ///////////////////////////////
 // URL PATTERNS + PROCEDURES //
///////////////////////////////

app.get(/^\/catchup-plz\/.*/, function(req, res){
  GET_LOG(getDocUuid(req), function (log){
    res.send(JSON.stringify(log));
  });
});

app.get(/^\/user-number-plz\/.*/, function(req, res){
  GET_USER_NUMBER(getDocUuid(req), function(user_no){
    res.send(""+user_no);
  });
});

app.get(/^\/edit\/.*/, function(req, res){
  res.sendFile(__dirname + '/document.html');
});

app.get(/^\/new$/, function(req, res){
  res.sendFile(__dirname + '/new.html');
});

app.get(/^\/$/, function(req, res){
  res.sendFile(__dirname + '/landing.html');
});

app.get(/^\/proposed-doc-id/, function(req, res){
  var proposedName = req.query.docid;
  //console.log("PROPOSED NAME " + req.query.docid);
  if (userNumbers[proposedName] == undefined){
    res.send("YES");
  } else {
    res.send("NO");
  }
});

app.use(express.static('public'));

io.on('connection', function(socket){
  
  socket.on('joining', function(docUuid){
    socket.join(docUuid);
  });

  socket.on('modification', function(msg){
  	var parsed = JSON.parse(msg);
  	var docUuid = parsed.docUuid;
    //console.log("Message Logged to ["+docUuid+"]")
    LOG(docUuid, msg);
    socket.broadcast.to(docUuid).emit('modification', msg);
  });

});

http.listen(8081, function(){
  console.log('listening on *:8081');
});








