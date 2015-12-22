$(document).ready(function(){

	var firstChunk = createChunk(1);
	firstChunk.content = "A";
	var firstChunkElement = firstChunk.createElement();
	$("#chunks").append(firstChunkElement);
	firstChunk.element = $("#chunk-1")[0];

	var cursor = {
		cursorId: 1,
		location: 1,
		element: firstChunk.element,
		move: function(id){
			$(this.element).removeClass("listening").removeClass("listening-"+this.cursorId);
			this.location = id;
			this.element = CHUNKS[this.location].element;
			$(this.element).addClass("listening").addClass("listening-"+this.cursorId);
		}
	}

	var CHUNKID = 2;
	
	function createNewChunk(char){
		var newChunk = createChunk(CHUNKID++, cursor.location);
		var id = newChunk.id;
		newChunk.content = char;
		var newElement = newChunk.createElement();
		$(cursor.element).after(newElement);
		newChunk.element = $("#chunk-" + id)[0];
		$(newChunk.element).click(function(){
			cursor.move(id);
		});
		cursor.move(id);
	}

	function addCharacterToDocument(char){
		createNewChunk(String.fromCharCode(char));
	}

	function removeCharacterFromDocument(){
		var previous = CHUNKS[cursor.location].previousChunk;
		var element = cursor.element;
		deleteChunk(cursor.location);
		element.remove();
		cursor.move(previous);
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
		}
	});
	$(window).keypress(function(e){
		var c = e.which;
		if (c >= 32 && c <= 126){
			addCharacterToDocument(c);
		}
	});
});