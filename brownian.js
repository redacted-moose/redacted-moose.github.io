
var gl;
var points;
var Nrand, GaussAdd, GaussFac;

var NumPoints = 300;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Compute the vertices for the line as the sum of Gaussian random variables.
    
	InitGauss ();
	var displacement = 0.0;
	var p = vec2 (-1.0, 0.0);
	var x_delta = 2 / NumPoints;
	var x = -1;
 	var winLimit = 2.0 * Math.sqrt (NumPoints); // reasonable max value for displacement
	points = [ p ];

    for ( var i = 1; i < NumPoints; i++ ) {
        displacement += Gauss ();
		x += x_delta;
		p = vec2 (x, displacement/winLimit); // scale points to [-1, 1]
        points.push( p );
    }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 0.0, 1.0, 1.0 );
    
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
    gl.drawArrays( gl.LINE_STRIP, 0, points.length );
}

function InitGauss () {
	Nrand = 4;
	GaussAdd = Math.sqrt (3.0 * Nrand);
	GaussFac = 2.0 * GaussAdd / Nrand;
}
	
function Gauss () {
	var sum = 0;
	for (var i=0; i<Nrand; i++) {
		sum += Math.random();
	}
	return GaussFac * sum - GaussAdd;
}

