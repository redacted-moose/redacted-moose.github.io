var canvas;
var gl;

var colors = [];
var theta = [];
var angles = [];
var entities = [];

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

// Helper functions

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

function icosahedron() {
	// Creates a unit icosahedron centered at the origin
	var vertices = [];
	var indices = [];

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

	return {
		vertices: vertices,
		indices: indices
	};
}

function sphere() {
	// var vertices = [];
	// var indices = [];
	var points = icosahedron();
	var vertices = points.vertices;
	var indices = points.indices;

	// Subdivide a couple times
	for (var i = 0; i < 2; i++) { // Broken for i > 2
		indices = subdivide(vertices, indices, true);
	}

	// Normalize vectors to "inflate" the icosahedron into a sphere.
	for (i = 0; i < vertices.length; i++) {
		vertices[i] = normalize(vertices[i]);
		vertices[i][3] = 1.0;
	}

	// Because vertices are normalized, they are the normals at the point on the sphere mesh
	var normals = vertices.slice();

	return {
		vertices: vertices,
		indices: indices,
		normals: normals
	};
}

// Classes

function Shader (vertex, fragment) {
	this.program = initShaders(gl, vertex, fragment);
	this.buffers = [];
	this.uniforms = {};
}
Shader.prototype.setBuffersAndAttributes = function() {
	this.buffers.forEach(
		function (buffer) {
			buffer.bind();
		}
	);
};

function Buffer () {
	this.id = gl.createBuffer();
}

function AttribBuffer (shader, verticesName, data) {
	Buffer.call(this);
	this.attrib = gl.getAttribLocation(shader.program, verticesName);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

	gl.vertexAttribPointer(this.attrib, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(this.attrib);
}
AttribBuffer.prototype = Object.create(Buffer.prototype);
AttribBuffer.prototype.bind = function() {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
	gl.vertexAttribPointer(this.attrib, 4, gl.FLOAT, false, 0, 0);
};

function IndexBuffer (data) {
	Buffer.call(this);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(data), gl.STATIC_DRAW);
}
IndexBuffer.prototype = Object.create(Buffer.prototype);
IndexBuffer.prototype.bind = function() {
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
};

function SphereShader (vertex, fragment) {
	Shader.call(this, vertex, fragment);

	var points = sphere();

	console.log(points.vertices);
	console.log(points.indices);

	this.vertices = points.vertices;
	this.indices = points.indices;
	this.normals = points.normals;

	// Associate our shader variables with our data buffer
	var attribBuffer = new AttribBuffer(this, "vPosition", this.vertices);
	this.buffers.push(attribBuffer);

	var indexBuffer = new IndexBuffer(this.indices);
	this.buffers.push(indexBuffer);

	this.uniforms.color = gl.getUniformLocation(this.program, "color");
	this.uniforms.modelView = gl.getUniformLocation(this.program, "modelView");
	this.uniforms.projection = gl.getUniformLocation(this.program, "projection");
}
SphereShader.prototype = Object.create(Shader.prototype);

function PlanetShader (vertex, fragment) {
	Shader.call(this, vertex, fragment);

	var points = sphere();

	console.log(points.vertices);
	console.log(points.indices);

	this.vertices = points.vertices;
	this.indices = points.indices;
	this.normals = points.normals;

	// this.lightPosition = vec4(0.0, 0.0, 0.0, 0.0);
	this.lightPosition = vec4(0.0, 0.0, 0.0, 0.0);
	this.lightAmbient = vec4(0.1, 0.1, 0.1, 1.0);
	this.lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
	this.lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

	// var materialAmbient = vec4(0.02, 0.02, 0.02, 1.0);
	// var materialDiffuse = vec4(0.05, 0.05, 0.0, 1.0);
	// var materialSpecular = vec4(0.5, 0.5, 0.5, 1.0);
	this.materialShininess = 1.0;

    this.ambientProduct = vec4(); //mult(this.lightAmbient, materialAmbient);
    // this.diffuseProduct = mult(lightDiffuse, materialDiffuse);
	this.diffuseProduct = vec4();
    this.specularProduct = vec4(); //mult(this.lightSpecular, materialSpecular);

	// Associate our shader variables with our data buffer
	var attribBuffer = new AttribBuffer(this, "vPosition", this.vertices);
	this.buffers.push(attribBuffer);

	var normalBuffer = new AttribBuffer(this, "vNormal", this.normals);
	this.buffers.push(normalBuffer);

	var indexBuffer = new IndexBuffer(this.indices);
	this.buffers.push(indexBuffer);

	this.uniforms.color = gl.getUniformLocation(this.program, "color");
	this.uniforms.modelView = gl.getUniformLocation(this.program, "modelView");
	this.uniforms.projection = gl.getUniformLocation(this.program, "projection");

	this.uniforms.lightPosition = gl.getUniformLocation(this.program, "lightPosition");
	this.uniforms.ambientProduct = gl.getUniformLocation(this.program, "ambientProduct");
	this.uniforms.diffuseProduct = gl.getUniformLocation(this.program, "diffuseProduct");
	this.uniforms.specularProduct = gl.getUniformLocation(this.program, "specularProduct");
	this.uniforms.shininess = gl.getUniformLocation(this.program, "shininess");
}
PlanetShader.prototype = Object.create(SphereShader.prototype);

