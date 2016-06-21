// Available datatypes
var Color;
var Entity;
var Light;
var Sphere;
var Plane;
var Disc;
var XYPlane;
var YZPlane;
var XZPlane;
var Box;

// To make new entity types, subclass Entity and implement an intersect function, like so:
// var MyEntity = Entity.extend({
// 	constructor: function(position, blah, ...) { // constructor
// 		// Call super constructor with
// 		arguments.callee.$.constructor.call(this, <arguments for Entity>);
// 		// Construct rest of object
// 		this.blah = blah;
// 	},

// 	intersect: function(ray) { // Don't forget to override intersect!
// 		// Implement intersection of a Ray with this object
// 		// Returns an Intersection object
// 		return new Intersection();
// 	}
// });

var config = {
	camera: { // Camera
		eye: vec3(-8.0, 8.0, 8.0), // Location of the viewer (vec3)
		at: vec3(0.0, 0.0, 0.0), // Point the viewer is looking at (vec3)
		up: vec3(0.0, 1.0, 0.0) // "Up" direction relative to eye (vec3)
	},

	plane: { // Viewing plane
		distance: 1, // Distance to viewing plane (float)
		fov: 45 // Field of view, in degrees (float)
		// Aspect ratio is calculated dynamically from the size of the canvas
	},

	background: Color.WHITE, // Background color

	entities: [ // Objects in the scene
		new Sphere({
			position: vec3(-1.5, 0, 0),
			radius: 1,
			color: new Color(0.0, 0.3, 0.6, 1.0),
			shininess: 5.0
		}),
		new Sphere({
			position: vec3(1.5, 0, 0),
			radius: 1,
			color: Color.WHITE,
			reflectivity: 0.8
		}),
		new XYPlane({
			position: vec3(0, 0, -5),
			normal: vec3(0, 0, 1),
			height: 10,
			width: 20,
			color: Color.WHITE,
			reflectivity: 1.0
		}),
		new Box({
			position: vec3(0, 0, -2),
			height: 2,
			width: 2,
			length: 2,
			color: Color.PURPLE,
			reflectivity: 0.4
		}),
		new Plane({
			position: vec3(0, -1, 0),
			normal: vec3(0, 1, 0),
			color: Color.WHITE,
			reflectivity: 0.0
		}),
		new Disc({
			position: vec3(-3, 0, -3),
			radius: 1,
			normal: vec3(1, 0, 1),
			color: Color.CYAN,
			reflectivity: 1.0
		})
	],

	lights: [ // Lights in the scene
		new Light({
			position: vec3(4.5, 1.0, 0.0),
			color: Color.GREEN
		}),
		new Light({
			position: vec3(-4.5, 1.0, 0.0),
			color: Color.WHITE
		}),
		new Light({
			position: vec3(0.0, 4.5, 0.0),
			color: Color.MAGENTA
			// attenuation: [1, 0.3, 0.06]
		})
	]
};
