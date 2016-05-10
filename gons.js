var canvas;
var gl;

var vertices = 10;
var rosettes = true;

var points = [];
var colors = [];

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

	if (rosettes) {
		for (var i = 0; i < vertices; i++) {
			for (var j = i + 1; j < vertices; j++) {
				var coord = coords(2*i*Math.PI/vertices);
				points.push(toViewSpace(coord));
				colors.push(vec3(0.0, 0.0, 0.0));
				var coord1 = coords(2*j*Math.PI/vertices);
				points.push(toViewSpace(coord1));
				colors.push(vec3(0.0, 0.0, 0.0));
			}
		}
	} else {
		for (var i = 0; i < vertices; i++) {
			var coord = coords(2*i*Math.PI/vertices);
			points.push(toViewSpace(coord));
			var coord2 = coords(2*(i + 1)*Math.PI/vertices);
			points.push(toViewSpace(coord2));
			colors.push(vec3(0.0, 0.0, 0.0));
			colors.push(vec3(0.0, 0.0, 0.0));
		}
	}

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Create buffer objects, initialize them, and associate them with the
    // associated attribute variables in our vertex shader

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT);
    gl.drawArrays( gl.LINES, 0, points.length );
}

function coords(angle) {
	return {
		x: Math.cos(angle),
		y: Math.sin(angle)
	};
}

function toViewSpace(coord) {
	return vec2(coord.x, coord.y);
}
