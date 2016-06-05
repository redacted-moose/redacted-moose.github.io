var canvas;
var gl;
var colorLoc;
var modelViewLoc;
var projectionLoc;

var vertices = [];
var colors = [];
var indices = [];
var theta = [];
var angles = [];
var c = [];
var s = [];

var cubeSize = 10;
var cubeSize2 = cubeSize / 2.0;
var windowMin = -cubeSize2;
var windowMax = cubeSize + cubeSize2;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;

var projection;
var modelView;
var aspect;

function Program (vertex, fragment) {
	this.program = initShaders(gl, vertex, fragment);
	this.buffers = [];
	this.uniforms = {};
}

Program.prototype.setBuffersAndAttributes = function() {
	for (var buffer in this.buffers) {
		buffer.bind();
	}
};

function initSphereShader() {
	var program = new Program("vertex-shader", "fragment-shader");

	// var circles = makeCircles();

	// Associate our shader variables with our data buffer

	var attribBuffer = {
		id: gl.createBuffer(),
		attrib: gl.getAttribLocation(program.program, "vPosition"),
		bind: function() {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
			gl.vertexAttribPointer(this.attrib, 2, gl.FLOAT, false, 0, 0);
		}
	};

	gl.bindBuffer(gl.ARRAY_BUFFER, attribBuffer.id);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

	gl.vertexAttribPointer(attribBuffer.attrib, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attribBuffer.attrib);

	program.buffers.push(attribBuffer);

	var indexBuffer = {
		id: gl.createBuffer(),
		bind: function() {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
		}
	};

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.id);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

	program.buffers.push(indexBuffer);

	program.uniforms.color = gl.getUniformLocation(program.program, "color");
	program.uniforms.modelView = gl.getUniformLocation(program.program, "modelView");
	program.uniforms.projection = gl.getUniformLocation(program.program, "projection");

	program.render = function() {
	};

	return program;
}

function getMidpointIndex(midpointIndices, vertices, i0, i1) {

	var edgeKey = Math.min(i0, i1) + "_" + Math.max(i0, i1);

	var midpointIndex = midpointIndices[edgeKey];
	if (!midpointIndex) {
		var v0 = vertices[i0];
		var v1 = vertices[i1];

		var midpoint = mix(v0, v1, 0.5);

		midpointIndex = vertices.indexOf(midpoint);
		if (midpointIndex < 0) {
			midpointIndex = vertices.length;
			vertices.push(midpoint);
			midpointIndices[edgeKey] = midpointIndex;
		}
	}

	return midpointIndex;
}

function subdivide(vectors, indices, removeSourceTriangles) {
	var midpointIndices = {};

	var newIndices = [];

	if (!removeSourceTriangles)
		newIndices.push(indices);

	for (var i = 0; i < indices.length - 2; i += 3) {
		var i0 = indices[i];
		var i1 = indices[i + 1];
		var i2 = indices[i + 2];

		var m01 = getMidpointIndex(midpointIndices, vectors, i0, i1);
		var m12 = getMidpointIndex(midpointIndices, vectors, i1, i2);
		var m02 = getMidpointIndex(midpointIndices, vectors, i2, i0);

		newIndices.push(
			i0, m01, m02,
			i1, m12, m01,
			i2, m02, m12,
			m02, m01, m12
		);

	}

	return newIndices;
}

// function triangle(a, b, c) {

//	normalsArray.push(a);
//	normalsArray.push(b);
//	normalsArray.push(c);

//	pointsArray.push(a);
//	pointsArray.push(b);
//	pointsArray.push(c);

//	index += 3;
// }

// function divideTriangle(a, b, c, count) {
//	if (count > 0) {

//		var ab = mix(a, b, 0.5);
//		var ac = mix(a, c, 0.5);
//		var bc = mix(b, c, 0.5);

//		ab = normalize(ab, true);
//		ac = normalize(ac, true);
//		bc = normalize(bc, true);

