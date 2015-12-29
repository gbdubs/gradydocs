$(document).ready(function(){

	var OPERATIONS = {};

	var currentUrl = window.location.href;
	var DOCUMENT_UUID = currentUrl.substring(currentUrl.lastIndexOf('/') + 1);

	/* * * * * * *\
	    CURSORS
	\* * * * * * */

	var cursors = {};
	var cursor = undefined;

	var CURSOR_COLORS = [
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
		var color = CURSOR_COLORS[cursorId % CURSOR_COLORS.length];
		var css =   '.chunk.listening-'+cursorId+' { position: relative; padding-right: 2px; }\n'+
					'.chunk.listening-'+cursorId+':after { background-color: '+color+'; content: ""; position: absolute; display: inline-block; height: 100%; width: 2px; bottom: 0px; border-radius: 1px; }\n';
					//'.chunk.listening-'+cursorId+':before{ color: '+color+'; position: absolute; border: 2px solid; bottom: 17px; right: -1px; border-radius: 1px; }\n';

		if (cursorId == CURSOR_NO){
			css += '.header{ background: ' + color + ' !important;}\n';
			css += '.chunk.listening-'+cursorId+':after{ -webkit-animation: 1s blink step-end infinite;'+
  														'-moz-animation: 1s blink step-end infinite;'+
  														'-ms-animation: 1s blink step-end infinite;'+
  														'-o-animation: 1s blink step-end infinite;'+
  														'animation: 1s blink step-end infinite;\n'+
  														'.chunk.listening-'+cursorId+':after { background-color: '+color+' !important; }';
		}

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
				this.element = CHUNKS[this.location].element;
				$(this.element).addClass("listening-"+this.cursorId);
			},
			left: function(){
				var newId = CHUNKS[this.location].previousChunk;
				if (newId != undefined && newId != -1){
					if (CHUNKS[newId].placeholder){
						newId = CHUNKS[newId].previousChunk;
					}
					this.place(newId);
				}
			},
			right: function(){
				var newId = CHUNKS[this.location].nextChunk;
				if (newId != undefined){
					if (CHUNKS[newId].placeholder){
						newId = CHUNKS[newId].nextChunk;
					}
					this.place(newId);
				}
			},
			up: function(){
				var c = CHUNKS[this.location];
				var leftCoord = $(c.element).position().left;
				while (c.content != '\r' && c != undefined && c.previousChunk != undefined){ c = CHUNKS[c.previousChunk]; }
				if (c == undefined){ return; }
				if (c.previousChunk == undefined){
					this.place(c.id);
					return;
				}
				c = CHUNKS[c.previousChunk];
				while (c != undefined && c.content != '\r'){
					if ($(c.element).position().left <= leftCoord){
						this.place(c.id);
						return;
					}
					c = CHUNKS[c.previousChunk];
				}
			},
			down: function(){
				var c = CHUNKS[this.location];
				var leftCoord = $(c.element).position().left;
				while (c.content != '\r' && c != undefined && c.nextChunk != undefined){ c = CHUNKS[c.nextChunk]; }
				if (c == undefined){ return; }
				if (c.nextChunk == undefined){
					this.place(c.id);
					return;
				}
				c = CHUNKS[c.nextChunk];
				while (c != undefined && c.content != '\r' && c.nextChunk != undefined){
					if ($(c.element).position().left >= leftCoord){
						this.place(c.id);
						return;
					}
					c = CHUNKS[c.nextChunk];
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

	OPERATIONS["moveCursor"] = function(cursorId, newLocation){
		if (cursors[cursorId] == undefined){
			cursors[cursorId] = createCursor(cursorId);
		}
		cursors[cursorId].move(newLocation);
	}

	/* * * * * * * * * * *\
	  ANCHORCHUNK + SETUP 
	\* * * * * * * * * * */

	var FIRST_CHUNK_ID = undefined;
	var CHUNKS = {};
	var NEXT_CHUNK_ID = -1;
	var SOCKET = undefined;
	var CUSOR_NO = -1;

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
			CURSOR_NO = parseInt(data);
			cursor = createCursor(CURSOR_NO);
			cursor.place(1);
			var minChunkId = 2 + 10000000 * CURSOR_NO;
			NEXT_CHUNK_ID = minChunkId;
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

		SOCKET = io();

		SOCKET.emit('joining', DOCUMENT_UUID);

		SOCKET.on('modification', function(msg){
			// console.log("RECIEVED-->"+msg);
			PROCESS ( JSON.parse(msg) );
		});
	}

	OPERATIONS["setup"] = setup;

	function createNewChunk(afterChunk, char, newChunkId){
		var newChunk = createChunk(newChunkId, afterChunk);
		newChunk.placeholder = (char == '');
		var id = newChunk.id;
		newChunk.content = char;
		var newElement = newChunk.createElement();
		$(CHUNKS[afterChunk].element).after(newElement);
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
			newChunkId: NEXT_CHUNK_ID++
		}

		PROCESS(data);
		SEND(data);
		cursor.place(data.newChunkId);
	}

	function removeChunk(chunkId){
		var chunk = CHUNKS[chunkId];
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
			
			var isPlaceholder = CHUNKS[cursor.location].placeholder;
			
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

		CHUNKS[chunk.id] = chunk;

		if (previousChunkId == undefined || previousChunkId == null || FIRST_CHUNK_ID == undefined){
			var oldFirstChunk = FIRST_CHUNK_ID;
			FIRST_CHUNK_ID = chunk.id;
			chunk.nextChunk = oldFirstChunk;
			if (CHUNKS[oldFirstChunk] != undefined){
				CHUNKS[oldFirstChunk].previousChunk = chunk.id;
			}
			return chunk;
		}

		var prevChunk = CHUNKS[previousChunkId];
		if (prevChunk === undefined){
			throw "The chunk with id [" + previousChunkId + "] does not exist.";
		}

		var next = CHUNKS[prevChunk.nextChunk];

		chunk.previousChunk = prevChunk.id;
		prevChunk.nextChunk = chunk.id;

		if (next != undefined){
			next.previousChunk = chunk.id;
			chunk.nextChunk = next.id;
		}

		return chunk;
	}

	function deleteChunk (chunkId) {
		var chunk = CHUNKS[chunkId];
		if (chunk == undefined){
			throw "The chunk with id [" + chunkId + "] does not exist.";
		}

		var prev = CHUNKS[chunk.previousChunk];
		var next = CHUNKS[chunk.nextChunk];

		if (prev != undefined && next == undefined){
			prev.nextChunk = undefined;
		} else if (prev == undefined && next != undefined){
			FIRST_CHUNK_ID = next.id;
		} else if (prev != undefined && next != undefined){
			prev.nextChunk = next.id;
			next.previousChunk = prev.id;
		}
		delete CHUNKS[chunkId];
	}


	function SEND ( args ) {
		args["docUuid"] = DOCUMENT_UUID;
		SOCKET.emit('modification', JSON.stringify(args));
		// console.log("SENT-->"+JSON.stringify(args));
	}

	function PROCESS ( args ) {
		var commandType = args["commandType"];
		if (commandIsInsert(commandType)){
			OPERATIONS.insert(args.afterChunk, args.content, args.newChunkId);
		} else if (commandIsDelete(commandType)){
			OPERATIONS.delete(args.chunkDeleted);
		} else if (commandIsMoveCursor(commandType)){
			OPERATIONS.moveCursor(args.cursorId, args.newLocation);
		}
	}

	function getContentAsString(){
		var result = "";
		var current = FIRST_CHUNK_ID;
		while (current){
			result = result + CHUNKS[current].content;
			current = CHUNKS[current].nextChunk;
		}
		return result;
	}

	function redirectToDownloadPage(){
		var content = getContentAsString();
		var newUri = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
		window.open(newUri,'_blank');
	}

	function commandInsert() { return 1; }
	function commandIsInsert(commandType) { return (commandType == 1); }

	function commandDelete() { return 2; }
	function commandIsDelete(commandType) { return (commandType == 2); }

	function commandMoveCursor() { return 3; }
	function commandIsMoveCursor(commandType) { return (commandType == 3); }


	$(window).keydown(function(e){
		var c = e.which;
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
		} else if (c == 27){
			redirectToDownloadPage();
		}
	});

	$(window).keypress(function(e){
		var c = e.which;
		if (c >= 32 && c <= 126){
			createNewChunkLocally(c);
		}
		if (c == 8){
			e.preventDefault();
		}
		if (c == 32){
			e.preventDefault();
		}
	});

	setup();
});