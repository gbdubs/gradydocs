var OPERATIONS = {};

$(document).ready(function(){

	/* * * * * * *\
	    CURSORS
	\* * * * * * */

	var cursors = {};

	function changeCursor(id){
		cursor = cursors[id];
		if (cursor == undefined){
			cursor = createCursor(id);
			cursor.move(1);
		}
	}

	function createCursor(newId){
		cursors[newId] = {
			cursorId: newId,
			location: -1,
			element: undefined,
			move: function(id, muteLog){
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
					this.move(newId);
				}
			},
			right: function(){
				var newId = CHUNKS[this.location].nextChunk;
				if (newId != undefined){
					if (CHUNKS[newId].placeholder){
						newId = CHUNKS[newId].nextChunk;
					}
					this.move(newId);
				}
			},
			up: function(){
				var c = CHUNKS[this.location];
				var leftCoord = $(c.element).position().left;
				while (c.content != '\r' && c != undefined && c.previousChunk != undefined){ c = CHUNKS[c.previousChunk]; }
				if (c == undefined){ return; }
				if (c.previousChunk == undefined){
					this.move(c.id);
					return;
				}
				c = CHUNKS[c.previousChunk];
				while (c != undefined && c.content != '\r'){
					if ($(c.element).position().left <= leftCoord){
						this.move(c.id);
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
					this.move(c.id);
					return;
				}
				c = CHUNKS[c.nextChunk];
				while (c != undefined && c.content != '\r' && c.nextChunk != undefined){
					if ($(c.element).position().left >= leftCoord){
						this.move(c.id);
						return;
					}
					c = CHUNKS[c.nextChunk];
				}
				if (c != undefined){
					this.move(c.id);
					return;
				}

			}
		};
		return cursors[newId];
	}

	OPERATIONS["moveCursor"] = function(cursorId, newLocation){
		cursors[cursorId].move(newLocation, false);
	}

	/* * * * * * *\
	  ANCHORCHUNK 
	\* * * * * * */

	function createAnchor(){
		var achoringChunk = createChunk(1);
		achoringChunk.content = "";
		var achoringChunkElement = achoringChunk.createElement();
		$("#chunks").append(achoringChunkElement);
		achoringChunk.element = $("#chunk-1")[0];
	}

	OPERATIONS["createAnchor"] = createAnchor;

	//SETUP
	OPERATIONS.createAnchor();
	var cursor = createCursor(1);
	cursor.move(1);
	var CHUNKID = 2;
	

	function createNewChunk(afterChunk, char, newChunkId){
		var newChunk = createChunk(newChunkId, afterChunk);
		newChunk.placeholder = (char == '');
		var id = newChunk.id;
		newChunk.content = char;
		var newElement = newChunk.createElement();
		$(CHUNKS[afterChunk].element).after(newElement);
		newChunk.element = $("#chunk-" + id)[0];
		$(newChunk.element).click(function(){
			cursor.move(id);
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

		var newChunkId = PROCESS({
			commandType: commandInsert(),
			afterChunk: cursor.location,
			content: character,
			newChunkId: CHUNKID++
		});
		cursor.move(newChunkId);
		SEND(data);
	}

	function removeChunkFromDocument(chunkId){
		var chunk = CHUNKS[chunkId];
		var prev = chunk.previousChunk;
		for (var curs in cursors){
			if ($(chunk.element).hasClass("listening-"+curs)){
				cursors[curs].move(prev);
			}
		}		
		var isPlaceholder = chunk.placeholder;
		var element = chunk.element;
		deleteChunk(chunk.id);
		element.remove();
		if (isPlaceholder){
			removeChunkFromDocument(prev);
		}
	}

	OPERATIONS["delete"] = removeChunkFromDocument;

	function removeCharacterFromDocument(){
		if (cursor.location != 1){
			var isPlaceholder = CHUNKS[cursor.location].placeholder;
			var previous = CHUNKS[cursor.location].previousChunk;
			var element = cursor.element;
			var location = cursor.location;
			for (var curs in cursors){
				if ($(element).hasClass("listening-"+curs)){
					cursors[curs].move(previous);
				}
			}	
			deleteChunk(location);
			element.remove();
			SEND_DELETE(location);
			if (isPlaceholder){
				removeCharacterFromDocument();
			}
		}
	}

	$(window).keydown(function(e){
		var c = e.which;
		if (c == 8) {
			removeCharacterFromDocument();
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
			changeCursor(cursor.cursorId%5+1);
		}
	});

	$(window).keypress(function(e){
		var c = e.which;
		if (c >= 32 && c <= 126){
			createNewChunkLocally(c);
		}
	});
});