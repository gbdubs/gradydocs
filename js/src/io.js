var OPERATIONS = {};

$(document).ready(function(){

	var cursors = {};

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
				if (muteLog == undefined){
					SEND_CURSOR_CHANGE(this.cursorId, this.location);
				}
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

	OPERATIONS["cursorChange"] = function(cursorId, newLocation){
		cursors[cursorId].move(newLocation, false);
	}

	var firstChunk = createChunk(1);
	firstChunk.content = "";
	var firstChunkElement = firstChunk.createElement();
	$("#chunks").append(firstChunkElement);
	firstChunk.element = $("#chunk-1")[0];

	
	var cursor = createCursor(1);
	cursor.move(1);

	function changeCursor(id){
		cursor = cursors[id];
		if (cursor == undefined){
			cursor = createCursor(id);
			cursor.move(1);
		}
	}


	var CHUNKID = 2;
	
	function insertNewChunk(afterChunk, char, newChunkId){
		var newChunk = createChunk(newChunkId, afterChunk);
		newChunk.placeholder = (char == '');
		newChunk.content = char;
		var id = newChunk.id;
		var newElement = newChunk.createElement();
		$(CHUNKS[afterChunk].element).after(newElement);
		$(newChunk.element).click(function(){
			cursor.move(id);
		});
	}

	OPERATIONS["insert"] = insertNewChunk;

	function createNewChunk(char){
		var newChunk = createChunk(CHUNKID++, cursor.location);
		newChunk.placeholder = (char == '');
		var id = newChunk.id;
		newChunk.content = char;
		var newElement = newChunk.createElement();
		$(cursor.element).after(newElement);
		newChunk.element = $("#chunk-" + id)[0];
		$(newChunk.element).click(function(){
			cursor.move(id);
		});
		SEND_INSERT(cursor.location, char, id);
		cursor.move(id);
	}

	function addCharacterToDocument(char){
		if (char == -1){
			createNewChunk('');
		} else {
			createNewChunk(String.fromCharCode(char));
		}
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
		if (e.which == 8) {
			removeCharacterFromDocument();
			e.preventDefault();
		} else if (e.which == 13){
			addCharacterToDocument(13);
			addCharacterToDocument(-1);
			e.preventDefault();
		} else if (e.which == 9){
			addCharacterToDocument(9);
			e.preventDefault();
		} else if (e.which == 37){
			cursor.left();
		} else if (e.which == 39){
			cursor.right();
		} else if (e.which == 38){
			cursor.up();
		} else if (e.which == 40){
			cursor.down();
		} else if (e.which == 27){
			changeCursor(cursor.cursorId%5+1);
		}
	});
	$(window).keypress(function(e){
		var c = e.which;
		if (c >= 32 && c <= 126){
			addCharacterToDocument(c);
		}
	});
});