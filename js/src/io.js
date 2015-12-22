


$(document).ready(function(){




	function getChunkElement(n){
		return $("#chunk-"+n);
	}


	var firstChunk = createChunk(1);
	firstChunk.content = "A";

	$("#chunks").append(firstChunk.createElement());


	var cursor = 1;

	function changeCursor(){
		cursor = parseInt($(this).attr('id').substring(6));
		console.log(cursor);
	}

	var CHUNKID = 2;

	$(window).keypress(function(e){
		var newCharacter = String.fromCharCode(e.which);
		var newChunk = createChunk(CHUNKID++, cursor);
		newChunk.content = newCharacter;
		var cursorElement = getChunkElement(cursor);
		var newElement = newChunk.createElement();
		$(cursorElement).after(newElement);
		$(newElement).click(changeCursor);
		cursor = newChunk.id;
	});

	$(".chunk").click(changeCursor);
});