function SkyboxShader (vertex, fragment) {
	Shader.call(this, vertex, fragment);

	// var size = 500;

	this.vertices = [
		vec4(-1,  1, -1),
	    vec4(-1, -1, -1),
	    vec4(1, -1, -1),
	    vec4(1, -1, -1),
	    vec4(1,  1, -1),
	    vec4(-1,  1, -1),

	    vec4(-1, -1,  1),
	    vec4(-1, -1, -1),
	    vec4(-1,  1, -1),
	    vec4(-1,  1, -1),
	    vec4(-1,  1,  1),
	    vec4(-1, -1,  1),

	    vec4(1, -1, -1),
	    vec4(1, -1,  1),
	    vec4(1,  1,  1),
	    vec4(1,  1,  1),
	    vec4(1,  1, -1),
	    vec4(1, -1, -1),

	    vec4(-1, -1,  1),
	    vec4(-1,  1,  1),
	    vec4(1,  1,  1),
	    vec4(1,  1,  1),
	    vec4(1, -1,  1),
	    vec4(-1, -1,  1),

	    vec4(-1,  1, -1),
	    vec4(1,  1, -1),
	    vec4(1,  1,  1),
	    vec4(1,  1,  1),
	    vec4(-1,  1,  1),
	    vec4(-1,  1, -1),

	    vec4(-1, -1, -1),
	    vec4(-1, -1,  1),
	    vec4(1, -1, -1),
	    vec4(1, -1, -1),
	    vec4(-1, -1,  1),
	    vec4(1, -1,  1)

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

	var attribBuffer = new AttribBuffer(this, "vPosition", this.vertices);
	this.buffers.push(attribBuffer);

	// var indexBuffer = new IndexBuffer();

	// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.id);
	// gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(this.indices), gl.STATIC_DRAW);

	// this.buffers.push(indexBuffer);

	// this.uniforms.cubeMap = gl.getUniformLocation(this.shader, "cubeMap");
	this.uniforms.modelView = gl.getUniformLocation(this.program, "modelView");
	this.uniforms.projection = gl.getUniformLocation(this.program, "projection");

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
SkyboxShader.prototype = Object.create(Shader.prototype);

function Entity (position, rotation, scale) {
	this.position = position;
	this.rotation = rotation;
	this.scale = scale;
}
// TODO: fix MV.js
function scaleMatrix( x, y, z )
{
    if ( Array.isArray(x) && x.length == 3 ) {
        z = x[2];
        y = x[1];
        x = x[0];
    }

    var result = mat4();
    result[0][0] = x;
    result[1][1] = y;
    result[2][2] = z;

    return result;
}
Entity.prototype.getModelView = function() {
	var scale = scaleMatrix(this.scale);

	var translation = translate(this.position);

	var rx = rotate(this.rotation[0], vec3(1.0, 0.0, 0.0));
	var ry = rotate(this.rotation[1], vec3(0.0, 1.0, 0.0));
	var rz = rotate(this.rotation[2], vec3(0.0, 0.0, 1.0));

	var rotation = mult(mult(rx, ry), rz);

	return mult(looking, mult(translation, mult(scale, rotation)));
};

function Sphere (position, radius) {
	Entity.call(this, position, vec3(0, 0, 0), vec3(radius, radius, radius));
	this.shader = new SphereShader("vertex-shader", "fragment-shader");
	this.color = vec4(0.0, 0.3, 0.5, 1.0);
}
Sphere.prototype = Object.create(Entity.prototype);
Sphere.prototype.render = function() {
	var modelView = this.getModelView();

	gl.uniformMatrix4fv(this.shader.uniforms.modelView, false, flatten(modelView));

	for (var i = 0; i < this.shader.indices.length/3; i++) {
		gl.uniform4fv(this.shader.uniforms.color, colors[i % 6]);
		// gl.uniform4fv(this.shader.uniforms.color, this.color);
		gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 3 * i);
	}
};

function Planet (position, radius) {
	Entity.call(this, position, vec3(0, 0, 0), vec3(radius, radius, radius));
	this.shader = new PlanetShader("planet-vertex-shader", "planet-fragment-shader");
	this.color = vec4(0.2, 0.2, 0.2, 1.0);
}
Planet.prototype = Object.create(Entity.prototype);
Planet.prototype.render = function() {
	var modelView = this.getModelView();

	gl.uniformMatrix4fv(this.shader.uniforms.modelView, false, flatten(modelView));

    gl.uniform4fv(this.shader.uniforms.lightPosition, flatten(this.shader.lightPosition));
    gl.uniform1f(this.shader.uniforms.shininess, this.shader.materialShininess);

	for (var i = 0; i < this.shader.indices.length/3; i++) {
		var color = colors[i % 6];
		this.shader.diffuseProduct = mult(this.shader.lightDiffuse, color);
		this.shader.ambientProduct = mult(this.shader.lightAmbient, color);
		this.shader.ambientSpecular = mult(this.shader.lightSpecular, color);
		gl.uniform4fv(this.shader.uniforms.diffuseProduct, flatten(this.shader.diffuseProduct));
		gl.uniform4fv(this.shader.uniforms.ambientProduct, flatten(this.shader.ambientProduct));
		gl.uniform4fv(this.shader.uniforms.specularProduct, flatten(this.shader.specularProduct));
		// gl.uniform4fv(this.shader.uniforms.color, colors[i % 6]);
		// gl.uniform4fv(this.shader.uniforms.color, this.color);
		gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 3 * i);
	}
};

