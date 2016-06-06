// 'use strict';
var canvas;
var gl;
// var colorLoc;
// var modelViewLoc;
// var projectionLoc;

// var vertices = [];
var colors = [];
// var indices = [];
var theta = [];
var angles = [];
// var c = [];
// var s = [];
var programs = [];

var cubeSize = 10;
var cubeSize2 = cubeSize / 2.0;
var windowMin = -cubeSize2;
var windowMax = cubeSize + cubeSize2;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 1;

var projection;
var modelView;
var aspect;

function Program (vertex, fragment) {
	this.shader = initShaders(gl, vertex, fragment);
	this.buffers = [];
	this.uniforms = {};
}

Program.prototype.setBuffersAndAttributes = function() {
	this.buffers.forEach(
		function (buffer) {
			buffer.bind();
		}
	);
};

function Buffer () {
	this.id = gl.createBuffer();
}

// Buffer.prototype.bind = function() {};

function AttribBuffer (program, verticesName) {
	Buffer.call(this);
	this.attrib = gl.getAttribLocation(program.shader, verticesName);
}

AttribBuffer.prototype = Object.create(Buffer.prototype);

AttribBuffer.prototype.bind = function() {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
	gl.vertexAttribPointer(this.attrib, 4, gl.FLOAT, false, 0, 0);
};

function IndexBuffer () {
	Buffer.call(this);
}

IndexBuffer.prototype = Object.create(Buffer.prototype);

IndexBuffer.prototype.bind = function() {
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
};

function SphereShader (position, radius, vertex, fragment) {
	Program.call(this, vertex, fragment);

	var points = sphere(position[0], position[1], position[2], radius);

	console.log(points.vertices);
	console.log(points.indices);

	this.vertices = points.vertices;
	this.indices = points.indices;

	// Associate our shader variables with our data buffer
	var attribBuffer = new AttribBuffer(this, "vPosition");

	gl.bindBuffer(gl.ARRAY_BUFFER, attribBuffer.id);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);

	gl.vertexAttribPointer(attribBuffer.attrib, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attribBuffer.attrib);

	this.buffers.push(attribBuffer);

	var indexBuffer = new IndexBuffer();

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.id);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(this.indices), gl.STATIC_DRAW);

	this.buffers.push(indexBuffer);

	this.uniforms.color = gl.getUniformLocation(this.shader, "color");
	this.uniforms.modelView = gl.getUniformLocation(this.shader, "modelView");
	this.uniforms.projection = gl.getUniformLocation(this.shader, "projection");

	// this.render = function() {
	//	for (var i = 0; i < points.indices.length/3; i++) {
	//		gl.uniform4fv(this.uniforms.color, colors[i % 6]);
	//		gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 3 * i);
	//	}
	// };
}

SphereShader.prototype = Object.create(Program.prototype);

SphereShader.prototype.render = function() {

	// var rx = rotate(theta[0], vec3(1.0, 0.0, 0.0));
	// var ry = rotate(theta[1], vec3(0.0, 1.0, 0.0));
	// var rz = rotate(theta[2], vec3(0.0, 0.0, 1.0));

	// var rotation = mult(rz, mult(ry, rx));
	// modelView = mult(looking, mult(tz2, mult(rotation, tz1)));
	var modelView = this.getModelView();

	gl.uniformMatrix4fv(this.uniforms.modelView, false, flatten(modelView));

	for (var i = 0; i < this.indices.length/3; i++) {
		gl.uniform4fv(this.uniforms.color, colors[i % 6]);
		gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 3 * i);
	}
};

SphereShader.prototype.getModelView = function() {
	var rx = rotate(theta[0], vec3(1.0, 0.0, 0.0));
	var ry = rotate(theta[1], vec3(0.0, 1.0, 0.0));
	var rz = rotate(theta[2], vec3(0.0, 0.0, 1.0));

	var rotation = mult(rz, mult(ry, rx));
	return mult(looking, mult(tz2, mult(rotation, tz1)));
};

// function Sphere (position, radius) {
// 	this.shader = new SphereShader("vertex-shader", "fragment-shader")
// }

