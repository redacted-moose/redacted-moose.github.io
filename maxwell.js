var canvas;
var gl;

var points = [];
var colors = [];

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

	// Load vertices and colors for Maxwell's Triangle
	
	points.push (vec2(-1.0, -1.0));
	colors.push (vec3(1.0, 0.0, 0.0)); //first vertex is red
	points.push (vec2(1.0, -1.0));
	colors.push (vec3(0.0, 1.0, 0.0)); //second vertex is green
	points.push (vec2(0.0, 0.5*Math.sqrt(3)));
	colors.push (vec3(0.0, 0.0, 1.0)); //third vertex is blue
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

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT);
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}
