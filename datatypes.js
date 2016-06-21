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

var Class;

var Ray = Class.extend({
	constructor: function(start, end) {
		this.start = start || vec3();
		this.end = end || vec3();
	},

	distance: function() {
		return subtract(this.end, this.start);
	},

	direction: function() {
		return normalize(this.distance());
	}
});

var Intersection = Class.extend({
	constructor: function(t, point, normal, reflection, entity) {
		this.t = t || Infinity;
		this.point = point || undefined;
		this.normal = normal || undefined;
		this.reflection = reflection || undefined;
		this.entity = entity || undefined;
	},

	reset: function() {
		this.t = Infinity;
		this.point = undefined;
		this.normal = undefined;
		this.object = undefined;
	},

	lighting: function(camera) {
		var entity = this.entity;
		// var entityColor = entity.color.toVec4();
		var entityColor = this.color().raw;
		var ambientColor = mult(entity.constants.ambient, entityColor);
		var diffuseColor = vec4(0, 0, 0, 0);
		var specularColor = vec4(0, 0, 0, 0);

		var toLightRay = new Ray(this.point);

		for (var i = 0; i < config.lights.length; i++) {
			var light = config.lights[i];
			var lightColor = light.color.raw;
			toLightRay.end = light.position;

			// Shadowing
			var intersection = Intersection.find(config.entities, toLightRay);
			if (intersection.t < Infinity) continue;


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
			var normalizedCameraVector = normalize(subtract(this.point, camera));

			var specularFactor = dot(reflection, normalizedCameraVector);
			specularFactor = Math.max(specularFactor, 0.0);

			var dampedFactor = Math.pow(specularFactor, entity.shininess);

			var diffuseScale = scale(brightness / attenuationFactor, entity.constants.diffuse);
			var diffuse = mult(diffuseScale, lightColor);
			diffuseColor = add(diffuseColor, diffuse);

			var specularScale = scale(dampedFactor / attenuationFactor, entity.constants.specular);
			var specular = mult(specularScale, lightColor);
			specularColor = add(specularColor, specular);
		}

		var totalColor = add(add(ambientColor, mult(diffuseColor, entityColor)), specularColor);
		// Clamp alpha to 0.0..1.0
		totalColor[3] = Math.clamp(totalColor[3], 0.0, 1.0);

		return new Color(totalColor);
	},

	color: function() {
		if (this.entity.reflectivity === 0.0) return this.entity.color;

		var intersection = Intersection.find(config.entities, this.reflection);

		if (this.entity.reflectivity === 1.0) {
			return (intersection.t < Infinity) ? intersection.lighting(config.camera.eye) : config.background;
		}

		if (intersection.t < Infinity) {
			return new Color(mix(intersection.lighting(config.camera.eye).raw,
								 this.entity.color.raw,
								 this.entity.reflectivity));
		} else {
			return new Color(mix(config.background.raw,
								 this.entity.color.raw,
								 this.entity.reflectivity));
		}
	}
});
Intersection.find = function(entities, ray) {
	var intersection = new Intersection();
	for (var i = 0; i < entities.length; i++) {
		var entity = entities[i];
		var result = entity.intersect(ray);
		if (1e-6 < result.t && result.t < intersection.t) {
			intersection = result;
		}
	}
	return intersection;
};

var Color = Class.extend({
	constructor: function(r, g, b, a) {
		if (Array.isArray(r)) {
			this.raw = r;
			return;
		}

		if (typeof(r) === "object") {
			var args = r;
			if (args.h || args.s || args.v) {
				// var h = args.h || 0;
				// var s = args.s || 0;
				// var v = args.v || 0;
				var c = args.v * args.s;
				var x = c * (1 - Math.abs((args.h / 60) % 2 - 1));
				var m = args.v - c;
				switch (Math.floor(args.h / 60)) {
				case 0:
					r = c;
					g = x;
					b = 0;
					break;
				case 1:
					r = x;
					g = c;
					b = 0;
					break;
				case 2:
					r = 0;
					g = c;
					b = x;
					break;
				case 3:
					r = 0;
					g = x;
					b = c;
					break;
				case 4:
					r = x;
					g = 0;
					b = c;
					break;
				case 5:
					r = c;
					g = 0;
					b = x;
					break;
				}
				r = (r + m);
				g = (g + m);
				b = (b + m);
				a = args.a;
			} else {
				r = args.r;
				g = args.g;
				b = args.b;
				a = args.a;
			}
		}
		this.raw = vec4(
			r || 0.0,
			g || 0.0,
			b || 0.0,
			a || 1.0
		);
	}
});
Object.defineProperties(Color.prototype, {
	"r": {
		get: function() {
			return this.raw[0];
		}
	},
	"g": {
		get: function() {
			return this.raw[1];
		}
	},
	"b": {
		get: function() {
			return this.raw[2];
		}
	},
	"a": {
		get: function() {
			return this.raw[3];
		}
	}
});

