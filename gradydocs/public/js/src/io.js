var OPERATIONS = {};

$(document).ready(function(){

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
					'.chunk.listening-'+cursorId+':after { color: '+color+'; content: ""; position: absolute; display: inline-block; height: 19px; border-right: 2px solid; bottom: 0px; border-radius: 1px; }\n'+
					'.chunk.listening-'+cursorId+':before{ color: '+color+'; position: absolute; border: 2px solid; bottom: 17px; right: -1px; border-radius: 1px; }\n';

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

	var CHUNKID = -1;

	function setup(){
		var achoringChunk = createChunk(1);
		achoringChunk.content = "";
		var achoringChunkElement = achoringChunk.createElement();
		$("#chunks").append(achoringChunkElement);
		achoringChunk.element = $("#chunk-1")[0];

		$.get("/user-number-plz", function(data){
			var cursorNumber = parseInt(data);
			console.log(cursorNumber);
			cursor = createCursor(cursorNumber);
			cursor.place(1);
			CHUNKID = 2 + 1000000 * cursorNumber;

			$.get("/catchup-plz", function(data){
				var listOfData = JSON.parse(data);
				for (var i in listOfData){
					PROCESS(JSON.parse(listOfData[i]));
				}
			});
		});
	}

	OPERATIONS["setup"] = setup;

	setup();

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
			newChunkId: CHUNKID++
		}

		var newChunkId = PROCESS(data);
		SEND(data);
		cursor.place(newChunkId);
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
			toggleCursor(cursor.cursorId%5+1);
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
	});
});

/* 
DEPRECATED
function toggleCursor(id){
	cursor = cursors[id];
	if (cursor == undefined){
		cursor = createCursor(id);
		cursor.place(1);
	}
}
*/