WebGLFactory = {};
	WebGLFactory.canvas = null;
	WebGLFactory.renderer = null;
	WebGLFactory.camera = null;
	WebGLFactory.scene = null;
	WebGLFactory.light = null;
	WebGLFactory.stats = null;
	WebGLFactory.controls = null;
	WebGLFactory.projector = null;
	
//game main javascript arrays
GameMain = {};
	GameMain.images = new Array(7);
	GameMain.spline = new Array();
	GameMain.objects = new Array();
	GameMain.missileArr = new Array();
	GameMain.cities = new Array();
	GameMain.curvedLine = new Array();
	GameMain.shields = new Array();
	GameMain.counter = new Array();
	GameMain.ready = false;
	GameMain.isMouseDown = false;
	GameMain.objects2 = null,
	
SphereFactory = {};
	SphereFactory.radius = 5;
	SphereFactory.tangent = new THREE.Vector3();
	SphereFactory.axis = new THREE.Vector3();
	SphereFactory.up = new THREE.Vector3(0, 1, 0);

City = function(name, team, coord_arr, trps, trans, c_m, fact, rsF, haus, pop  ){
	this.isDead = false;
	this.name = name;
	this.team = team;
	this.teamName = (GameConstants.CAPITALIST == team) ? "Capitalist" : "Communist";
	this.coord = coord_arr;
	this.troops = 0;
	this.transports = trans;
	this.conventional_missiles = c_m;
	this.nuclear_missiles = 0;
	this.hydrogen_missiles = 0;
	this.factories = fact;
	this.researchFacilities = rsF;
	this.houses = haus;
	this.population = pop;
}

Missile = function(object, target){
	this.object = object;
	this.target = target;
}
