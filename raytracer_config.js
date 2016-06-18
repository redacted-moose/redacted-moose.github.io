function Entity (args) {
	this.position = args.position || vec3();
	this.rotation = args.rotation || vec3();
	this.scale = args.scale || vec3();
	this.color = args.color || new Color();
	this.ambient_constant = vec4(0.2, 0.2, 0.2, 1.0);
	this.diffuse_constant = vec4(1.0, 0.8, 0.0, 1.0);
}
Entity.prototype.lighting = function(eye, normal, point) {
	var totalColor = vec4(0, 0, 0, 0);
	var ambient = mult(this.ambient_constant, this.color.toVec4());
	ambient.forEach(function(value, index) {this[index] = Math.floor(value);}, ambient);
	totalColor = add(totalColor, ambient);
	config.lights.forEach(function(light) {
		// var lightDirection = normalize(subtract(point, light));
		// reflection = normalize(2 * (lightDirection . normal) * normal - lightDirection)
		// var reflection = normalize(subtract(mult(scale(2, dot(lightDirection, normal)), normal), lightDirection));
		// TODO: fix diffuse lighting
		// var colorScale = scale(dot(lightDirection, normal), this.diffuse_constant);
		// var colorVec = this.color.toVec4();
		// var diffuse = mult(colorScale, colorVec);
		// diffuse.forEach(function(value) {Math.floor(value);});
		// totalColor = add(totalColor, diffuse);
		// var specular = mult(scale(ks, pow(dot(reflection, eye)), shininess), ims);
		// specular.forEach(function(value) {Math.floor(value);});
		// totalColor = add(totalColor, specular);
	}, this);
	return Color.fromVec4(totalColor);
};

function Sphere (args) {
	Entity.call(this, {
		position: args.center,
		scale: vec3(args.radius, args.radius, args.radius),
		color: args.color
	});
	this.radius = args.radius;
}
Sphere.prototype = Object.create(Entity.prototype);
Sphere.prototype.intersect = function(ray) {
	var distance = subtract(ray.end, ray.start);
	var toObject = subtract(ray.start, this.position);
	var a = dot(distance, distance);
	var b = dot(scale(2, distance), toObject);
	var c = dot(toObject, toObject) - this.radius * this.radius;
	var discriminant = Math.sqrt(b*b - 4*a*c);

	if (discriminant > 0) {
		var t = (-b - discriminant)/(2*a);
		var point = add(ray.start, scale(t, distance));
		return {
			t: t,
			point: point,
			normal: normalize(subtract(point, this.position))
		};
	} else {
		return false;
	}
};

function Color (r, g, b, a) {
	this.r = r || 0;
	this.g = g || 0;
	this.b = b || 0;
	this.a = a || 255;
}
Color.prototype.toVec4 = function() {
	return vec4(this.r, this.g, this.b, this.a);
};
Color.fromVec4 = function(vec) {
	return new Color(vec[0], vec[1], vec[2], vec[3]);
};

Color.RED = new Color(255, 0, 0);
Color.YELLOW = new Color(255, 255, 0);
Color.GREEN = new Color(0, 255, 0);
Color.CYAN = new Color(0, 255, 255);
Color.BLUE = new Color(0, 0, 255);
Color.MAGENTA = new Color(255, 0, 255);
Color.BLACK = new Color(0, 0, 0);
Color.WHITE = new Color(255, 255, 255);

var config = {
	camera: { // Camera
		eye: vec3(5.0, 5.0, 5.0), // Location of the viewer (vec3)
		at: vec3(0.0, 0.0, 0.0), // Point the viewer is looking at (vec3)
		up: vec3(0.0, 1.0, 0.0) // "Up" direction relative to eye (vec3)
	},

	plane: { // Viewing plane
		distance: 1, // Distance to viewing plane (int)
		fov: 45, // Field of view, in degrees (int)
		aspect: 1 // Aspect Ratio, change if canvas width/height ratio changes (int)
	},

	background: Color.BLACK, // Background color

	objects: [ // Objects in the scene
		new Sphere({
			center: vec3(-3, 1, -2),
			radius: 1,
			color: new Color(0, 85, 170, 255)
		}),
		new Sphere({
			center: vec3(3, -1, -2),
			radius: 1,
			color: Color.WHITE
		})
	],

	lights: [ // Lights in the scene
		vec3(5.0, 5.0, 5.0)
	]
};
