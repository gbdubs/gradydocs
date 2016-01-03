var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient,
	assert = require('assert');

var useDatabase = false;

// Database Connection URL (for local use only)
var databaseUrl = 'mongodb://localhost:27017/myproject';

var documentCursorIds = {};
var loggedModifications = {};
var editsSinceLastSave = {};

  ///////////////////////////////
 //  State Control Operations //
///////////////////////////////

function getDocUuid(req) {
	return req.url.substring(req.url.lastIndexOf("/") + 1);
}

function getNewUserCursorId(docUuid, callback) {
	if (documentCursorIds[docUuid] == undefined) {
		if (useDatabase){
			loadDocument(docUuid, function() {
				documentCursorIds[docUuid]++;
				callback(documentCursorIds[docUuid]);
			});
		} else {
			documentCursorIds[docUuid] = 1;
			callback(documentCursorIds[docUuid]);
		}
	} else {
		documentCursorIds[docUuid]++;
		callback(documentCursorIds[docUuid]);
	}
}

function logModification(docUuid, msg) {
	if (loggedModifications[docUuid] == undefined) {
		loggedModifications[docUuid] = [];
	}
	loggedModifications[docUuid].push(msg);
	if (useDatabase){
		considerSavingDocument(docUuid);
	}
}

function getLoggedModifications(docUuid, callback) {
	var log = loggedModifications[docUuid];
	if (log == undefined) {
		if (useDatabase){
			loadDocument(docUuid, function() {
				callback(loggedModifications[docUuid]);
			});
		} else {
			loggedModifications[docUuid] = [];
			callback(loggedModifications[docUuid]);
		}
	} else {
		callback(loggedModifications[docUuid]);
	}
}

function considerSavingDocument(docUuid) {
	if (useDatabase){
		if (editsSinceLastSave[docUuid] == undefined) {
			editsSinceLastSave[docUuid] = 0;
		}
		editsSinceLastSave[docUuid]++;

		if (editsSinceLastSave[docUuid] % 50 == 0) {
			saveDocument(docUuid);
		}
	}
}

function saveDocument(docUuid) {
	var data = {
		userNumber: documentCursorIds[docUuid],
		log: loggedModifications[docUuid]
	}

	MongoClient.connect(databaseUrl, function(err, db) {
		assert.equal(null, err);
		var collection = db.collection('documents');
		collection.update({
			_id: docUuid
		}, {
			$set: data
		}, {
			upsert: true
		}, function(err, result) {
			assert.equal(err, null);
			console.log("Saved Document with id [" + docUuid + "] into the document collection.");
			db.close();
		});
	});
}

function loadDocument(docUuid, callback) {
	MongoClient.connect(databaseUrl, function(err, db) {
		assert.equal(null, err);
		var collection = db.collection('documents');
		collection.find({
			_id: docUuid
		}).toArray(function(err, docs) {
			assert.equal(err, null);

			if (docs.length == 0) {
				console.log("Did not find a document with id: " + docUuid + ", so I set the state vars to be new.");
				documentCursorIds[docUuid] = 1;
				loggedModifications[docUuid] = [];
				callback();
				return;
			}

			var resultingDocument = docs[0];

			//db.close();

			console.log("Successfully retrieved document " + (docs.length) + " with id: " + docUuid + ", and updated state vars.");
			documentCursorIds[docUuid] = resultingDocument.userNumber;
			console.log("   N USERS = " + documentCursorIds[docUuid]);
			loggedModifications[docUuid] = resultingDocument.log;
			console.log("   LOG LEN = " + loggedModifications[docUuid].length);
			callback();
		});
	});
}

  ///////////////////////////////
 // URL PATTERNS + PROCEDURES //
///////////////////////////////

// Returns a new user number
app.get(/^\/user-number-plz\/.*/, function(req, res) {
	getNewUserCursorId(getDocUuid(req), function(user_no) {
		console.log("File [",getDocUuid(req),"] has a new user with cursorId [",user_no,"].");
		res.send("" + user_no);
	});
});

// Returns a log of all actions that have thus far occurred on a document. 
app.get(/^\/catchup-plz\/.*/, function(req, res) {
	getLoggedModifications(getDocUuid(req), function(log) {
		var result = JSON.stringify(log)
		console.log("File [",getDocUuid(req),"]'s log was send, which was of length ["+log.length+"] ["+result.length+" characters].");
		res.send(result);
	});
});

// Sends the generic document file.
app.get(/^\/edit\/.*/, function(req, res) {
	res.sendFile(__dirname + '/document.html');
});

// Sends the New/GoTo Page
app.get(/^\/new$/, function(req, res) {
	res.sendFile(__dirname + '/new.html');
});

// Checks to see if a name is already defined, and
app.get(/^\/proposed-doc-id/, function(req, res) {
	var proposedName = req.query.docid;
	var response = undefined
	if (documentCursorIds[proposedName] == undefined) {
		response = "YES";
	} else {
		response = "NO";
	}
	console.log("Name proposed [",proposedName,"] was told [",response,"].");
	res.send(response);
});

// Sends the landing page.
app.get(/^\/$/, function(req, res) {
	res.sendFile(__dirname + '/landing.html');
});

// Sets the public directory to serve static files.
app.use(express.static('public'));

io.on('connection', function(socket) {

	// Places the user's socket into the room that they request to be in.
	socket.on('joining', function(docUuid) {
		socket.join(docUuid);
	});

	// Sends out modifications to all people listening in a room.
	socket.on('modification', function(msg) {
		var parsed = JSON.parse(msg);
		var docUuid = parsed.docUuid;
		logModification(docUuid, msg);
		socket.broadcast.to(docUuid).emit('modification', msg);
	});

});

http.listen(8081, function() {
	console.log('listening on *:8081');
});