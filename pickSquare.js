
var gl;
var projectionMatrix;
var points;
var projectionLoc;
var colorLoc;
var colors;
var board;
var program;
var color = new Uint8Array(4);


window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

	points = [];
	colors = [];
	board = [];
	
	points.push(vec2(0.0,0.0)); points.push(vec2(0.0,1.0)); points.push(vec2(1.0,0.0)); points.push(vec2(1.0,1.0)); // [0][0]
	points.push(vec2(1.0,0.0)); points.push(vec2(1.0,1.0)); points.push(vec2(2.0,0.0)); points.push(vec2(2.0,1.0)); // [0][1]
	points.push(vec2(2.0,0.0)); points.push(vec2(2.0,1.0)); points.push(vec2(3.0,0.0)); points.push(vec2(3.0,1.0)); // [0][2]
	points.push(vec2(0.0,1.0)); points.push(vec2(0.0,2.0)); points.push(vec2(1.0,1.0)); points.push(vec2(1.0,2.0)); // [1][0]
	points.push(vec2(1.0,1.0)); points.push(vec2(1.0,2.0)); points.push(vec2(2.0,1.0)); points.push(vec2(2.0,2.0)); // [1][1]
	points.push(vec2(2.0,1.0)); points.push(vec2(2.0,2.0)); points.push(vec2(3.0,1.0)); points.push(vec2(3.0,2.0)); // [1][2]
	points.push(vec2(0.0,2.0)); points.push(vec2(0.0,3.0)); points.push(vec2(1.0,2.0)); points.push(vec2(1.0,3.0)); // [2][0]
	points.push(vec2(1.0,2.0)); points.push(vec2(1.0,3.0)); points.push(vec2(2.0,2.0)); points.push(vec2(2.0,3.0)); // [2][1]
	points.push(vec2(2.0,2.0)); points.push(vec2(2.0,3.0)); points.push(vec2(3.0,2.0)); points.push(vec2(3.0,3.0)); // [2][2]
	
	for (var i=0; i<3; i++) {
	   colors[i] = [];
	   board[i] = [];
	   for (var j=0; j<3; j++) {
	      colors[i][j] = vec4(i/3.0, j/3.0, 0.0, 1.0);
		  board[i][j] = 0.0;
	   }
	}
 
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
	
	var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.generateMipmap(gl.TEXTURE_2D);

	// Allocate a frame buffer object

	framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer);

	// Attach color buffer

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

	// check for completeness

	var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
	if(status != gl.FRAMEBUFFER_COMPLETE) alert('Frame Buffer Not Complete');

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    //  Load shaders and initialize attribute buffers
    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate our shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	projectionMatrix = ortho(0.0, 3.0, 0.0, 3.0, 0.0, 1.0);
    projectionLoc = gl.getUniformLocation( program, "projectionMatrix" );
    colorLoc = gl.getUniformLocation( program, "color" );

    canvas.addEventListener("mousedown", function(event){
        var row, col;
		
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.clear( gl.COLOR_BUFFER_BIT);
		for (var i=0; i<3; i++) {
			for (var j=0; j<3; j++) {
				gl.uniform1i(gl.getUniformLocation(program, "i"), 3*i+j+1);
				gl.drawArrays (gl.TRIANGLE_STRIP, 12*i+4*j, 4);
			}
		}
        var x = event.clientX;
        var y = canvas.height - event.clientY;
          
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);
		//console.log(color);

        if(color[0]==25){ row=0; col=0; }
		else if(color[0]==128) { row=0; col=1; }
		else if(color[0]==255) { row=0; col=2; }
		else if(color[1]==25) { row=1; col=0; }
		else if(color[1]==128) { row=1; col=1; }
		else if(color[1]==255) { row=1; col=2; }
		else if(color[2]==25) { row=2; col=0; }
		else if(color[2]==128) { row=2; col=1; }
		else if(color[2]==255) { row=2; col=2; }
		board[row][col] = (board[row][col] + 1) % 3;
	    colors[row][col] = vec4(row/3.0, col/3.0, board[row][col]/3.0, 1.0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.uniform1i(gl.getUniformLocation(program, "i"), 0);
        gl.clear( gl.COLOR_BUFFER_BIT );
		for (var i=0; i<3; i++) {
			for (var j=0; j<3; j++) {
				gl.uniform4fv (colorLoc, flatten(colors[i][j]));
				gl.drawArrays (gl.TRIANGLE_STRIP, 12*i+4*j, 4);
			}
		}
    })
    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.uniformMatrix4fv( projectionLoc, false, flatten(projectionMatrix) );
    gl.uniform1i(gl.getUniformLocation(program, "i"),0);
	for (var i=0; i<3; i++) {
	   for (var j=0; j<3; j++) {
	      gl.uniform4fv (colorLoc, flatten(colors[i][j]));
	      gl.drawArrays (gl.TRIANGLE_STRIP, 12*i+4*j, 4);
	   }
	}
}

