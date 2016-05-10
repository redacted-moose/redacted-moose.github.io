var gl;
var points;

var M=8, N=8;
// var top = -0.95, bottom = 0.95, right = 0.95, left = -0.95; // Bounding box

var temp = [];
var cells = [];
var vertLines = [];
var horizLines = [];

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

	points = [];

	for (var y1 = 0; y1 <= M; y1++) {
		for (var x1 = 0; x1 < N; x1++) {
			horizLines[y1*M + x1] = mapCoordsHoriz(x1, y1);
		}
	}

	for (var x2 = 0; x2 <= N; x2++) {
		for (var y2 = 0; y2 < M; y2++) {
			vertLines[x2*N + y2] = mapCoordsVert(x2, y2);
		}
	}

	for (var index = 0; index < M*N; index++) {
		cells.push(false);
	}

	generateMaze();

	temp = horizLines.concat(vertLines);

	for (var i = 0; i < temp.length; i++) {
		var current = temp[i];
		if (current.active) {
			points.push(current.start, current.end);
			// console.log("i: " + i + " current: " + current + "\n");
		}
	}

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate our shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.LINES, 0, points.length );
}

function predicate(element, index, array) {
	return !element;
}

function getNeighboringCells(cell) {
	var result = [];

	if (cell.x > 0 && !cells[M*cell.y + cell.x - 1]) {
		result.push({
			x: cell.x - 1,
			y: cell.y
		});
	}

	if (cell.y > 0 && !cells[M*(cell.y - 1) + cell.x]) {
		result.push({
			x: cell.x,
			y: cell.y - 1
		});
	}

	if (cell.x < (N - 1) && !cells[M*cell.y + cell.x + 1]) {
		result.push({
			x: cell.x + 1,
			y: cell.y
		});
	}

	if (cell.y < (M - 1) && !cells[M*(cell.y + 1) + cell.x]) {
		result.push({
			x: cell.x,
			y: cell.y + 1
		});
	}

	return result;
}

function generateMaze() {
	var stack = [];
    var currentCell = {
		x: Math.floor(Math.random() * M),
		y: Math.floor(Math.random() * N)
	};

    console.log(currentCell.x, currentCell.y);
	cells[M*currentCell.y + currentCell.x] = true;

	while (cells.some(predicate)) {

		var neighbors = getNeighboringCells(currentCell);
		console.log(neighbors);

		if (neighbors.length !== 0) {

			stack.push(currentCell);
			var nextCell = neighbors[Math.floor(Math.random() * neighbors.length)];
			console.log(nextCell);

			if (currentCell.x < nextCell.x) {

				vertLines[N*(currentCell.x + 1) + currentCell.y].active = false;

			} else if (currentCell.x > nextCell.x) {

				vertLines[N*currentCell.x + currentCell.y].active = false;

			} else if (currentCell.y < nextCell.y) {

				horizLines[M*(currentCell.y + 1) + currentCell.x].active = false;

			} else { // currentCell.y > nextCell.y

				horizLines[M*currentCell.y + currentCell.x].active = false;

			}

			currentCell = nextCell;
			console.log("Next neighbor");
			console.log(currentCell);
			cells[M*currentCell.y + currentCell.x] = true;

		} else if (stack.length !== 0) {

			currentCell = stack.pop();
			console.log("Popped stack");
			console.log(currentCell.x, currentCell.y);

		} else {

			console.log("Done!");
			break;

		}

	}
}

function mapCoordsHoriz(x, y) {
	// return {
	// 	active: true,
	// 	start: vec2(x*(right - left)/N - 1, y*(bottom - top)/M - 1),
	// 	end: vec2((x + 1)*(right - left)/N - 1, y*(bottom - top)/M - 1)
	// };
	return {
		active: true,
		start: vec2(x*(2)/N - 1, y*(2)/M - 1),
		end: vec2((x + 1)*(2)/N - 1, y*(2)/M - 1)
	};
}

function mapCoordsVert(x, y) {
	// return {
	// 	active: true,
	// 	start: vec2(x*(right - left)/N - 1, y*(bottom - top)/M - 1),
	// 	end: vec2(x*(right - left)/N - 1, (y + 1)*(bottom - top)/M - 1)
	// };
	return {
		active: true,
		start: vec2(x*(2)/N - 1, y*(2)/M - 1),
		end: vec2(x*(2)/N - 1, (y + 1)*(2)/M - 1)
	};
}
