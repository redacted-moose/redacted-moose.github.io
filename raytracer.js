var canvas;
var ctx;
var canvasData;
var config;

var n, u, v;

var height, width, center, topLeft;

/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * Math.clamp((x * 255), 0, 255)
 *
 * @param {Number} num The number to clamp
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
Math.clamp = function(num, min, max) {
	return Math.min(Math.max(num, min), max);
};

function Ray(start, end) {
	this.start = start || vec3();
	this.end = end || vec3();
}
Ray.prototype.distance = function() {
	return subtract(this.end, this.start);
};
Ray.prototype.direction = function() {
	return normalize(this.distance());
};

Color.prototype.toVec4 = function() {
	return vec4(this.r, this.g, this.b, this.a);
};
Color.fromVec4 = function(vec) {
	return new Color(vec[0], vec[1], vec[2], vec[3]);
};

Light.reflect = function(v, u) {
	return subtract(scale(2 * dot(u, v), v), u);
};

Intersection.prototype.reset = function() {
	this.t = Infinity;
	this.point = undefined;
	this.normal = undefined;
	this.object = undefined;
};
Intersection.prototype.lighting = function(camera) {
	var entity = this.entity;
	// var entityColor = entity.color.toVec4();
	var entityColor = this.color().toVec4();
	var ambientColor = mult(entity.constants.ambient, entityColor);
	var diffuseColor = vec4(0, 0, 0, 0);
	var specularColor = vec4(0, 0, 0, 0);

	var toLightRay = new Ray(this.point);

	// console.log(this.point);

	for (var i = 0; i < config.lights.length; i++) {
		var light = config.lights[i];
		var lightColor = light.color.toVec4();
		toLightRay.end = light.position;

		var intersection = new Intersection();

		// Shadowing
		// for (var j = 0; j < config.entities.length; j++) {
		//	var entity = config.entities[j];
		//	var result = entity.intersect(toLightRay);
		//	if (result.t < intersection.t) {
		//		intersection = result;
		//	}
		// }

		// if (intersection.entity !== entity) continue;

		var toLightVector = subtract(this.point, light.position);
		var distance = length(toLightVector);
		var attenuationFactor = light.attenuation[0] +
				(light.attenuation[1] * distance) +
				(light.attenuation[2] * distance * distance);

		var lightDirection = normalize(toLightVector);
		var unitLightVector = negate(lightDirection);

		var brightness = dot(this.normal, unitLightVector);
		brightness = Math.max(brightness, 0.0);

		// reflection = normalize(2 * (lightDirection . normal) * normal - lightDirection)
		var reflection = normalize(Light.reflect(this.normal, lightDirection));
		var normalizedCameraVector = normalize(subtract(camera, this.point));

		var specularFactor = dot(reflection, normalizedCameraVector);
		specularFactor = Math.max(specularFactor, 0.0);

		var dampedFactor = Math.pow(specularFactor, entity.shininess);

		var colorScale = scale(brightness / attenuationFactor, entity.constants.diffuse);
		var diffuse = mult(colorScale, lightColor);

		diffuseColor = add(diffuseColor, diffuse);

		var specular = scale(dampedFactor / attenuationFactor, entity.constants.specular);
		specularColor = add(specularColor, specular);
	}

	var totalColor = add(add(ambientColor, mult(diffuseColor, entityColor)), specularColor);
	// Clamp alpha to 0.0..1.0
	totalColor[3] = Math.clamp(totalColor[3], 0.0, 1.0);

	return Color.fromVec4(totalColor);
};
Intersection.prototype.color = function() {
	if (this.entity.reflectivity === 0.0) return this.entity.color;

	// console.log(subtract(this.reflection.end, this.reflection.start));

	var intersection = new Intersection();
	for (var i = 0; i < config.entities.length; i++) {
		var entity = config.entities[i];
		var result = entity.intersect(this.reflection);
		if (0 < result.t && result.t < intersection.t) {
			intersection = result;
		}
	}

	if (this.entity.reflectivity === 1.0) {
		return (intersection.t < Infinity) ? intersection.lighting(config.camera.eye) : config.background;
	}

	if (intersection.t < Infinity) {
		return Color.fromVec4(mix(intersection.entity.color.toVec4(),
								  this.entity.color.toVec4(),
								  this.entity.reflectivity));
	} else {
		return Color.fromVec4(mix(config.background.toVec4(),
								  this.entity.color.toVec4(),
								  this.entity.reflectivity));
	}
};

window.onload = function init() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext('2d');
	canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	n = normalize(subtract(config.camera.eye, config.camera.at));
	u = normalize(cross(config.camera.up, n));
	v = cross(n, u);

	var aspect = canvas.width / canvas.height;

	height = 2 * config.plane.distance * Math.tan(radians(config.plane.fov) / 2);
	width = height * aspect;
	// eye - distance*n
	center = subtract(config.camera.eye, scale(config.plane.distance, n));
	// console.log(center);
	// center - width/2 * u + height/2 * v
	topLeft = add(subtract(center, scale(width / 2, u)), scale(height / 2, v));
	render();
};

function render() {
	var intersection = new Intersection();
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
		var plane_y = scale(-(y - 0.5) * height / canvas.height, v);
		for (var x = 0; x < canvas.width; x++) {
			var plane_x = scale((x + 0.5) * width / canvas.width, u);
			intersection.reset();
			// topLeft + x*width/canvas.width * u - y*height/canvas.height * v
			// The 0.5 is to start in the middle of the pixel
			ray.end = add(topLeft,
						  add(plane_x, plane_y));

			// config.objects.forEach(intersect);
			for (var i = 0; i < config.entities.length; i++) {
				var entity = config.entities[i];
				var result = entity.intersect(ray);
				if (0 < result.t && result.t < intersection.t) {
					intersection = result;
				}
			}

			data.setColor(x, y, (intersection.t < Infinity) ?
						  intersection.lighting(config.camera.eye) :
						  config.background);
		}
	}

	ctx.putImageData(canvasData, 0, 0);
}
