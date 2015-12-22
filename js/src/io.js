

$(document).ready(function(){




	var cursor = 1;
	var cursorElement = getChunkElement(cursor);

	function getChunkElement(n){
		return $("#chunk-"+n)[0];
	}

	function changeCursorPositionTo(newCursorElement){


		$(getChunkElement(cursor)).removeClass("listening");
		cursor = parseInt($(newCursorElement).attr('id').substring(6));
		$(newCursorElement).addClass("listening");
	}

	function changeCursorPositionToId(id){
		changeCursorPositionTo(getChunkElement(id));
	}

	

	var firstChunk = createChunk(1);
	firstChunk.content = "A";
	var firstChunkElement = firstChunk.createElement()
	$("#chunks").append(firstChunkElement);
	changeCursorPositionToId(1);

	var CHUNKID = 2;

	function addCharacterToDocument(char){
		var newCharacter = String.fromCharCode(char);
		var newChunk = createChunk(CHUNKID++, cursor);
		newChunk.content = newCharacter;
		var cursorElement = getChunkElement(cursor);
		var newElement = newChunk.createElement();
		$(cursorElement).after(newElement);
		$(getChunkElement(newChunk.id)).click(function(){
			changeCursorPositionTo(this);
		});
		changeCursorPositionToId(newChunk.id);
		cursor = newChunk.id;
	}

	function removeCharacterFromDocument(){
		var previous = CHUNKS[cursor].previousChunk;
		var element = getChunkElement(cursor);
		deleteChunk(cursor);
		element.remove();
		changeCursorPositionToId(previous);
	}

	$(window).keydown(function(e){
		if (e.which == 8) {
			removeCharacterFromDocument();
		} else if (e.which == 13){
			addCharacterToDocument(13);
			e.preventDefault();
		} else if (e.which == 9){
			addCharacterToDocument(9);
			e.preventDefault();
		} else if (e.which == 37){

		}
	});
	$(window).keypress(function(e){
		var c = e.which;
		if (c >= 32 && c <= 126){
			addCharacterToDocument(c);
		}
	});
});