function Skybox (position, size) {
	Entity.call(this, position, vec3(0, 0, 0), vec3(size, size, size));
	this.shader = new SkyboxShader("skybox-vertex-shader", "skybox-fragment-shader");
}
Skybox.prototype = Object.create(Entity.prototype);
Skybox.prototype.render = function() {
	modelView = this.getModelView();

	gl.uniformMatrix4fv(this.shader.uniforms.modelView, false, flatten(modelView));
	gl.drawArrays(gl.TRIANGLES, 0, this.shader.vertices.length);

	// for (var i = 0; i < this.vertices.length/6; i++) {
	// 	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 6 * i);
	// }
};

// Main

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

	var sphere = new Sphere(vec3(0, 0, 0), 4);
	entities.push(sphere);
	gl.useProgram(sphere.shader.program);
	gl.uniformMatrix4fv(sphere.shader.uniforms.projection, false, flatten(projection));

	var sphere2 = new Planet(vec3(10, 0, 0), 2);
	entities.push(sphere2);
	gl.useProgram(sphere2.shader.program);
	gl.uniformMatrix4fv(sphere2.shader.uniforms.projection, false, flatten(projection));

	var skybox = new Skybox(vec3(0, 0, 0), 500);
	entities.push(skybox);
	gl.useProgram(skybox.shader.program);
	gl.uniformMatrix4fv(skybox.shader.uniforms.projection, false, flatten(projection));

	// Load translation and viewing matrices which don't change each render

	// looking = lookAt(vec3(cubeSize2, cubeSize2, 4 * cubeSize), vec3(cubeSize2, cubeSize2, 0), vec3(0.0, 1.0, 0.0));
	eye = vec3(cubeSize2, cubeSize2, 4 * cubeSize);
	at = vec3(0, 0, 0);
	up = vec3(0.0, 1.0, 0.0);
	looking = lookAt(eye, at, up);

	render();
};

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	theta[axis] += 0.005;
	var sphere = entities[1];
	sphere.position[0] = 10 * Math.cos(theta[axis]);
	sphere.position[2] = -10 * Math.sin(theta[axis]);
	sphere.rotation[1] += 0.5;

	entities[0].rotation[1] += 0.1;

	eye[0] = 4 * cubeSize * Math.cos(theta[axis]);
	eye[0] = 4 * cubeSize * Math.sin(theta[axis]);
	looking = lookAt(eye, at, up);

	entities.forEach(
		function (entity) {
			gl.useProgram(entity.shader.program);
			entity.shader.setBuffersAndAttributes();
			entity.render();
		}
	);

	requestAnimFrame(render);
}