//		divideTriangle(a, ab, ac, count - 1);
//		divideTriangle(ab, b, bc, count - 1);
//		divideTriangle(bc, c, ac, count - 1);
//		divideTriangle(ab, bc, ac, count - 1);
//	} else {
//		triangle(a, b, c);
//	}
// }

// function tetrahedron(a, b, c, d, n) {
//	divideTriangle(a, b, c, n);
//	divideTriangle(d, c, b, n);
//	divideTriangle(a, d, b, n);
//	divideTriangle(a, c, d, n);
// }

// function sphere(x, y, z, r) {
//	tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
//	// var s = r * Math.sqrt(3) / 2;
//	// var v1 = vec4(x + s/2, y + s/2, z + s/2, 1.0);
//	// var v2 = vec4(x - s/2, y - s/2, z + s/2, 1.0);
//	// var v3 = vec4(x - s/2, y + s/2, z - s/2, 1.0);
//	// var v4 = vec4(x + s/2, y - s/2, z - s/2, 1.0);
//	// tetrahedron(v1, v2, v3, v4, numTimesToSubdivide);
//	for (var i = 0; i < pointsArray.length; i++) {
//		pointsArray[i] = add(scale(r, pointsArray[i]), vec4(x, y, z, 0));
//	}

//	for (i = 0; i < normalsArray.length; i++) {
//		normalsArray[i] = add(normalsArray[i], vec4(x, y, z, 0));
//	}
// }

function icosahedron(vertices, indices) {
	// Creates a unit icosahedron centered at the origin

	indices.push(
		0,4,1,
		0,9,4,
		9,5,4,
		4,5,8,
		4,8,1,
		8,10,1,
		8,3,10,
		5,3,8,
		5,2,3,
		2,7,3,
		7,10,3,
		7,6,10,
		7,11,6,
		11,0,6,
		0,1,6,
		6,1,10,
		9,0,11,
		9,11,2,
		9,2,5,
		7,2,11
	);

	var X = 0.525731112119133606;
	var Z = 0.850650808352039932;

	vertices.push(
		vec4(cubeSize*-X, 0, cubeSize*Z),
		vec4(cubeSize*X, 0, cubeSize*Z),
		vec4(cubeSize*-X, 0, cubeSize*-Z),
		vec4(cubeSize*X, 0, cubeSize*-Z),
		vec4(0, cubeSize*Z, cubeSize*X),
		vec4(0, cubeSize*Z, cubeSize*-X),
		vec4(0, cubeSize*-Z, cubeSize*X),
		vec4(0, cubeSize*-Z, cubeSize*-X),
		vec4(cubeSize*Z, cubeSize*X, 0),
		vec4(cubeSize*-Z, cubeSize*X, 0),
		vec4(cubeSize*Z, cubeSize*-X, 0),
		vec4(cubeSize*-Z, cubeSize*-X, 0)
	);
}

function sphere(x, y, z, r) {
	icosahedron(vertices, indices);

	for (var i = 0; i < 2; i++) { // Broken for i > 2
		indices = subdivide(vertices, indices, true);
	}

	// normalize vectors to "inflate" the icosahedron into a sphere.
	for (i = 0; i < vertices.length; i++) {
		vertices[i] = scale(r, add(normalize(vertices[i]), vec4(x, y, z, 0.0)));
		vertices[i][3] = 1.0;
	}
}

