
var gl;
var numPoints = 0;
var maxPoints = 1;
var canvas;
var canvasXOffset;
var canvasYOffset;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

	canvasXOffset = canvas.offsetLeft;
	canvasYOffset = canvas.offsetTop;

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 8*maxPoints, gl.STATIC_DRAW );

    // Associate our shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

	// Set up event listener

	canvas.addEventListener ("click", function(event) {
		// if (numPoints < maxPoints) {
			var point = vec2 (-1 + 2*(event.clientX-canvasXOffset)/canvas.width,
				-1 + 2*(canvas.height-event.clientY+canvasYOffset)/canvas.height);
			gl.bufferSubData (gl.ARRAY_BUFFER, 0, flatten(point));
			// numPoints++;
		// }
	});

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.POINTS, 0, 1);
	requestAnimFrame (render);
}
