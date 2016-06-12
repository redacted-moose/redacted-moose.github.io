var canvas;
var ctx;
var canvasData;

var n, u, v;

var height, width, center, topLeft;

var backgroundColor = vec4(0, 0, 0, 255);

function Entity (position, rotation, scale) {
	this.position = position;
	this.rotation = rotation;
	this.scale = scale;
}

function Sphere (center, radius) {
	Entity.call(this, center, vec3(0, 0, 0), vec3(radius, radius, radius));
	// this.shader = new SphereShader("vertex-shader", "fragment-shader");
	this.color = vec4(0, 85, 127, 255);
}
Sphere.prototype = Object.create(Entity.prototype);
Sphere.prototype.intersect = function(ray) {
	var d = subtract(ray.end, ray.start);
	var a = dot(d, d);
	var b = dot(scale(2, d), subtract(ray.start, this.position));
	var c = dot(subtract(ray.start, this.position), subtract(ray.start, this.position)) - this.scale[0] * this.scale[0];
	var discriminant = Math.sqrt(b*b - 4*a*c);

	if (discriminant > 0) {
		return (-b - discriminant)/(2*a);
	} else {
		return false;
	}
};

function Ray (start, end) {
	this.start = start;
	this.end = end;
}

window.onload = function init() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext('2d');
	canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	n = normalize(subtract(config.camera.eye, config.camera.at));
	// console.log(n);
	u = normalize(cross(config.camera.up, n));
	// console.log(u);
	v = cross(n, u);
	// console.log(v);

	height = 2*config.plane.distance * Math.tan(config.plane.fov/2);
	width = height * config.plane.aspect;
	center = subtract(config.camera.eye, scale(config.plane.distance, n));
	// center - width/2 * u + height/2 * v
	topLeft = add(subtract(center, scale(width/2, u)), scale(height/2, v));
	render();
};

function render() {
	var data = canvasData.data;

	var sphere = new Sphere(vec3(-3, 1, 2), 1);

	for (var y = 0; y < canvas.height; y++) {
		for (var x = 0; x < canvas.width; x++) {
			var t = Infinity;
			// topLeft + x*width/canvas.width - y*height/canvas.height
			var currRay = new Ray(config.camera.eye, add(topLeft,
														 add(scale(x*width/canvas.width, u),
															 scale(-y*height/canvas.height, v))));
			var result = sphere.intersect(currRay);
			if (result) {
				t = result;
			}

			var index = 4 * (canvas.width * y + x);
			if (t == Infinity) {
				data[index] = backgroundColor[0];
				data[index + 1] = backgroundColor[1];
				data[index + 2] = backgroundColor[2];
				data[index + 3] = backgroundColor[3];
			} else {
				data[index] = sphere.color[0];
				data[index + 1] = sphere.color[1];
				data[index + 2] = sphere.color[2];
				data[index + 3] = sphere.color[3];
			}
		}
	}

	ctx.putImageData(canvasData, 0, 0);
}
