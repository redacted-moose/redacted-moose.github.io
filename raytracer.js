var canvas;
var ctx;
var canvasData;
var config;

var n, u, v;

var height, width, center, topLeft;

function Ray(start, end) {
    this.start = start || vec3();
    this.end = end || vec3();
}

window.onload = function init() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext('2d');
    canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    n = normalize(subtract(config.camera.eye, config.camera.at));
    u = normalize(cross(config.camera.up, n));
    v = cross(n, u);

    height = 2 * config.plane.distance * Math.tan(radians(config.plane.fov) / 2);
    width = height * config.plane.aspect;
    // eye - distance*n
    center = subtract(config.camera.eye, scale(config.plane.distance, n));
	// console.log(center);
    // center - width/2 * u + height/2 * v
    topLeft = add(subtract(center, scale(width / 2, u)), scale(height / 2, v));
    render();
};

function render() {
	var result;
    var t;
    var object;
    var data = canvasData.data;
    data.setColor = function(x, y, color) {
        var index = 4 * (canvas.width * y + x);
        this[index] = color.r;
        this[index + 1] = color.g;
        this[index + 2] = color.b;
        this[index + 3] = color.a;
    };

    var currRay = new Ray(config.camera.eye);

    var intersect = function(currObject) {
        var thing = currObject.intersect(currRay);
        if (thing) {
			result = thing;
            t = thing.t;
            object = currObject;
        }
    };

    for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++) {
            t = Infinity;
            // topLeft + x*width/canvas.width * u - y*height/canvas.height * v
            // The 0.5 is to start in the middle of the pixel
            currRay.end = add(topLeft,
                add(scale((x + 0.5) * width / canvas.width, u),
                    scale(-(y - 0.5) * height / canvas.height, v)));

            config.objects.forEach(intersect);

            // TODO: lighting
            data.setColor(x, y, (t === Infinity) ? config.background : object.color);
            // data.setColor(x, y, (t === Infinity) ?
			// 			  config.background :
			// 			  object.lighting(normalize(config.camera.eye),
			// 							  result.normal,
			// 							  result.point));
        }
    }

    ctx.putImageData(canvasData, 0, 0);
}
