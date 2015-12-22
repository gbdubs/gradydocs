var OPERATIONS = {};

$(document).ready(function(){

	var cursors = {};

	var firstChunk = createChunk(1);
	firstChunk.content = "";
	var firstChunkElement = firstChunk.createElement();
	$("#chunks").append(firstChunkElement);
	firstChunk.element = $("#chunk-1")[0];

	var cursor = {
		cursorId: 1,
		location: -1,
		element: undefined,
		move: function(id, muteLog){
			if (this.element != undefined){
				$(this.element).removeClass("listening").removeClass("listening-"+this.cursorId);
			}
			this.location = id;
			this.element = CHUNKS[this.location].element;
			$(this.element).addClass("listening").addClass("listening-"+this.cursorId);
			if (muteLog){
				SEND_CURSOR_CHANGE(this.cursorId, this.location);
			}	
		},
		left: function(){
			var newId = CHUNKS[this.location].previousChunk;
			if (newId != undefined && newId != -1){
				this.move(newId);
			}
		},
		right: function(){
			var newId = CHUNKS[this.location].nextChunk;
			if (newId != undefined){
				this.move(newId);
			}
		}
	}

	cursors[1] = cursor;

	OPERATIONS["cursorChange"] = function(cursorId, newLocation){
		cursors[cursorId].move(newLocation, false);
	}

	cursor.move(1);


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
			deleteChunk(cursor.location);
			element.remove();
			SEND_DELETE(cursor.location);
			cursor.move(previous);
			if (isPlaceholder){
				removeCharacterFromDocument();
			}
		}
	}

	$(window).keydown(function(e){
		if (e.which == 8) {
			removeCharacterFromDocument();
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
		}
	});
	$(window).keypress(function(e){
		var c = e.which;
		if (c >= 32 && c <= 126){
			addCharacterToDocument(c);
		}
	});
});