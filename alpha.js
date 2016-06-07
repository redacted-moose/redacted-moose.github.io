var gl;
var bufferId;
var vPosition;
var colorLoc;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    //
    //  Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


    //  Load shaders and initialize attribute buffers

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU
    var vertices = [vec2(-1.0, -1.0), vec2(-1.0, 1.0), vec2(0.0, -1.0), vec2(0.0, 1.0),
        vec2(-1.0, -1.0), vec2(-1.0, 0.0), vec2(1.0, -1.0), vec2(1.0, 0.0),
        vec2(0.0, 0.0), vec2(0.0, 1.0), vec2(1.0, 0.0), vec2(1.0, 1.0)
    ];
    colorLoc = gl.getUniformLocation(program, "color");

    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
};


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform4fv(colorLoc, vec4(1.0, 1.0, 0.0, 0.75));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.uniform4fv(colorLoc, vec4(0.0, 1.0, 1.0, 0.75));
    gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4);
    //gl.uniform4fv (colorLoc, vec4(0.0, 1.0, 1.0, 0.75));
    gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4);
    gl.uniform4fv(colorLoc, vec4(1.0, 1.0, 0.0, 0.75));
    gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4);
}
