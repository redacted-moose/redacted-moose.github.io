// Available datatypes/globals
var config;
var Class;
var Ray;
var Intersection;
var Color;
var Light;

var canvas;
var ctx;
var canvasData;

var n, u, v;

window.onload = function init() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext('2d');
	canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	n = normalize(subtract(config.camera.eye, config.camera.at));
	u = normalize(cross(config.camera.up, n));
	v = cross(n, u);

	var aspect = canvas.width / canvas.height;

	var height = 2 * config.plane.distance * Math.tan(radians(config.plane.fov) / 2);
	var width = height * aspect;
	// center = eye - distance*n
	var center = subtract(config.camera.eye, scale(config.plane.distance, n));
	// topLeft = center - width/2 * u + height/2 * v
	var topLeft = add(subtract(center, scale(width / 2, u)), scale(height / 2, v));
	render(topLeft, width, height);
};

function render(topLeft, width, height) {
	var data = canvasData.data;
	data.setColor = function(x, y, color) {
		var index = 4 * (canvas.width * y + x);
		this[index] = Math.floor(color.r * 255);
		this[index + 1] = Math.floor(color.g * 255);
		this[index + 2] = Math.floor(color.b * 255);
		this[index + 3] = Math.floor(color.a * 255);
	};

	var ray = new Ray(config.camera.eye);

	for (var y = 0; y < canvas.height; y++) {
		var plane_y = scale(-(y + 0.5) * height / canvas.height, v);
		for (var x = 0; x < canvas.width; x++) {
			var plane_x = scale((x + 0.5) * width / canvas.width, u);
			// topLeft + x*width/canvas.width * u - y*height/canvas.height * v
			// The 0.5 is to start in the middle of the pixel as opposed to the corner
			ray.end = add(topLeft, add(plane_x, plane_y));

			var intersection = Intersection.find(config.entities, ray);

			data.setColor(x, y, (intersection.t < Infinity) ?
						  intersection.lighting(config.camera.eye) :
						  config.background);
		}
	}

	ctx.putImageData(canvasData, 0, 0);
}
