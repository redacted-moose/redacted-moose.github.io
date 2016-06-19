function Color (r, g, b, a) {
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
			switch (Math.floor(args.h/60)) {
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
Color.prototype.toVec4 = function() {
	return vec4(this.r, this.g, this.b, this.a);
};
Color.fromVec4 = function(vec) {
	return new Color(vec[0], vec[1], vec[2], vec[3]);
};

Color.RED = new Color(1.0, 0.0, 0.0);
Color.YELLOW = new Color(1.0, 1.0, 0);
Color.GREEN = new Color(0, 1.0, 0);
Color.CYAN = new Color(0, 255, 255);
Color.BLUE = new Color(0, 0, 255);
Color.MAGENTA = new Color(1.0, 0, 1.0);
Color.BLACK = new Color(0, 0, 0);
Color.WHITE = new Color(1.0, 1.0, 1.0);
Color.PURPLE = new Color({h: 300, s: 1.0, v: 0.5});

function Light (position, color) {
	Entity.call(this, {position: position, color: color});
	this.attenuation = vec3(1, 0.1, 0.02);
}
Light.reflect = function(u, v) {
	return subtract(scale(2 * dot(u, v), v), u);
};
Light.lighting = function(intersection, camera) {
	var ambientColor = mult(intersection.entity.ambient_constant, intersection.entity.color.toVec4());
	var diffuseColor = vec4(0, 0, 0, 0);
	var specularColor = vec4(0, 0, 0, 0);

	for (var i = 0; i < config.lights.length; i++) {
		var light = config.lights[i];
		var toLightVector = subtract(intersection.point, light.position);
		var distance = length(toLightVector);
		var lightDirection = normalize(toLightVector);
		var attenuationFactor = light.attenuation[0] +
				(light.attenuation[1] * distance) +
				(light.attenuation[2] * distance * distance);

		// reflection = normalize(2 * (lightDirection . normal) * normal - lightDirection)
		var reflection = normalize(Light.reflect(lightDirection, intersection.normal));

		var brightness = dot(intersection.normal, lightDirection);
		// brightness = Math.max(0.0, brightness);

		var colorScale = scale(brightness/attenuationFactor, intersection.entity.diffuse_constant);
		// var colorVec = intersection.entity.color.toVec4();
		var colorVec = light.color.toVec4();

		var diffuse = mult(colorScale, colorVec);
		// diffuse.forEach(function(value) {Math.floor(value);});
		diffuseColor = add(diffuseColor, diffuse);

		var specular = mult(scale(Math.max(Math.pow(dot(reflection, camera), 0.0), 5.0), intersection.entity.specular_constant), light.color.toVec4());
		// specular.forEach(function(value) {Math.floor(value);});
		// console.log(specular);
		specularColor = add(specularColor, specular);
	}

	var totalColor = add(ambientColor, mult(diffuseColor, intersection.entity.color.toVec4()), specularColor);
	// var totalColor = specularColor;

	return Color.fromVec4(totalColor);
};

function Intersection (t, point, normal, entity) {
	this.t = t || Infinity;
	this.point = point || undefined;
	this.normal = normal || undefined;
	this.entity = entity || undefined;
}
Intersection.prototype.reset = function() {
	this.t = Infinity;
	this.point = undefined;
	this.normal = undefined;
	this.object = undefined;
};

function Entity (args) {
	this.position = args.position || vec3();
	this.rotation = args.rotation || vec3();
	this.scale = args.scale || vec3();
	this.color = args.color || new Color();
	this.ambient_constant = vec4(0.2, 0.2, 0.2, 1.0);
	this.diffuse_constant = vec4(1.0, 0.8, 0.0, 1.0);
	this.specular_constant = vec4(1.0, 0.8, 0.0, 1.0);
}
Entity.prototype.lighting = function(toCameraVector, surfaceNormal, point) {
	// var reflect = function(lightDir, norm) {
	// 	return add(scale(-2 * dot(lightDir, norm), norm), lightDir);
	// };

	// // var pow = function(vec, power) {
	// // 	vec.forEach(function(value, index) {
	// // 		this[index] = Math.pow(value, power);
	// // 	}, vec);
	// // };

	// var unitNormal = normalize(surfaceNormal);
	// var unitVectorToCamera = normalize(toCameraVector);

	// var totalDiffuse = vec4(0, 0, 0, 0);
	// var totalSpecular = vec4(0, 0, 0, 0);

	// for (var i = 0; i < config.lights.length; i++) {
	// 	var light = config.lights[i];
	// 	var distance = length(light.position);
	// 	var attFactor = light.attenuation[0] + (light.attenuation[1] * distance) + (light.attenuation[2] * distance * distance);

	// 	var unitLightVector = normalize(light.position);

	// 	var nDotl = dot(unitNormal, unitLightVector);
	// 	var brightness = Math.max(nDotl, 0.0); // Make sure it's a positive value

	// 	var lightDirection = negate(unitLightVector);
	// 	var reflectedLightDirection = reflect(lightDirection, unitNormal);

	// 	var specularFactor = dot(reflectedLightDirection, unitVectorToCamera);
	// 	specularFactor = Math.max(specularFactor, 0.0); // Make sure the specular factor is positive

	// 	// var dampedFactor = pow(specularFactor, shineDamper);
	// 	var dampedFactor = Math.pow(specularFactor, 1.0);

	// 	totalDiffuse = add(totalDiffuse, scale(brightness / attFactor, light.color.toVec4()));
	// 	// totalSpecular = add(totalSpecular, scale(dampedFactor * reflectivity / attFactor, light.color));
	// 	totalSpecular = add(totalSpecular, scale(dampedFactor * 1.0 / attFactor, light.color.toVec4()));
	// }

	// // totalDiffuse = Math.max(totalDiffuse, 0.2 * 255);
	// var out_Color = add(mult(totalDiffuse, this.color.toVec4()), totalSpecular);
	// return out_Color;

	return this.color;
};

function Sphere (center, radius, color) {
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
	var discriminant = b*b - 4*a*c;

	if (discriminant > 0) {
		var t = (-b - Math.sqrt(discriminant))/(2*a);
		var point = add(ray.start, scale(t, distance));
		return new Intersection(t, point, normalize(subtract(point, this.position)), this);
	} else {
		return new Intersection();
	}
};

var config = {
	camera: { // Camera
		eye: vec3(5.0, 5.0, 5.0), // Location of the viewer (vec3)
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
			center: vec3(-3, 1, -2),
			radius: 1,
			color: new Color(0.0, 0.3, 0.6, 1.0)
		}),
		new Sphere({
			center: vec3(3, -1, -2),
			radius: 1,
			color: Color.WHITE
		})
	],

	lights: [ // Lights in the scene
		new Light(vec3(0.0, 0.0, 0.0), Color.WHITE)
	]
};