Color.RED = new Color(1.0, 0.0, 0.0);
Color.YELLOW = new Color(1.0, 1.0, 0);
Color.GREEN = new Color(0, 1.0, 0);
Color.CYAN = new Color(0, 1.0, 1.0);
Color.BLUE = new Color(0, 0, 1.0);
Color.MAGENTA = new Color(1.0, 0, 1.0);
Color.BLACK = new Color(0, 0, 0);
Color.WHITE = new Color(1.0, 1.0, 1.0);
Color.PURPLE = new Color({
	h: 300, // Hue: (int: [0-360])
	s: 1.0, // Saturation (float: [0.0, 1.0])
	v: 0.5 // Value (float: [0.0, 1.0])
}); // Colors can be specified in HSV as well

var Entity = Class.extend({
	constructor: function(args) {
		this.position = args.position || vec3();
		this.rotation = args.rotation || vec3();
		this.scale = args.scale || vec3();
		this.color = args.color || new Color();
		this.reflectivity = Math.clamp(args.reflectivity || 0.0, 0.0, 1.0);
		this.constants = args.constants || {
			ambient: vec4(0.4, 0.4, 0.4, 1.0),
			diffuse: vec4(1.0, 1.0, 1.0, 1.0),
			specular: vec4(1.0, 1.0, 1.0, 1.0)
		};
		this.shininess = Math.max(args.shininess || 50.0, 0.0);
	},

	intersect: function(ray) {
		throw "NotImplementedException: intersect method is unimplemented for this object";
	}
});

var Light = Entity.extend({
	constructor: function(position, color) {
		var args = position;
		if (Array.isArray(position)) {
			args = {
				position: position,
				color: color
			};
		}

		arguments.callee.$.constructor.call(this, args);
		this.attenuation = args.attenuation || vec3(1, 0.1, 0.02);
	}
});
Light.reflect = function(v, u) {
	return subtract(scale(2 * dot(u, v), v), u);
};

