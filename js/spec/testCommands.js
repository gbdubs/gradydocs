describe("Basic Command Behaviors", function() {

  function verifyChunkListConsistency(node){
  	var next = node.nextChunk;
  	var nextNode = CHUNKS[next];
  	if (nextNode != undefined){
  	  expect(node.id).toEqual(nextNode.previousChunk);
  	  expect(node.nextChunk).toEqual(nextNode.id);
  	  verifyChunkListConsistency(nextNode);
  	}
  }

  beforeEach(function(){
  	clearState();
  });

  it("Allows you to create a chunk, and persists the new id", function() {
    createChunk(7);
    var actual = getChunkIdList();
    expect(actual).toEqual([7]);
    verifyChunkListConsistency(CHUNKS[actual[0]]);
  });

  it("Allows you to create a few chunks", function() {
    createChunk(7);
    createChunk(2, 7);
    createChunk(1, 7);
    var actual = getChunkIdList();
    expect(actual).toEqual([7,1,2]);
    verifyChunkListConsistency(CHUNKS[actual[0]]);
  });

  it("Allows you to create a few chunks at the front", function() {
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

describe("Allows basic things to work", function(){
	it("doesn't fuck this up.", function(){
		expect(true).toEqual(true);
	});
});