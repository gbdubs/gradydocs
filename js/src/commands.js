var CHUNK_IDS = 1;
var FIRST_CHUNK_ID = undefined;
var CHUNKS = {};

function clearState(){
	CHUNKS = {};
	FIRST_CHUNK_ID = undefined;
	CHUNK_IDS = 1;
}

function getChunkList(){
	if (FIRST_CHUNK_ID === undefined){
		return [];
	}
	var id = FIRST_CHUNK_ID;
	var chunk = CHUNKS[id];
	var result = [];
	while (chunk != undefined){
		result.push(chunk);
		id = chunk.nextChunk;
		chunk = CHUNKS[id];
	}
	return result;
}

function getChunkIdList(){
	var result = [];
	var chunkList = getChunkList();
	for (var i in chunkList){
		result.push(chunkList[i].id);
	}
	return result;
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
	console.log(JSON.stringify(args));
}

function PROCESS ( args ) {
	var commandType = args["commandType"];
	if (commandIsInsert(commandType)){
		return OPERATIONS.insert(args.afterChunk, args.content, args.newChunkId);
	} else if (commandIsDelete(commandType)){
		OPERATIONS.delete(args.chunkDeleted);
	} else if (commandIsMoveCursor(commandType)){
		OPERATIONS.cursorChange(args.cursorId, args.newLocation);
	}
}

function commandInsert() { return 1; }
function commandIsInsert(commandType) { return (commandType == 1); }

function commandDelete() { return 2; }
function commandIsDelete(commandType) { return (commandType == 2); }

function commandCreateChunk() { return 3; }
function commandIsCreateChunk(commandType) { return (commandType == 3); }

function commandSplitChunk() { return 4; }
function commandIsSplitChunk(commandType) { return (commandType == 4); }

function commandMergeChunk() { return 5; }
function commandIsMergeChunk(commandType) { return (commandType == 5); }

function commandDeleteChunk() { return 6; }
function commandIsDeleteChunk(commandType) { return (commandType == 6); }

function commandMoveCursor() { return 7; }
function commandIsMoveCursor(commandType) { return (commandType == 7); }