
var MAX_VELOCITY = 0.10;

var gl;
var thetaLoc;
var theta;
var accel = 0.001;
var velocity = 0;
var colorLoc;

// var ColorEnum = {
// 	RED: 0,
// 	GREEN: 1,
// 	BLUE: 2
// };

var color = {
	h: 0.8,
	s: 0.9,
	v: 0.5
};
var direction = true;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
	var vertices = [vec2(-0.5, -0.5), vec2(0.5, -0.5), vec2(-0.5, 0.5), vec2(0.5, 0.5)];
	theta = 0.0;
	thetaLoc = gl.getUniformLocation (program, "theta");

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate our shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

	// Associate the color variable with the shader

	colorLoc = gl.getUniformLocation (program, "color");

	// Set up event handler

    //document.getElementById("ColorButton").onclick = function () {
    //   color = !color;
    //};
	var colorButton = document.getElementById("ColorButton");
	// colorButton.addEventListener("click", function() {
	// 	switch (color) {
	// 	case ColorEnum.RED:
	// 		color = ColorEnum.GREEN;
	// 		break;
	// 	case ColorEnum.GREEN:
	// 		color = ColorEnum.BLUE;
	// 		break;
	// 	case ColorEnum.BLUE:
	// 		color = ColorEnum.RED;
	// 		break;
	// 	}
	// });
	colorButton.addEventListener("click", function() { color = {
		h: 0.08,
		s: 0.9,
		v: 0.5
	}; });

	var directionButton = document.getElementById("DirectionButton");
	directionButton.addEventListener("click", function() { direction = !direction; });

	render();
};


function render() {
	gl.clear( gl.COLOR_BUFFER_BIT );

	if (direction) {
		velocity += accel;
	} else {
		velocity -= accel;
	}

	if (Math.abs(velocity) >= MAX_VELOCITY) {
		direction = !direction;
	}

	theta += velocity;
	gl.uniform1f (thetaLoc, theta);

	// switch (color) {
	// case ColorEnum.RED:
	// 	gl.uniform4fv (colorLoc, vec4(1.0, 0.0, 0.0, 1.0));
	// 	break;
	// case ColorEnum.GREEN:
	// 	gl.uniform4fv (colorLoc, vec4(0.0, 1.0, 0.0, 1.0));
	// 	break;
	// case ColorEnum.BLUE:
	// 	gl.uniform4fv (colorLoc, vec4(0.0, 0.0, 1.0, 1.0));
	// 	break;
	// }

	color.v += velocity;
	gl.uniform4fv(colorLoc, HSVtoRGB(color));

	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4);

	requestAnimFrame (render);
}

/*
 This function  expects 0 <= h, s, v <= 1, if you're using degrees or radians, remember to divide them out.
 The returned values are in a range 0 <= r, g, b <= 1
 */
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;

    if (arguments.length === 1) {
        s = h.s; v = h.v; h = h.h;
    }

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch (i % 6) {
    case 0:
        r = v; g = t; b = p; break;
    case 1:
        r = q; g = v; b = p; break;
    case 2:
        r = p; g = v; b = t; break;
    case 3:
        r = p; g = q; b = v; break;
    case 4:
        r = t; g = p; b = v; break;
    case 5:
        r = v; g = p; b = q; break;
    }

    return vec4(r,g,b,1.0);
}
