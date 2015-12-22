


$(document).ready(function(){

	var cursor = 1;

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

	$(window).keypress(function(e){
		var newCharacter = String.fromCharCode(e.which);
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
	});
});