function SkyboxShader (vertex, fragment) {
	Program.call(this, vertex, fragment);

	var size = 500;

	this.vertices = [
		vec4(-size,  size, -size),
	    vec4(-size, -size, -size),
	    vec4(size, -size, -size),
	    vec4(size, -size, -size),
	    vec4(size,  size, -size),
	    vec4(-size,  size, -size),

	    vec4(-size, -size,  size),
	    vec4(-size, -size, -size),
	    vec4(-size,  size, -size),
	    vec4(-size,  size, -size),
	    vec4(-size,  size,  size),
	    vec4(-size, -size,  size),

	    vec4(size, -size, -size),
	    vec4(size, -size,  size),
	    vec4(size,  size,  size),
	    vec4(size,  size,  size),
	    vec4(size,  size, -size),
	    vec4(size, -size, -size),

	    vec4(-size, -size,  size),
	    vec4(-size,  size,  size),
	    vec4(size,  size,  size),
	    vec4(size,  size,  size),
	    vec4(size, -size,  size),
	    vec4(-size, -size,  size),

	    vec4(-size,  size, -size),
	    vec4(size,  size, -size),
	    vec4(size,  size,  size),
	    vec4(size,  size,  size),
	    vec4(-size,  size,  size),
	    vec4(-size,  size, -size),

	    vec4(-size, -size, -size),
	    vec4(-size, -size,  size),
	    vec4(size, -size, -size),
	    vec4(size, -size, -size),
	    vec4(-size, -size,  size),
	    vec4(size, -size,  size)

	];

	// this.vertices = [
	// 	vec4(-size,  size, -size), // 0
	//     vec4(-size, -size, -size), // 1
	//     vec4(size, -size, -size), // 2
	//     vec4(size,  size, -size), // 3
	//     vec4(-size, -size,  size), // 4
	//     vec4(-size,  size,  size), // 5
	//     vec4(size, -size,  size), // 6
	//     vec4(size,  size,  size), // 7
	// ];

	// this.indices = [
	// 	0, 1, 2, 2, 3, 0, // front face
	// 	4, 1, 0, 0, 5, 4, // right face
	// 	2, 6, 7, 7, 3, 2, // bottom face
	// 	4, 5, 7, 7, 6, 4, // top face
	// 	0, 3, 7, 7, 5, 0, // back face
	// 	1, 4, 2, 2, 4, 6 // left face
	// ];

	var attribBuffer = new AttribBuffer(this, "vPosition");

	gl.bindBuffer(gl.ARRAY_BUFFER, attribBuffer.id);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);

	gl.vertexAttribPointer(attribBuffer.attrib, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attribBuffer.attrib);

	this.buffers.push(attribBuffer);

	// var indexBuffer = new IndexBuffer();

	// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.id);
	// gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(this.indices), gl.STATIC_DRAW);

	// this.buffers.push(indexBuffer);

	// this.uniforms.cubeMap = gl.getUniformLocation(this.shader, "cubeMap");
	this.uniforms.modelView = gl.getUniformLocation(this.shader, "modelView");
	this.uniforms.projection = gl.getUniformLocation(this.shader, "projection");

	var texture1;

	var count = 0;
	var img = new Array(6);
	var locs = ["nightFront.png", "nightBack.png", "nightLeft.png",
				"nightRight.png", "nightTop.png", "nightBottom.png"];

	for (var i = 0; i < 6; i++) {
		img[i] = new Image();
		img[i].onload = function() {
			count++;
			if (count == 6) {
				texture1 = gl.createTexture();
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture1);
				var targets = [
					gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
					gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
					gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y
				];
				for (var j = 0; j < 6; j++) {
					gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);

					gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				}
				gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
			}
		};
		img[i].src = locs[i];
	}

	this.textureID = texture1;

    // gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture1);

    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, front);
	// gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, back);
	// gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, right);
	// gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, left);
	// gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, top);
	// gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, bottom);

    // gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

    // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	// gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
	// gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	// gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	// gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture1);
    // gl.uniform1i(this.uniforms.cubeMap, 0);
}

SkyboxShader.prototype = Object.create(Program.prototype);

SkyboxShader.prototype.render = function() {
	modelView = mult(looking, mult(tz2, tz1));

	gl.uniformMatrix4fv(this.uniforms.modelView, false, flatten(modelView));
	gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length);

	// for (var i = 0; i < this.vertices.length/6; i++) {
	// 	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 6 * i);
	// }
};

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
	var vertices = [];
	var indices = [];
	icosahedron(vertices, indices);

	for (var i = 0; i < 2; i++) { // Broken for i > 2
		indices = subdivide(vertices, indices, true);
	}

	// normalize vectors to "inflate" the icosahedron into a sphere.
	for (i = 0; i < vertices.length; i++) {
		vertices[i] = add(scale(r, normalize(vertices[i])), vec4(x, y, z, 0.0));
		vertices[i][3] = 1.0;
	}

	return {
		vertices: vertices,
		indices: indices
	};
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
	projection = perspective(45.0, aspect, 1, 100 * cubeSize);

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

	var program = new SphereShader(vec3(0, 0, 0), 4, "vertex-shader", "fragment-shader");
	programs.push(program);
	gl.useProgram(program.shader);
	gl.uniformMatrix4fv(program.uniforms.projection, false, flatten(projection));

	var program2 = new SphereShader(vec3(10, 0, 0), 2, "vertex-shader", "fragment-shader");
	programs.push(program2);
	gl.useProgram(program2.shader);
	gl.uniformMatrix4fv(program2.uniforms.projection, false, flatten(projection));

	var program3 = new SkyboxShader("skybox-vertex-shader", "skybox-fragment-shader");
	programs.push(program3);
	gl.useProgram(program3.shader);
	gl.uniformMatrix4fv(program3.uniforms.projection, false, flatten(projection));

	// Load translation and viewing matrices which don't change each render

	// tz1 = mat4(1.0, 0.0, 0.0, -cubeSize2,
	//		   0.0, 1.0, 0.0, -cubeSize2,
	//		   0.0, 0.0, 1.0, -cubeSize2,
	//		   0.0, 0.0, 0.0, 1.0);

	// tz2 = mat4(1.0, 0.0, 0.0, cubeSize2,
	//		   0.0, 1.0, 0.0, cubeSize2,
	//		   0.0, 0.0, 1.0, cubeSize2,
	//		   0.0, 0.0, 0.0, 1.0);

	tz1 = translate(0, 0, 0);
	tz2 = translate(0, 0, 0);

	// looking = lookAt(vec3(cubeSize2, cubeSize2, 4 * cubeSize), vec3(cubeSize2, cubeSize2, 0), vec3(0.0, 1.0, 0.0));
	eye = vec3(cubeSize2, cubeSize2, 4 * cubeSize);
	at = vec3(0, 0, 0);
	up = vec3(0.0, 1.0, 0.0);
	looking = lookAt(eye, at, up);

	render();
};

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	theta[axis] += 0.5;

	programs.forEach(
		function (program) {
			gl.useProgram(program.shader);
			program.setBuffersAndAttributes();
			program.render();
		}
	);

	requestAnimFrame(render);
}
