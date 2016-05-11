/*jshint esversion: 6 */

var gl;
var canvas;

class Program {
	constructor(vertex, fragment) {
		this.program = initShaders(gl, vertex, fragment);
		this.buffers = [];
		this.uniforms = {};
	}

	setBuffersAndAttributes() {
		for (var buffer of this.buffers) {
			buffer.bind();
		}
	}
}

var programs = [];

// Game state variables

class Cell {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.color = ((x % 2 == 1 && y % 2 != 1) || (x % 2 != 1 && y % 2 == 1)) ?
			Color.CELL_BLACK : Color.CELL_RED;
	}
}

class Checker {
	constructor(x, y, player, color) {
		this.x = x;
		this.y = y;
		this.player = player;
		this.color = color;
		if (this.player == Player.BLACK) {
			this.directions = [{
				dx: 1,
				dy: -1
			}, {
				dx: -1,
				dy: -1
			}];
		} else {
			this.directions = [{
				dx: 1,
				dy: 1
			}, {
				dx: -1,
				dy: 1
			}];
		}
	}

	// Map board coordinates ([0,0] to [7,7]) to viewport coords ([-1, 1] to [1, -1])
	toViewportCoords() {
		return vec2((2 * this.x + 1) / 8 - 1, (-2 * this.y - 1) / 8 + 1);
	}
}

class GameState {
	constructor() {
		this.boardState = [
			// Reds
			new Checker(1, 0, Player.RED, Color.CHECKER_RED),
			new Checker(3, 0, Player.RED, Color.CHECKER_RED),
			new Checker(5, 0, Player.RED, Color.CHECKER_RED),
			new Checker(7, 0, Player.RED, Color.CHECKER_RED),
			new Checker(0, 1, Player.RED, Color.CHECKER_RED),
			new Checker(2, 1, Player.RED, Color.CHECKER_RED),
			new Checker(4, 1, Player.RED, Color.CHECKER_RED),
			new Checker(6, 1, Player.RED, Color.CHECKER_RED),
			new Checker(1, 2, Player.RED, Color.CHECKER_RED),
			new Checker(3, 2, Player.RED, Color.CHECKER_RED),
			new Checker(5, 2, Player.RED, Color.CHECKER_RED),
			new Checker(7, 2, Player.RED, Color.CHECKER_RED),

			// Blacks
			new Checker(0, 5, Player.BLACK, Color.CHECKER_BLACK),
			new Checker(2, 5, Player.BLACK, Color.CHECKER_BLACK),
			new Checker(4, 5, Player.BLACK, Color.CHECKER_BLACK),
			new Checker(6, 5, Player.BLACK, Color.CHECKER_BLACK),
			new Checker(1, 6, Player.BLACK, Color.CHECKER_BLACK),
			new Checker(3, 6, Player.BLACK, Color.CHECKER_BLACK),
			new Checker(5, 6, Player.BLACK, Color.CHECKER_BLACK),
			new Checker(7, 6, Player.BLACK, Color.CHECKER_BLACK),
			new Checker(0, 7, Player.BLACK, Color.CHECKER_BLACK),
			new Checker(2, 7, Player.BLACK, Color.CHECKER_BLACK),
			new Checker(4, 7, Player.BLACK, Color.CHECKER_BLACK),
			new Checker(6, 7, Player.BLACK, Color.CHECKER_BLACK)
		];

		this.cells = this.makeCells();
		this.selectedChecker = undefined;
		this.openPositions = [];
		this.currentPlayer = Player.BLACK;
	}

	static toBoardCoords(x, y) {
		return {
			x: Math.floor((8 * (x + 1)) / 2),
			y: Math.floor((8 * (-y + 1)) / 2)
		};
	}

	select(checker) {
		if (checker === undefined || checker.player !== this.currentPlayer) return;
		this.selectedChecker = checker;
		// console.log(this.selectedChecker);
		this.openPositions = this.findOpenPositions(this.selectedChecker);
		this.highlight();
	}

	mouse(event) {
		var canvasXOffset = canvas.offsetLeft;
		var canvasYOffset = canvas.offsetTop;

		var mouseCoords = {
			x: -1 + 2 * (event.clientX - canvasXOffset) / canvas.width,
			y: -1 + 2 * (canvas.height - event.clientY + canvasYOffset) / canvas.height
		};
		// console.log("Mouse clicked at: " + mouseCoords.x + ", " + mouseCoords.y);
		var coords = GameState.toBoardCoords(mouseCoords.x, mouseCoords.y);
		// console.log("Board coords: " + coords.x + ", " + coords.y);

		return coords;
	}