var Sphere = Entity.extend({
	constructor: function(position, radius, color, reflectivity) {
		var args = position;
		if (Array.isArray(position)) {
			args = {
				position: position,
				color: color,
				reflectivity: reflectivity,
				radius: radius
			};
		}
		arguments.callee.$.constructor.call(this, args);
		this.radius = Math.abs(args.radius || 1.0);
	},

	intersect: function(ray) {
		var distance = subtract(ray.end, ray.start);
		var reverseDistance = subtract(ray.start, ray.end);
		var direction = normalize(distance);
		var toObject = subtract(ray.start, this.position);
		var a = dot(distance, distance);
		var b = dot(scale(2, distance), toObject);
		var c = dot(toObject, toObject) - this.radius * this.radius;
		var discriminant = b * b - 4 * a * c;

		if (discriminant > 0) {
			var t = (-b - Math.sqrt(discriminant)) / (2 * a);
			var point = add(ray.start, scale(t, distance));
			var normal = normalize(subtract(point, this.position));
			var reflectedVector = normalize(Light.reflect(normal, reverseDistance));
			var reflection = new Ray(point, add(point, reflectedVector));
			return new Intersection(t, point, normal, reflection, this);
		} else {
			return new Intersection();
		}
	}
});
var Plane = Entity.extend({
	constructor: function(position, normal, color, reflectivity) {
		var args = position;
		if (Array.isArray(position)) {
			args = {
				position: position,
				normal: normal,
				color: color,
				reflectivity: reflectivity
			};
		}
		arguments.callee.$.constructor.call(this, args);
		this.normal = normalize(args.normal || vec3(0.0, 0.0, 1.0));
	},

	intersect: function(ray) {
		var distance = subtract(ray.end, ray.start);
		var reverseDistance = subtract(ray.start, ray.end);
		var direction = normalize(distance);
		var eyeToPlane = subtract(this.position, ray.start);
		var t = dot(this.normal, eyeToPlane) / dot(this.normal, direction);

		if (t <= 0) return new Intersection();

		var point = add(ray.start, scale(t, distance));

		var reflectionVector = normalize(Light.reflect(this.normal, reverseDistance));
		var reflection = new Ray(point, add(point, reflectionVector));
		return new Intersection(t, point, this.normal, reflection, this);
	}
});
var Disc = Plane.extend({
	constructor: function(position, radius, normal, color, reflectivity) {
		var args = position;
		if (Array.isArray(position)){
			args = {
				position: position,
				radius: radius,
				normal: normal,
				color: color,
				reflectivity: reflectivity
			};
		}
		arguments.callee.$.constructor.call(this, args);
		this.radius = Math.abs(args.radius || 1.0);
	},

	intersect: function(ray) {
		var intersection = arguments.callee.$.intersect.call(this, ray);

		if (intersection.t === Infinity) return intersection;

		var point = intersection.point;

		if (length(subtract(this.position, point)) <= this.radius) {
			return intersection;
		}

		return new Intersection();
	}
});
var XYPlane = Plane.extend({
	constructor: function(position, normal, height, width, color, reflectivity) {
		var args = position;
		if (Array.isArray(position)) {
			args = {
				position: position,
				normal: normal,
				height: height,
				width: width,
				color: color,
				reflectivity: reflectivity
			};
		}
		arguments.callee.$.constructor.call(this, args);
		this.width = Math.abs(args.width || 1.0);
		this.height = Math.abs(args.height || 1.0);
	},

	intersect: function(ray) {
		var intersection = arguments.callee.$.intersect.call(this, ray);

		if (intersection.t === Infinity) return intersection;

		var point = intersection.point;

		if (point[1] > (this.position[1] + this.height / 2) || point[1] < (this.position[1] - this.height / 2)) {
			return new Intersection();
		}
		if (point[0] > (this.position[0] + this.width / 2) || point[0] < (this.position[0] - this.width / 2)) {
			return new Intersection();
		}

		return intersection;
	}
});
var XZPlane = Plane.extend({
	constructor: function(position, normal, height, width, color, reflectivity) {
		var args = position;
		if (Array.isArray(position)) {
			args = {
				position: position,
				normal: normal,
				height: height,
				width: width,
				color: color,
				reflectivity: reflectivity
			};
		}
		arguments.callee.$.constructor.call(this, args);
		this.width = Math.abs(args.width || 1.0);
		this.height = Math.abs(args.height || 1.0);
	},

	intersect: function(ray) {
		var intersection = arguments.callee.$.intersect.call(this, ray);

		if (intersection.t === Infinity) return intersection;

		var point = intersection.point;

		if (point[2] > (this.position[2] + this.height / 2) || point[2] < (this.position[2] - this.height / 2)) {
			return new Intersection();
		}
		if (point[0] > (this.position[0] + this.width / 2) || point[0] < (this.position[0] - this.width / 2)) {
			return new Intersection();
		}

		return intersection;
	}
});
var YZPlane = Plane.extend({
	constructor: function(position, normal, height, width, color, reflectivity) {
		var args = position;
		if (Array.isArray(position)) {
			args = {
				position: position,
				normal: normal,
				height: height,
				width: width,
				color: color,
				reflectivity: reflectivity
			};
		}
		arguments.callee.$.constructor.call(this, args);
		this.width = Math.abs(args.width || 1.0);
		this.height = Math.abs(args.height || 1.0);
	},

	intersect: function(ray) {
		var intersection = arguments.callee.$.intersect.call(this, ray);

		if (intersection.t === Infinity) return intersection;

		var point = intersection.point;

		if (point[1] > (this.position[1] + this.height / 2) || point[1] < (this.position[1] - this.height / 2)) {
			return new Intersection();
		}
		if (point[2] > (this.position[2] + this.width / 2) || point[2] < (this.position[2] - this.width / 2)) {
			return new Intersection();
		}

		return intersection;
	}
});
var Box = Entity.extend({
	constructor: function(position, height, width, length, color, reflectivity) {
		var args = position;
		if (Array.isArray(position)) {
			args = {
				position: position,
				height: height,
				width: width,
				length: length,
				color: color,
				reflectivity: reflectivity
			};
		}
		arguments.callee.$.constructor.call(this, args);

		this.height = Math.abs(args.height || 1.0);
		this.width = Math.abs(args.width || 1.0);
		this.length = Math.abs(args.length || 1.0);
		this.faces = [
			new YZPlane({
				position: add(this.position, vec3(-this.width / 2, 0, 0)),
				normal: vec3(-1, 0, 0),
				height: this.height,
				width: this.length,
				color: this.color,
				reflectivity: this.reflectivity
			}),
			new YZPlane({
				position: add(this.position, vec3(this.width / 2, 0, 0)),
				normal: vec3(1, 0, 0),
				height: this.height,
				width: this.length,
				color: this.color,
				reflectivity: this.reflectivity
			}),
			new XZPlane({
				position: add(this.position, vec3(0, -this.height / 2, 0)),
				normal: vec3(0, -1, 0),
				height: this.length,
				width: this.width,
				color: this.color,
				reflectivity: this.reflectivity
			}),
			new XZPlane({
				position: add(this.position, vec3(0, this.height / 2, 0)),
				normal: vec3(0, 1, 0),
				height: this.length,
				width: this.width,
				color: this.color,
				reflectivity: this.reflectivity
			}),
			new XYPlane({
				position: add(this.position, vec3(0, 0, -this.length / 2)),
				normal: vec3(0, 0, -1),
				height: this.height,
				width: this.width,
				color: this.color,
				reflectivity: this.reflectivity
			}),
			new XYPlane({
				position: add(this.position, vec3(0, 0, this.length / 2)),
				normal: vec3(0, 0, 1),
				height: this.height,
				width: this.width,
				color: this.color,
				reflectivity: this.reflectivity
			}),
		];
	},

	intersect: function(ray) {
		return Intersection.find(this.faces, ray);
	}
});
