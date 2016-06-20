function Color(r, g, b, a) {
	if (typeof(r) === "object") {
		var args = r;
		if (args.h || args.s || args.v) {
			// TODO: convert hsv to rgb
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
	this.r = r || 0.0;
	this.g = g || 0.0;
	this.b = b || 0.0;
	this.a = a || 1.0;
}

Color.RED = new Color(1.0, 0.0, 0.0);
Color.YELLOW = new Color(1.0, 1.0, 0);
Color.GREEN = new Color(0, 1.0, 0);
Color.CYAN = new Color(0, 1.0, 1.0);
Color.BLUE = new Color(0, 0, 1.0);
Color.MAGENTA = new Color(1.0, 0, 1.0);
Color.BLACK = new Color(0, 0, 0);
Color.WHITE = new Color(1.0, 1.0, 1.0);
Color.PURPLE = new Color({
	h: 300,
	s: 1.0,
	v: 0.5
});

function Light(position, color) {
	Entity.call(this, {
		position: position,
		color: color
	});
	this.attenuation = vec3(1, 0.1, 0.02);
}

function Intersection(t, point, normal, entity) {
	this.t = t || Infinity;
	this.point = point || undefined;
	this.normal = normal || undefined;
	this.entity = entity || undefined;
}

function Entity(args) {
	this.position = args.position || vec3();
	this.rotation = args.rotation || vec3();
	this.scale = args.scale || vec3();
	this.color = args.color || new Color();
	this.ambient_constant = vec4(0.1, 0.1, 0.1, 1.0);
	this.diffuse_constant = vec4(1.0, 1.0, 1.0, 1.0);
	this.specular_constant = vec4(1.0, 1.0, 1.0, 1.0);
}

function Sphere(center, radius, color) {
	if (typeof(center) === "object") {
		var args = center;
		center = args.center;
		radius = args.radius;
		color = args.color;
	}
	Entity.call(this, {
		position: center,
		scale: vec3(radius, radius, radius),
		color: color
	});
	this.radius = radius;
}
Sphere.prototype = Object.create(Entity.prototype);
Sphere.prototype.intersect = function(ray) {
	var distance = subtract(ray.end, ray.start);
	var toObject = subtract(ray.start, this.position);
	var a = dot(distance, distance);
	var b = dot(scale(2, distance), toObject);
	var c = dot(toObject, toObject) - this.radius * this.radius;
	var discriminant = b * b - 4 * a * c;

	if (discriminant > 0) {
		var t = (-b - Math.sqrt(discriminant)) / (2 * a);
		var point = add(ray.start, scale(t, distance));
		return new Intersection(t, point, normalize(subtract(point, this.position)), this);
	} else {
		return new Intersection();
	}
};

// To make new entity types, subclass entity and implement an intersect function, like so:
// function MyEntity(position, color, ...) { // Add any arguments that need to be tracked within the object
// 	Entity.call({position: ..., rotation: ..., scale: ..., color: ...}); // Call the super constructor
// 	this.blah = blah || 0; // Store any additional instance variables
// }
// MyEntity.prototype = Object.create(Entity.prototype);
// MyEntity.prototype.intersect = function(ray) {
// 	// Implement ray intersection, must return an Intersection object
// };

var config = {
	camera: { // Camera
		eye: vec3(0.0, 5.0, 5.0), // Location of the viewer (vec3)
		at: vec3(0.0, 0.0, 0.0), // Point the viewer is looking at (vec3)
		up: vec3(0.0, 1.0, 0.0) // "Up" direction relative to eye (vec3)
	},

	plane: { // Viewing plane
		distance: 1, // Distance to viewing plane (float)
		fov: 45, // Field of view, in degrees (float)
		aspect: 1 // Aspect Ratio, change if canvas width/height ratio changes (float)
	},

	background: Color.BLACK, // Background color

	entities: [ // Objects in the scene
		new Sphere({
			center: vec3(-1.5, 0, 0),
			radius: 1,
			color: new Color(0.0, 0.3, 0.6, 1.0)
		}),
		new Sphere({
			center: vec3(1.5, 0, 0),
			radius: 1,
			color: Color.WHITE
		})
	],

	lights: [ // Lights in the scene
		new Light(vec3(4.5, 0.0, 0.0), Color.GREEN),
		new Light(vec3(-4.5, 0.0, 0.0), Color.WHITE)
	]
};