	// Remove an enemy from a jump attack
	removeEnemy(availableSpace) {
		var check = {
			dx: (availableSpace.x - this.selectedChecker.x) / 2,
			dy: (availableSpace.y - this.selectedChecker.y) / 2
		};
		// console.log(check);

		// Find the enemy
		var enemy = this.findChecker(this.selectedChecker.x + check.dx, this.selectedChecker.y + check.dy);
		// console.log(enemy);
		// If it exists, remove it from the board
		if (enemy !== undefined) {
			var index = this.boardState.indexOf(enemy);
			if (index > -1) {
				this.boardState.splice(index, 1);
			}
		}
	}

	onClick(event) {
		var coords = this.mouse(event);
		var tempChecker = this.findChecker(coords.x, coords.y);

		if (this.selectedChecker === undefined) {
			this.select(tempChecker);
		} else {
			this.unhighlight();
			if (tempChecker === undefined) {

				var availableSpace = this.openPositions.find(function(position) {
					return position.x === coords.x && position.y === coords.y;
				});

				if (availableSpace !== undefined) {
					this.removeEnemy(availableSpace);
					this.selectedChecker.x = coords.x;
					this.selectedChecker.y = coords.y;
				} else {
					this.selectedChecker = undefined;
				}
			} else if (tempChecker.player === this.currentPlayer) {
				this.select(tempChecker);
			} else {
				this.selectedChecker = undefined;
			}
		}
	}

	endTurn() {
		if (this.selectedChecker !== undefined) {
			this.unhighlight();
		}

		var elem = document.getElementById("EndTurn");

		if (this.currentPlayer === Player.BLACK) {
			this.currentPlayer = Player.RED;
			elem.innerHTML = "End Red's Turn";
		} else {
			this.currentPlayer = Player.BLACK;
			elem.innerHTML = "End Black's Turn";
		}

		// console.log("Player " + this.currentPlayer + "'s turn");
		this.selectedChecker = undefined;
	}

	highlighter(checkerColor, boardColor) {
		if (this.openPositions.length > 0) {
			this.selectedChecker.color = checkerColor;

			this.findCell(this.selectedChecker.x, this.selectedChecker.y).color = boardColor;

			for (let position of this.openPositions) {
				this.findCell(position.x, position.y).color = boardColor;
			}
		}
	}

	unhighlight() {
		if (this.selectedChecker.player == Player.BLACK) {
			this.highlighter(Color.CHECKER_BLACK, Color.CELL_BLACK);
		} else {
			this.highlighter(Color.CHECKER_RED, Color.CELL_BLACK);
		}
	}

	highlight() {
		if (this.selectedChecker.player == Player.BLACK) {
			this.highlighter(Color.CHECKER_BLACK_SELECTED, Color.CELL_BLACK_SELECTED);
		} else {
			this.highlighter(Color.CHECKER_RED_SELECTED, Color.CELL_BLACK_SELECTED);
		}
	}

	findChecker(x, y) {
		return this.boardState.find(function(checker) {
			return checker.x === x && checker.y === y;
		});
	}

	findCell(x, y) {
		return this.cells.find(function(cell) {
			return cell.x == x && cell.y == y;
		});
	}

	makeCells() {
		var cells = [];

		for (var y = 0; y < 8; y++) {
			for (var x = 0; x < 8; x++) {
				cells.push(new Cell(x, y));
			}
		}

		return cells;
	}

	findOpenPositions(checker) {
		var positions = [];

		for (var direction of checker.directions) {
			var temp = this.findChecker(checker.x + direction.dx, checker.y + direction.dy);

			if (temp !== undefined) {
				if (temp.player !== this.currentPlayer) {
					var temp2 = this.findChecker(checker.x + 2 * direction.dx, checker.y + 2 * direction.dy);
					if (temp2 === undefined) {
						positions.push({
							x: checker.x + 2 * direction.dx,
							y: checker.y + 2 * direction.dy
						});
					}
				}
			} else {
				if (checker.x + direction.dx >= 0 && checker.x + direction.dx <= 7 &&
					checker.y + direction.dy >= 0 && checker.y + direction.dy <= 7) {
					positions.push({
						x: checker.x + direction.dx,
						y: checker.y + direction.dy
					});
				}
			}
		}

		return positions;
	}
}

