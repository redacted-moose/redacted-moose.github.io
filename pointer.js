
var gl;
var thetaLoc;
var theta;
var phi;
var tau;

var color;
var color2;
var colorLoc;

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
	var vertices = [vec2(-0.15, 0), vec2(0.15, 0), vec2(-0.15, 0.5), vec2(0.15, 0.5), vec2(0, 0.75)];
	var vertices2 = [vec2(-0.10, 0), vec2(0.10, 0), vec2(-0.10, 0.5), vec2(0.10, 0.5), vec2(0, 0.75)];
	var vertices3 = [vec2(-0.05, 0), vec2(0.05, 0), vec2(-0.05, 0.5), vec2(0.05, 0.5), vec2(0, 0.75)];
	theta = 0.0;
	phi = Math.PI / 2;
	tau = Math.PI;
	thetaLoc = gl.getUniformLocation (program, "theta");

	color = vec4(1.0, 0.0, 0.0, 1.0);
	color2 = vec4(0.0, 1.0, 0.0, 1.0);
	color3 = vec4(0.0, 0.0, 1.0, 1.0);
	// color = {
	// 	h: 0.0,
	// 	s: 0.75,
	// 	v: 0.33
	// };

	// color2 = {
	// 	h: 0.75,
	// 	s: 0.0,
	// 	v: 0.33
	// };

	// color3 = {
	// 	h: 0.33,
	// 	s: 0.75,
	// 	v: 0.0
	// };

	colorLoc = gl.getUniformLocation(program, "color");

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices.concat(vertices2).concat(vertices3)), gl.STATIC_DRAW );

    // Associate our shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    //setInterval (render, 30);
	render();
};


function render() {
	gl.clear( gl.COLOR_BUFFER_BIT );
	theta -= 0.01;
	gl.uniform1f (thetaLoc, theta);
	gl.uniform4f(colorLoc, color[0], color[1], color[2], color[3]);
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 5);
	phi -= 0.02;
	gl.uniform1f(thetaLoc, phi);
	gl.uniform4f(colorLoc, color2[0], color2[1], color2[2], color2[3]);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 5);
	tau -= 0.03;
	gl.uniform1f(thetaLoc, tau);
	gl.uniform4f(colorLoc, color3[0], color3[1], color3[2], color3[3]);
	gl.drawArrays(gl.TRIANGLE_STRIP, 10, 5);
	requestAnimFrame (render);
}

/*
This function  expects 0 <= h, s, v <= 1, if you're using degrees or radians, remember to divide them out.
The returned values are in a range 0 <= r, g, b <= 1
*/
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
    }
    return [r,g,b];
}
