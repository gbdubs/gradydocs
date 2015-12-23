function verifyChunkListConsistency(node){
	var next = node.nextChunk;
	var nextNode = CHUNKS[next];
	if (nextNode != undefined){
		expect(node.id).toEqual(nextNode.previousChunk);
		expect(node.nextChunk).toEqual(nextNode.id);
		verifyChunkListConsistency(nextNode);
	}
}

describe("Chunk Creation", function() {
	beforeEach(function(){
		clearState();
	});

	it("Allows you to create a first chunk and persists the new id", function() {
		createChunk(7);
		var actual = getChunkIdList();
		expect(actual).toEqual([7]);
		verifyChunkListConsistency(CHUNKS[actual[0]]);
	});

	it("Successfully links chunks together.", function() {
		createChunk(7);
		createChunk(2, 7);
		createChunk(1, 7);
		var actual = getChunkIdList();
		expect(actual).toEqual([7,1,2]);
		verifyChunkListConsistency(CHUNKS[actual[0]]);
	});

	it("Creates chunks at the front successfully", function() {
		createChunk(3);
		createChunk(2);
		createChunk(1);
		createChunk(4, 3);
		var actual = getChunkIdList();
		expect(actual).toEqual([1,2,3,4]);
		console.log(JSON.stringify(CHUNKS));
		verifyChunkListConsistency(CHUNKS[actual[0]]);
	});

	it("Creates chunks reasonably consistently", function() {
		createChunk(3);
		createChunk(6, 3);
		createChunk(2);
		createChunk(5, 2);
		createChunk(1);
		createChunk(7, 5);
		createChunk(4, 3);
		var actual = getChunkIdList();
		expect(actual).toEqual([1,2,5,7,3,4,6]);
		verifyChunkListConsistency(CHUNKS[actual[0]]);
	});
});

describe("Chunk Deletion", function() {
	beforeEach(function(){
		clearState();
	});

	it("Deletes out Chunks Without Error", function() {
		createChunk(3);
		createChunk(6, 3);
		createChunk(2);
		createChunk(5, 2);
		createChunk(1);
		createChunk(7, 5);
		createChunk(4, 3);
		
		var actual = getChunkIdList();
		expect(actual).toEqual([1,2,5,7,3,4,6]);
		verifyChunkListConsistency(CHUNKS[actual[0]]);

		deleteChunk(7);
		actual = getChunkIdList();
		expect(actual).toEqual([1,2,5,3,4,6]);
		verifyChunkListConsistency(CHUNKS[actual[0]]);

		deleteChunk(1);
		actual = getChunkIdList();
		expect(actual).toEqual([2,5,3,4,6]);
		verifyChunkListConsistency(CHUNKS[actual[0]]);

		deleteChunk(6);
		actual = getChunkIdList();
		expect(actual).toEqual([2,5,3,4]);
		verifyChunkListConsistency(CHUNKS[actual[0]]);

		deleteChunk(5);
		actual = getChunkIdList();
		expect(actual).toEqual([2,3,4]);
		verifyChunkListConsistency(CHUNKS[actual[0]]);

		deleteChunk(3);
		actual = getChunkIdList();
		expect(actual).toEqual([2,4]);
		verifyChunkListConsistency(CHUNKS[actual[0]]);

		deleteChunk(4);
		actual = getChunkIdList();
		expect(actual).toEqual([2]);
		verifyChunkListConsistency(CHUNKS[actual[0]]);

		deleteChunk(2);
		actual = getChunkIdList();
		expect(actual).toEqual([]);
		
	});
});
