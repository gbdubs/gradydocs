$(document).ready(function(){

	var OPERATIONS = {};

	var currentUrl = window.location.href;
	var DOCUMENT_UUID = currentUrl.substring(currentUrl.lastIndexOf('/') + 1);

	  //////////////////
	 // CURSOR LOGIC //
	//////////////////

	// The cursor that this user has been assigned.
	var cursor = undefined;

	// A dictionary describing all active cursors in the document.
	var cursors = {};
	
	var cursorColors = [
		"#000000", // Black
		"#3F51B5", // Indigo
		"#4CAF50", // Green
		"#FFC107", // Amber
		"#2196F3", // Blue
		"#FF5722", // Deep Orange
		"#009688", // Teal
		"#FFEB3B", // Yellow
		"#673AB7", // Deep Purple
		"#F44336", // Red
		"#9C27B0", // Purple
		"#CDDC39", // Lime
		"#E91E63", // Pink
		"#607D8B"  // Blue Grey
	];

	function addCursorCssToDocument(cursorId){
		var color = cursorColors[cursorId % cursorColors.length];
		
		// Adds styles to color how ever many cursors end up being in the document.
		var css =   '.chunk.listening-'+cursorId+' { position: relative; padding-right: 2px; }\n'+
					'.chunk.listening-'+cursorId+':after { background-color: '+color+'; content: ""; position: absolute; display: inline-block; height: 100%; width: 2px; bottom: 0px; border-radius: 1px; }\n'+
					'.chat-message-'+cursorId+' { background-color: '+color+'; }\n';
		
		// Adds styles if it is the current cursor.		
		if (cursorId == myCursorId){
			css += '.header{ background: ' + color + ' !important;}\n';
			css += '.chunk.listening-'+cursorId+':after{ -webkit-animation: 1s blink step-end infinite;'+
			'-moz-animation: 1s blink step-end infinite;'+
			'-ms-animation: 1s blink step-end infinite;'+
			'-o-animation: 1s blink step-end infinite;'+
			'animation: 1s blink step-end infinite;\n'+
			'.chunk.listening-'+cursorId+':after { background-color: '+color+' !important; }';
		}

		// Appends the styles to the document.
		head = document.head || document.getElementsByTagName('head')[0],
		style = document.createElement('style');
		style.type = 'text/css';
		if (style.styleSheet){
			style.styleSheet.cssText = css;
		} else {
			style.appendChild(document.createTextNode(css));
		}
		head.appendChild(style);
	}

	// Cursor objects are self contained, and locally use the PLACE function
	// while all other methods either call place or are called by place.
	function createCursor(newId){
		cursors[newId] = {
			cursorId: newId,
			location: -1,
			element: undefined,
			place: function(id){
				var data = {
					commandType: commandMoveCursor(),
					cursorId: this.cursorId,
					newLocation: id
				};
				PROCESS(data);
				SEND(data);
			},
			move: function(id){
				if (this.element != undefined){
					$(this.element).removeClass("listening-"+this.cursorId);
				}
				this.location = id;
				this.element = allChunks[this.location].element;
				$(this.element).addClass("listening-"+this.cursorId);
			},
			left: function(){
				var newId = allChunks[this.location].previousChunk;
				if (newId != undefined && newId != -1){
					if (allChunks[newId].placeholder){
						newId = allChunks[newId].previousChunk;
					}
					this.place(newId);
				}
			},
			right: function(){
				var newId = allChunks[this.location].nextChunk;
				if (newId != undefined){
					if (allChunks[newId].placeholder){
						newId = allChunks[newId].nextChunk;
					}
					this.place(newId);
				}
			},
			up: function(){
				var c = allChunks[this.location];
				var leftCoord = $(c.element).position().left;
				while (c.content != '\r' && c != undefined && c.previousChunk != undefined){ c = allChunks[c.previousChunk]; }
				if (c == undefined){ return; }
				if (c.previousChunk == undefined){
					this.place(c.id);
					return;
				}
				c = allChunks[c.previousChunk];
				while (c != undefined && c.content != '\r'){
					if ($(c.element).position().left <= leftCoord){
						this.place(c.id);
						return;
					}
					c = allChunks[c.previousChunk];
				}
			},
			down: function(){
				var c = allChunks[this.location];
				var leftCoord = $(c.element).position().left;
				while (c.content != '\r' && c != undefined && c.nextChunk != undefined){ c = allChunks[c.nextChunk]; }
				if (c == undefined){ return; }
				if (c.nextChunk == undefined){
					this.place(c.id);
					return;
				}
				c = allChunks[c.nextChunk];
				while (c != undefined && c.content != '\r' && c.nextChunk != undefined){
					if ($(c.element).position().left >= leftCoord){
						this.place(c.id);
						return;
					}
					c = allChunks[c.nextChunk];
				}
				if (c != undefined){
					this.place(c.id);
					return;
				}

			}
		};
		addCursorCssToDocument(newId);
		return cursors[newId];
	}

	// When we move a cursor, we may need to create it.
	OPERATIONS["moveCursor"] = function(cursorId, newLocation){
		if (cursors[cursorId] == undefined){
			cursors[cursorId] = createCursor(cursorId);
		}
		cursors[cursorId].move(newLocation);
	}

	  //////////////////////////
	 //  ANCHORCHUNK + SETUP //
	//////////////////////////

	var anchorFirstChunkId = undefined;
	var allChunks = {};
	var nextChunkToCreate = -1;
	var socketIOAPI = undefined;

	function setup(){
		var achoringChunk = createChunk(1);
		achoringChunk.content = "";
		var achoringChunkElement = achoringChunk.createElement();
		$("#chunks").append(achoringChunkElement);
		achoringChunk.element = $("#chunk-1")[0];

		$(".document-id").each(function(){
			$(this).text(DOCUMENT_UUID);
		});

		$.get("/user-number-plz/"+DOCUMENT_UUID, function(data){
			myCursorId = parseInt(data);
			cursor = createCursor(myCursorId);
			cursor.place(1);
	  		var minChunkId = 2 + 10000000 * myCursorId;
	  		nextChunkToCreate = minChunkId;
	  		$.get("/catchup-plz/"+DOCUMENT_UUID, function(data){
	  			var listOfData = JSON.parse(data);
	  			for (var i in listOfData){
	  				PROCESS(JSON.parse(listOfData[i]));
	  			}
	  		});
	  	});

	  	$("#download-btn").click(function(){
	  		redirectToDownloadPage();
	  	});

	  	$("#save-btn").click(function(){
	  		redirectToDownloadPage();
	  	});

	  	$("#chat-send-btn").click(triggerMessageSend);

	  	$(".chat-toggle-tools > span").click(toggleChatBox);

	  	var chunksElement = document.getElementById('chunks');
	  	chunksElement.onpaste = function(e) {
	  		var pastedText = undefined;
			if (window.clipboardData && window.clipboardData.getData) { // IE
				pastedText = window.clipboardData.getData('Text');
			} else if (e.clipboardData && e.clipboardData.getData) { // OTHERS
				pastedText = e.clipboardData.getData('text/plain');
			}
			if (pastedText != undefined){
				createNewChunkLocallyFromString(pastedText);
			}
			return false;
		};

		socketIOAPI = io();

		socketIOAPI.emit('joining', DOCUMENT_UUID);

		socketIOAPI.on('modification', function(msg){
			// console.log("RECIEVED-->"+msg);
			PROCESS ( JSON.parse(msg) );
		});

		socketIOAPI.on('chat', function(msg){
			PROCESS ( JSON.parse(msg) );
		});

		  /////////////////////////////////////////
		 // KEY LISTENERS + INPUT INTERRUPTIONS //
		/////////////////////////////////////////

		$(window).keydown(function(e){
			var c = e.which;
			if (document.activeElement.tagName == "INPUT"){
				if (c == 13) {
					triggerMessageSend();
				}
			} else {
				if (c == 8) {
					removeChunkLocally();
					e.preventDefault();
				} else if (c == 13){
					createNewChunkLocally(13);
					createNewChunkLocally(-1);
					e.preventDefault();
				} else if (c == 9){
					createNewChunkLocally(9);
					e.preventDefault();
				} else if (c == 37){
					cursor.left();
				} else if (c == 39){
					cursor.right();
				} else if (c == 38){
					cursor.up();
				} else if (c == 40){
					cursor.down();
				}
			}
		});

		$(window).keypress(function(e){
			var c = e.which;
			if (document.activeElement.tagName != "INPUT"){
				if (c >= 32 && c <= 126){
					createNewChunkLocally(c);
				}
				if (c == 32){
					e.preventDefault();
				}
			}
			if (c == 8){
				e.preventDefault();
			}
		});

		$("#false-input").focus();
	}

	OPERATIONS["setup"] = setup;

	  /////////////////
	 // CHUNK LOGIC //
	/////////////////

	function createNewChunk(afterChunk, char, newChunkId){
		var newChunk = createChunk(newChunkId, afterChunk);
		newChunk.placeholder = (char == '');
		var id = newChunk.id;
		newChunk.content = char;
		var newElement = newChunk.createElement();
		$(allChunks[afterChunk].element).after(newElement);
		newChunk.element = $("#chunk-" + id)[0];
		$(newChunk.element).click(function(){
			cursor.place(id);
		});
		return id;
	}

	OPERATIONS["insert"] = createNewChunk;

	function createNewChunkLocally(charCode){
		var character = undefined;
		
		if (charCode == -1){
			character = '';
		} else {
			character = String.fromCharCode(charCode);
		}

		var data = {
			commandType: commandInsert(),
			afterChunk: cursor.location,
			content: character,
			newChunkId: nextChunkToCreate++
		}

		PROCESS(data);
		SEND(data);
		cursor.place(data.newChunkId);
	}

	function createNewChunkLocallyFromString(str){
		for (var i = 0; i < str.length; i++){
			createNewChunkLocally(str.charCodeAt(i));
		}
	}

	function removeChunk(chunkId){
		var chunk = allChunks[chunkId];
		var prev = chunk.previousChunk;
		for (var curs in cursors){
			if ($(chunk.element).hasClass("listening-"+curs)){
				cursors[curs].place(prev);
			}
		}		
		var isPlaceholder = chunk.placeholder;
		var element = chunk.element;
		deleteChunk(chunk.id);
		element.remove();
	}

	OPERATIONS["delete"] = removeChunk;

	function removeChunkLocally(){
		if (cursor.location != 1){
			
			var isPlaceholder = allChunks[cursor.location].placeholder;
			
			var data = {
				commandType: commandDelete(),
				chunkDeleted: cursor.location
			};

			PROCESS(data);
			SEND(data);
			
			if (isPlaceholder){
				removeChunkLocally();
			}
		}
	}

	function createChunk (newId, previousChunkId) {
		var chunk = {
			id: newId,
			content: "",
			previousChunk: undefined,
			nextChunk: undefined,
			createElement: function(){
				return "<span class=\"chunk\" id=\"chunk-" + this.id + "\">"+this.content+"</span>"
			}
		};

		allChunks[chunk.id] = chunk;

		if (previousChunkId == undefined || previousChunkId == null || anchorFirstChunkId == undefined){
			var oldFirstChunk = anchorFirstChunkId;
			anchorFirstChunkId = chunk.id;
			chunk.nextChunk = oldFirstChunk;
			if (allChunks[oldFirstChunk] != undefined){
				allChunks[oldFirstChunk].previousChunk = chunk.id;
			}
			return chunk;
		}

		var prevChunk = allChunks[previousChunkId];
		if (prevChunk === undefined){
			throw "The chunk with id [" + previousChunkId + "] does not exist.";
		}

		var next = allChunks[prevChunk.nextChunk];

		chunk.previousChunk = prevChunk.id;
		prevChunk.nextChunk = chunk.id;

		if (next != undefined){
			next.previousChunk = chunk.id;
			chunk.nextChunk = next.id;
		}

		return chunk;
	}

	function deleteChunk (chunkId) {
		var chunk = allChunks[chunkId];
		if (chunk == undefined){
			throw "The chunk with id [" + chunkId + "] does not exist.";
		}

		var prev = allChunks[chunk.previousChunk];
		var next = allChunks[chunk.nextChunk];

		if (prev != undefined && next == undefined){
			prev.nextChunk = undefined;
		} else if (prev == undefined && next != undefined){
			anchorFirstChunkId = next.id;
		} else if (prev != undefined && next != undefined){
			prev.nextChunk = next.id;
			next.previousChunk = prev.id;
		}
		delete allChunks[chunkId];
	}

	  ////////////////
	 // CHAT LOGIC //
	////////////////

	var nUnreadMessages = 0;

	function addChatMessage ( cursorId, message ){
		var toAppend = '<div class="chat-message chat-message-'+cursorId+'">'+message+"</div>";
		$(".chat-messages").first().append(toAppend);
		nUnreadMessages ++;
		updateUnreadMessages();
	}

	OPERATIONS["addChatMessage"] = addChatMessage;

	function addChatMessageLocally ( chatMessage ) {
		var data = {
			commandType: commandChatMessage(),
			cursorId : cursor.cursorId,
			message : chatMessage
		};
		SEND(data);
		PROCESS(data);
		nUnreadMessages = 0;
		updateUnreadMessages();
	}

	function triggerMessageSend(){
		var input = $("#chat-field-input");
		var val = input.val();
		if (val.trim().length != 0){
			addChatMessageLocally(val);
	  		input.val("");
		}
	}

	function updateUnreadMessages(){
		$(".chat-waiting").first().text(nUnreadMessages);
	}

	function toggleChatBox(){
		$(".chat-toggle-tools > span").each(function(){
			$(this).toggleClass("hidden");
		});
		$(".chat-body").toggleClass("minimized");
	}

	  /////////////////////////////
	 // DOWNLOAD IMPLEMENTATION //
	/////////////////////////////

	function getDocumentContentAsString(){
		var result = "";
		var current = anchorFirstChunkId;
		while (current){
			result = result + allChunks[current].content;
			current = allChunks[current].nextChunk;
		}
		return result;
	}

	function redirectToDownloadPage(){
		var content = getDocumentContentAsString();
		var newUri = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
		window.open(newUri,'_blank');
	}

	  /////////////////////////////////////////////////
	 // OPERATOR APPLICATIONS + COMMAND CONVENTIONS //
	/////////////////////////////////////////////////

	function lowBandwidthEncode ( args ){
		var newArgs = [];
		if (args['commandType']) newArgs['t'] = args['commandType'];
		if (args['afterChunk']) newArgs['a'] = args['afterChunk'];
		if (args['content']) newArgs['c'] = args['content'];
		if (args['newChunkId']) newArgs['n'] = args['newChunkId'];
		if (args['chunkDeleted']) newArgs['d'] = args['chunkDeleted'];
		if (args['cursorId']) newArgs['i'] = args['cursorId'];
		if (args['newLocation']) newArgs['l'] = args['newLocation'];
		if (args['message']) newArgs['m'] = args['message'];
		if (args['docUuid']) newArgs['u'] = args['docUuid'];
		return newArgs;
	}

	function lowBandwidthDecode ( args ) {
		if (args.commandType){
			return args;
		} else {
			var newArgs = [];
			if (args['t']) newArgs['commandType'] = args['t'];
			if (args['a']) newArgs['afterChunk'] = args['a'];
			if (args['c']) newArgs['content'] = args['c'];
			if (args['n']) newArgs['newChunkId'] = args['n'];
			if (args['d']) newArgs['chunkDeleted'] = args['d'];
			if (args['i']) newArgs['cursorId'] = args['i'];
			if (args['l']) newArgs['newLocation'] = args['l'];
			if (args['m']) newArgs['message'] = args['m'];
			if (args['u']) newArgs['docUuid'] = args['u'];
			return newArgs;
		}
	}

	function SEND ( args ) {
		args["docUuid"] = DOCUMENT_UUID;
		var encoded = lowBandwidthEncode(args);
		socketIOAPI.emit('modification', JSON.stringify(args));
	}

	function PROCESS ( args ) {
		args = lowBandwidthDecode(args);
		var commandType = args["commandType"];
		if (commandIsInsert(commandType)){
			OPERATIONS.insert(args.afterChunk, args.content, args.newChunkId);
		} else if (commandIsDelete(commandType)){
			OPERATIONS.delete(args.chunkDeleted);
		} else if (commandIsMoveCursor(commandType)){
			OPERATIONS.moveCursor(args.cursorId, args.newLocation);
		} else if (commandIsChatMessage(commandType)){
			OPERATIONS.addChatMessage(args.cursorId, args.message);
		}
	}

	function commandInsert() { return 1; }
	function commandIsInsert(commandType) { return (commandType == 1); }

	function commandDelete() { return 2; }
	function commandIsDelete(commandType) { return (commandType == 2); }

	function commandMoveCursor() { return 3; }
	function commandIsMoveCursor(commandType) { return (commandType == 3); }

	function commandChatMessage() { return 4; }
	function commandIsChatMessage(commandType) { return (commandType == 4); }


	// Begins the show!
	setup();
});