window.onload = function init() {
	canvas = document.getElementById("gl-canvas");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}

	colors = [
		vec4(1.0, 0.0, 0.0, 1.0), // red
		vec4(1.0, 1.0, 0.0, 1.0), // yellow
		vec4(0.0, 1.0, 0.0, 1.0), // green
		vec4(0.0, 0.0, 1.0, 1.0), // blue
		vec4(1.0, 0.0, 1.0, 1.0), // magenta
		vec4(0.0, 1.0, 1.0, 1.0) // cyan
	];

	sphere(0, 0, 0, cubeSize);

	console.log(vertices);
	console.log(indices);

	theta[0] = 0.0;
	theta[1] = 0.0;
	theta[2] = 0.0;

	//
	//  Configure WebGL
	//
	gl.viewport(0, 0, canvas.width, canvas.height);
	aspect = canvas.width / canvas.height;
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	projection = perspective(45.0, aspect, 1, 10 * cubeSize);
	//projection = ortho (windowMin, windowMax, windowMin, windowMax, windowMin, windowMax+cubeSize);
	// Register event listeners for the buttons

	var a = document.getElementById("XButton");
	a.addEventListener("click", function() {
		axis = xAxis;
	});
	var b = document.getElementById("YButton");
	b.addEventListener("click", function() {
		axis = yAxis;
	});
	var c = document.getElementById("ZButton");
	c.addEventListener("click", function() {
		axis = zAxis;
	});
	var d = document.getElementById("Reset");
	d.addEventListener("click", function() {
		theta = [0.0, 0.0, 0.0];
		axis = xAxis;
	});

	//  Load shaders and initialize attribute buffers

	// var program = initSphereShader();
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	colorLoc = gl.getUniformLocation(program, "color");
	modelViewLoc = gl.getUniformLocation(program, "modelView");
	projectionLoc = gl.getUniformLocation(program, "projection");
	gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));

	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	var iBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

	// Load translation and viewing matrices which don't change each render

	// tz1 = mat4(1.0, 0.0, 0.0, -cubeSize2,
	//		   0.0, 1.0, 0.0, -cubeSize2,
	//		   0.0, 0.0, 1.0, -cubeSize2,
	//		   0.0, 0.0, 0.0, 1.0);

	// tz2 = mat4(1.0, 0.0, 0.0, cubeSize2,
	//		   0.0, 1.0, 0.0, cubeSize2,
	//		   0.0, 0.0, 1.0, cubeSize2,
	//		   0.0, 0.0, 0.0, 1.0);

	tz1 = mat4(1.0, 0.0, 0.0, 0,
			   0.0, 1.0, 0.0, 0,
			   0.0, 0.0, 1.0, 0,
			   0.0, 0.0, 0.0, 1.0);

	tz2 = mat4(1.0, 0.0, 0.0, 0,
			   0.0, 1.0, 0.0, 0,
			   0.0, 0.0, 1.0, 0,
			   0.0, 0.0, 0.0, 1.0);

	// looking = lookAt(vec3(cubeSize2, cubeSize2, 4 * cubeSize), vec3(cubeSize2, cubeSize2, 0), vec3(0.0, 1.0, 0.0));
	looking = lookAt(vec3(cubeSize2, cubeSize2, 4 * cubeSize), vec3(0, 0, 0), vec3(0.0, 1.0, 0.0));

	render();
};

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	theta[axis] += 0.5;

	for (i = 0; i < 3; i++) {
		angles[i] = radians(theta[i]);
		c[i] = Math.cos(angles[i]);
		s[i] = Math.sin(angles[i]);
	}

	rx = mat4(1.0, 0.0, 0.0, 0.0,
			  0.0, c[0], -s[0], 0.0,
			  0.0, s[0], c[0], 0.0,
			  0.0, 0.0, 0.0, 1.0);

	ry = mat4(c[1], 0.0, s[1], 0.0,
			  0.0, 1.0, 0.0, 0.0, -s[1], 0.0, c[1], 0.0,
			  0.0, 0.0, 0.0, 1.0);

	rz = mat4(c[2], -s[2], 0.0, 0.0,
			  s[2], c[2], 0.0, 0.0,
			  0.0, 0.0, 1.0, 0.0,
			  0.0, 0.0, 0.0, 1.0);

	rotation = mult(rz, mult(ry, rx));
	modelView = mult(looking, mult(tz2, mult(rotation, tz1)));
	gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
	for (var i = 0; i < indices.length/3; i++) {
		gl.uniform4fv(colorLoc, colors[i % 6]);
		gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 3 * i);
	}

	// 	for (var program of programs) {
	// 		gl.useProgram(program.program);
	// 		program.setBuffersAndAttributes();
	// 		program.render();
	// 	}

	requestAnimFrame(render);
}