var Color = {
	CHECKER_RED: vec4(0.9, 0.0, 0.0, 1.0),
	CHECKER_BLACK: vec4(0.7, 0.7, 0.7, 1.0),
	CELL_RED: vec4(0.7, 0.0, 0.0, 1.0),
	CELL_BLACK: vec4(0.0, 0.0, 0.0, 1.0),
	CHECKER_RED_SELECTED: vec4(1.0, 0.0, 0.0, 1.0),
	CHECKER_BLACK_SELECTED: vec4(0.7, 0.7, 0.7, 1.0),
	CELL_RED_SELECTED: vec4(0.8, 0.0, 0.0, 1.0),
	CELL_BLACK_SELECTED: vec4(0.1, 0.1, 0.1, 1.0)
};

var Player = {
	BLACK: 1,
	RED: 2
};

var state = new GameState();

window.onload = function init() {
	canvas = document.getElementById("gl-canvas");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}

	//
	//  Configure WebGL
	//
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	// cells = makeCells();

	//  Load shaders and initialize attribute buffers
	programs.push(initBackgroundShader(), initCheckerShader());

	// Set up event listeners
	canvas.addEventListener("click", function(event) {
		state.onClick(event);
	});
	document.getElementById("EndTurn").addEventListener("click", function(event) {
		state.endTurn();
	});

	render();
};

function initCheckerShader() {
	var program = new Program("checkers-vertex-shader", "checkers-fragment-shader");

	var circles = makeCircles();

	// Associate our shader variables with our data buffer

	var bufferObj = {
		id: gl.createBuffer(),
		attrib: gl.getAttribLocation(program.program, "vPosition"),
		bind: function() {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
			gl.vertexAttribPointer(this.attrib, 2, gl.FLOAT, false, 0, 0);
		}
	};

	gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.id);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(circles), gl.STATIC_DRAW);

	gl.vertexAttribPointer(bufferObj.attrib, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(bufferObj.attrib);

	program.buffers.push(bufferObj);

	program.uniforms.color = gl.getUniformLocation(program.program, "color");
	program.uniforms.offset = gl.getUniformLocation(program.program, "offset");

	program.render = function() {
		for (var checker of state.boardState) {
			gl.uniform2fv(this.uniforms.offset, checker.toViewportCoords());
			gl.uniform4fv(this.uniforms.color, checker.color);
			gl.drawArrays(gl.TRIANGLE_FAN, 0, circles.length);
		}
	};

	return program;
}

function initBackgroundShader() {
	var program = new Program("background-vertex-shader", "background-fragment-shader");

	var points = makePoints();
	var indices = makeIndices();

	// Associate our shader variables with our data buffer

	var bufferObj1 = {
		id: gl.createBuffer(),
		attrib: gl.getAttribLocation(program.program, "vPosition"),
		bind: function() {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
			gl.vertexAttribPointer(this.attrib, 2, gl.FLOAT, false, 0, 0);
		}
	};

	gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj1.id);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

	gl.vertexAttribPointer(bufferObj1.attrib, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(bufferObj1.attrib);

	var bufferObj2 = {
		id: gl.createBuffer(),
		bind: function() {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
		}
	};

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj2.id);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

	program.buffers.push(bufferObj1, bufferObj2);

	program.uniforms.color = gl.getUniformLocation(program.program, "color");

	program.render = function() {
		// For every square, set the color and draw it
		for (var cell of state.cells) {
			gl.uniform4fv(this.uniforms.color, cell.color);
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 6 * (8 * cell.y + cell.x));
		}
	};

	// console.log(program);

	return program;
}

function makeCircles() {
	return makeCircle(3 / 32, 0, 0);
}

function makeCircle(radius, x, y) {
	var circle = [];
	circle.push(vec2(x, y)); // Center
	for (var i = 0; i < 32; i++) {
		circle.push(vec2(x + radius * Math.cos(2 * i * Math.PI / 32), y + radius * Math.sin(2 * i * Math.PI / 32)));
	}
	circle.push(circle[1]); // Last point
	// console.log(circle);
	return circle;
}

function makePoints() {
	var points = [];
	for (var y = 0; y <= 8; y++) {
		for (var x = 0; x <= 8; x++) {
			points.push(vec2((x / 4) - 1, 1 - (y / 4)));
		}
	}

	return points;
}

function makeIndices() {
	var indices = [];
	for (var y = 0; y < 8; y++) {
		for (var x = 0; x < 8; x++) {
			indices.push(y * 9 + x, y * 9 + x + 1, (y + 1) * 9 + x);
			indices.push((y + 1) * 9 + x, y * 9 + x + 1, (y + 1) * 9 + x + 1);
		}
	}

	return indices;
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);

	for (var program of programs) {
		gl.useProgram(program.program);
		program.setBuffersAndAttributes();
		program.render();
	}

	requestAnimFrame(render);
}
