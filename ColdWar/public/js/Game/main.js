	var angularSpeed = 0.01; 
    var lastTime = 0;
    var mouseX = 0, mouseY = 0;
    
	//variables
    var	loader = null,
		gMissile = null,
		gSatellite = null,
		dae = null,
		period = 0,
		doneLoading = false;
		planetCloud = null,
		triangle = null,
		city_arr = new Array();
	
	//create city dots and interactivity
	function setParticles(){
		for(var i = 0;i<city_arr.length;i++){
			var shield = new THREE.SphereGeometry(.4,32,32);
			var color = (city_arr[i].team== GameConstants.COMMUNIST) ? 0xFF0000 : 0x000FF;
			var shieldMaterial = new THREE.MeshBasicMaterial({
				color: color,
				opacity: 0.35,
				transparent: true
			});
			var shieldMesh = new THREE.Mesh(shield, shieldMaterial);
				shieldMesh.position = latLongToVector3(city_arr[i].coord[0],city_arr[i].coord[1],SphereFactory.radius,0);
				shieldMesh.id = GameMain.shields.length;
			var city = new THREE.SphereGeometry(.1, 32, 32);
			var cityMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff});
			var cityMesh = new THREE.Mesh(city,cityMaterial);
				cityMesh.position = latLongToVector3(city_arr[i].coord[0],city_arr[i].coord[1],SphereFactory.radius,0);
				cityMesh.id = GameMain.cities.length;
			GameMain.objects2.add(cityMesh);
			GameMain.objects2.add(shieldMesh);
			GameMain.cities.push(cityMesh);
			GameMain.shields.push(shield);
		}WebGLFactory.scene.add(GameMain.objects2);
	}
	
	//convert the lat/long of countries to Cartesian x/y/z
	function latLongToVector3( lat, lon, radius, height ) {
        var radius = SphereFactory.radius;
        var phi = ( lat ) * Math.PI/180;
        var theta = ( lon - 180 ) * Math.PI/180;
        var x = -( radius + height ) * Math.cos( phi ) * Math.cos( theta );
        var y = ( radius + height ) * Math.sin( phi );
        var z = ( radius + height ) * Math.cos( phi ) * Math.sin( theta );
        var latLongOnSphere	= new THREE.Vector3( x, y, z );
        return latLongOnSphere;
    }
		
	//rendering loop
	function animate(){
		// update
        var time = (new Date()).getTime();
        var deltaTime = time - lastTime;
        var angleChange = angularSpeed * deltaTime * 2 * Math.PI / 1000;
        clouds.rotation.y += angleChange;
		lastTime = time;
        // request new frame
		requestAnimationFrame(animate);
		WebGLFactory.stats.update();
        WebGLFactory.controls.update();
		render();
	}
	
	//detect where x and y is
	function onDocumentMouseMove(event) {
		mouseX = ( event.clientX / (window.innerWidth))-0.5;
		mouseY = ( event.clientY / (window.innerHeight))-0.5;
		detectIntersections(event);
	}
	
	//detect mouse down
	function onDocumentMouseDown(event){
		event.preventDefault();
		GameMain.isMouseDown = true;
		WebGLFactory.controls.enabled = false;
		detectIntersections(event);
	}
	
	//detect mouse up
	function onDocumentMouseUp(event){
		GameMain.isMouseDown = false;
		WebGLFactory.controls.enabled = true;
		for(var i = 0;i<GameMain.cities.length;i++){
			GameMain.cities[i].material.color.setHex( 0xffffff );
		}
	}
	
	//handle window resizing for more precise click detections
	function onWindowResize() {
		WebGLFactory.camera.aspect = window.innerWidth / window.innerHeight;
		WebGLFactory.camera.updateProjectionMatrix();
		WebGLFactory.renderer.setSize( window.innerWidth, window.innerHeight );
	}
	
	//create a missile
	function moveBox(){
		for(var i = 0;i<GameMain.missileArr.length;i++){
			if(GameMain.missileArr[i]!=null){
				if(GameMain.counter[i] <= 1){
					GameMain.missileArr[i].object.position = GameMain.spline[i].getPointAt(GameMain.counter[i]);
					SphereFactory.tangent = GameMain.spline[i].getTangentAt(GameMain.counter[i]).normalize();
					SphereFactory.axis.crossVectors(SphereFactory.up, SphereFactory.tangent).normalize();
					var radians = Math.acos(SphereFactory.up.dot(SphereFactory.tangent));
					GameMain.missileArr[i].object.quaternion.setFromAxisAngle(SphereFactory.axis, radians);
					GameMain.counter[i] += 0.005;
				}else{
					removeObject(i);
				}
			}
		}
	}
	
	//remove missile and flight path
	function removeObject(i){
		WebGLFactory.scene.remove(GameMain.curvedLine[i]);
		GameMain.counter.splice(i,1);
		var target = GameMain.missileArr[i].target;
		city_arr[target].population -= 500;
		if(city_arr[target].isDead==false && city_arr[target].population<=0){
			for(var k = 0;k<2;k++){
				for(var j = 0;j<GameMain.objects2.children.length;j++){
					if(GameMain.objects2.children[j].id==target){
						GameMain.objects2.remove(GameMain.objects2.children[j]);
						city_arr[target].isDead=true;
					}
				}
			}
		}
		WebGLFactory.scene.remove(GameMain.missileArr[i].object);
		GameMain.missileArr.splice(i,1);
		GameMain.spline.splice(i,1);
		GameMain.curvedLine.splice(i,1);
		GameMain.objects.splice(i,1);
	}
	
	function detectIntersections(event){
		//set up intersection detection
		var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, .5 );
			WebGLFactory.projector.unprojectVector( vector, WebGLFactory.camera );
		var CP = WebGLFactory.camera.position;
		var raycaster = new THREE.Raycaster( CP, vector.sub( CP ).normalize() );
		var intersects = raycaster.intersectObjects( GameMain.cities );
		if(intersects.length>0){
		var intersect = intersects[0].object.id;
			if(GameMain.isMouseDown){
				intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
				if(!GameMain.ready){
					//set first destination
					if(player.teamName==city_arr[intersect].teamName){
						console.log(city_arr[intersect].name+" is active");
						city_arr[intersect].armed=true;
						GameMain.ready = true;
					}
				}else if((city_arr[intersect].armed == false)){
					makeMissile(intersects[0]);
				}
			}else{
				var container = document.getElementById("info");
				document.getElementById('infoH2').innerHTML = "<strong>"+city_arr[intersects[0].object.id].name+"</strong>";
				container.style.display = "block";
			}
		}else{
			document.getElementById("info").style.display = "none";
		}
	}
	
	function makeMissile(intersects){
		for(var i = 0;i<city_arr.length;i++){
			if(city_arr[i].isDead==false && 
			city_arr[i].armed==true && city_arr[intersects.object.id].team!=city_arr[i].team 
			&& city_arr[intersects.object.id].isDead==false){
				GameMain.objects2.updateMatrixWorld();
				//find the second destination
				var toIndex = intersects.object.id;
				console.log(city_arr[i].name+" to "+city_arr[toIndex].name);
				
				//log pos1 cartesian to pos2 cartesian
				var pos1 = new THREE.Vector3();
					pos1.setFromMatrixPosition( GameMain.cities[i].matrixWorld );
				var pos2 = new THREE.Vector3();
					pos2.setFromMatrixPosition( intersects.object.matrixWorld );
				var lineGeometry = makeConnectionLineGeometry(pos1,pos2,null,null);
						
				//get the points for missile flight path
				var points = getVertexes();
				var aSpline = new THREE.SplineCurve3(points);
					GameMain.spline.push(aSpline);
				var missile = gMissile.clone();
					missile.scale.x = missile.scale.y = missile.scale.z = .05;
				var spriteMaterial = new THREE.SpriteMaterial({
					map: triangle,
					useScreenCoordinates: false
				});
				var sprite = new THREE.Sprite( spriteMaterial );
				sprite.scale.set( 1.0, 1.0, 1.0 );
				var objectMissile = new THREE.Object3D();
					objectMissile.add(missile);
					objectMissile.add(sprite);
				GameMain.missileArr.push(new Missile(objectMissile,intersects.object.id));
				WebGLFactory.scene.add(objectMissile);
				GameMain.counter.push(0);
						
				//make the red flight path line
				var curvedLineMaterial =  new THREE.LineBasicMaterial( { color: 0xFF0000, linewidth: 1 } );
				var thisLine = new THREE.Line(lineGeometry, curvedLineMaterial);
				GameMain.curvedLine.push(thisLine);
					WebGLFactory.scene.add(thisLine);
					GameMain.objects.push(thisLine);
					resetFiring();
				break;
			}else if(city_arr[i].armed==true && city_arr[intersects.object.id].team==city_arr[i].team){
				console.log(city_arr[intersects.object.id].team+" to "+city_arr[i].team+" wont work");
				resetFiring();
			}
		}
	}
	
	function resetFiring(){
		GameMain.ready = false;
		for(var j = 0;j<city_arr.length;j++){
			city_arr[j].armed=false;
		}
	}
	
	//render screen and camera positioning
	function render() {
		callArrows(mouseX);
			var timer = new Date().getTime() * 0.0005;
			var rotSpeed = .02;
			var x = moon.position.x;
			var z = moon.position.z;
			moon.position.x = x * Math.cos(rotSpeed) + z * Math.sin(rotSpeed)/2.5;
			moon.position.z = z * Math.cos(rotSpeed) + (-1*x) * Math.sin(rotSpeed/2)/2.5;
		if(GameMain.isMouseDown){
			var rotSpeed  = .02;
			var x = WebGLFactory.camera.position.x;
			var z = WebGLFactory.camera.position.z;
			var x2 = WebGLFactory.light.position.x;
			var z2 = WebGLFactory.light.position.z;
			if(mouseX<-.4 || mouseX>.4){//left click
				WebGLFactory.camera.position.x = x * Math.cos(rotSpeed) + ((mouseX/Math.abs(mouseX))*z) * Math.sin(rotSpeed);
				WebGLFactory.camera.position.z = z * Math.cos(rotSpeed) + (-1*(mouseX/Math.abs(mouseX))*x) * Math.sin(rotSpeed);
				WebGLFactory.light.position.x = x2 * Math.cos(rotSpeed) + ((mouseX/Math.abs(mouseX))*z2) * Math.sin(rotSpeed);
				WebGLFactory.light.position.z = z2 * Math.cos(rotSpeed) + (-1*(mouseX/Math.abs(mouseX))*x2) * Math.sin(rotSpeed);
			}
    	}
    	WebGLFactory.camera.lookAt( WebGLFactory.scene.position );
		WebGLFactory.renderer.render( WebGLFactory.scene, WebGLFactory.camera );
    }	
		
	function load(){
		if (!Detector.webgl){
			Detector.addGetWebGLMessage();
		}else{
			loadCollada();
		}
	}
	
	//first load the collada missiles
	function loadCollada(){
		loader = setInterval(change, 200);
		var dir = 'multimedia/dae/';
		var missile = new THREE.ColladaLoader(dir+"Texture.png");
			missile.options.convertUpAxis = true;
			missile.load( dir+'missile.dae', function( collada ) {
				dae = collada.scene;
				dae.updateMatrix();
				gMissile = dae;
				var satellite = new THREE.ColladaLoader(dir+"Texture.png");
					satellite.options.convertUpAxis = true;
					satellite.load(dir+"hubble.dae", function(collada){
						dae = collada.scene;
						dae.updateMatrix();
						gSatellite = dae;
							preloadImages();
					});
			});
	}
	
	//then load the images for the geometries...
	function preloadImages(){
		imageArr = ["earth.jpg","earthBump.jpg","earthSpec.jpg", "clouds.png", "moon.jpg", "moonBump.jpg", "star.png", "triangle.png"];
		var total = imageArr.length;
		var dir = "multimedia/images/";
		GameMain.images[0] = THREE.ImageUtils.loadTexture(dir+imageArr[0],{},function(){
			GameMain.images[1] = THREE.ImageUtils.loadTexture(dir+imageArr[1],{},function(){
				GameMain.images[2] = THREE.ImageUtils.loadTexture(dir+imageArr[2],{},function(){
					GameMain.images[3] = THREE.ImageUtils.loadTexture(dir+imageArr[3],{},function(){
						GameMain.images[4] = THREE.ImageUtils.loadTexture(dir+imageArr[4],{},function(){
							GameMain.images[5] = THREE.ImageUtils.loadTexture(dir+imageArr[5],{},function(){
								GameMain.images[6] = THREE.ImageUtils.loadTexture(dir+imageArr[6],{},function(){
									GameMain.images[7] = THREE.ImageUtils.loadTexture(dir+imageArr[7],{},function(){
										changeLoadingDiv();
									});
								});
							});
						});
					});
				});
			});
		});
	}


	//pretty much the main function.. load the earth, moon, stars, camera, and light objects..
	function init(){	
		/*set the cities first*/city_arr = game.cities;
		//initial settings - scene and rendering
		var w = window.innerWidth;
		var h = window.innerHeight;
		WebGLFactory.canvas = document.getElementById("container");
		document.body.appendChild(WebGLFactory.canvas);
		WebGLFactory.stats = new Stats();
		WebGLFactory.canvas.appendChild( WebGLFactory.stats.domElement );
		WebGLFactory.renderer = (window.WebGLRenderingContext) ? new THREE.WebGLRenderer({antialias:true}) : new THREE.CanvasRenderer();
		WebGLFactory.renderer.setSize(w,h);
		WebGLFactory.canvas.appendChild(WebGLFactory.renderer.domElement);
		
		//scene
		WebGLFactory.scene = new THREE.Scene();
		
		//the satellite
		var satellite = gSatellite.clone();
			satellite.scale.x = satellite.scale.y = satellite.scale.z = .01;
			satellite.position.z = 10;
			WebGLFactory.scene.add(satellite);
		
		//particles
		var geometry = new THREE.Geometry();
		for( i = 0; i < 5000; i ++ ) {
			var vertex = new THREE.Vector3();
			while(Math.abs(vertex.x)<50&&Math.abs(vertex.y)<50&&Math.abs(vertex.z<50)){
				//determine if its close enough for visibility and far enough to be realistic
				vertex.x = 650 * Math.random()-250;
				vertex.y = 650 * Math.random()-250;
				vertex.z = 650 * Math.random()-250;
			}geometry.vertices.push( vertex );
		}
		
		//create the whole collection of particles = faster fps
		var material = new THREE.ParticleSystemMaterial({ 
			size: 1,
			map: GameMain.images[6],
			transparent: true
		});
		//material.setHSL(360,100,100);
		var particles = new THREE.ParticleSystem( geometry, material );
			particles.sortParticles = true;
			WebGLFactory.scene.add( particles );
		
		//projector
		WebGLFactory.projector = new THREE.Projector();
		
		//rotational object
		GameMain.objects2 = new THREE.Object3D();
		GameMain.objects2.position.set(0,0,0);
		
		//camera
		WebGLFactory.camera = new THREE.PerspectiveCamera( 45, w/h, 1, 10000 );
			WebGLFactory.camera.position.z = 35;
		
		//controls
		WebGLFactory.controls = new THREE.TrackballControls(WebGLFactory.camera);
			WebGLFactory.controls.minDistance = SphereFactory.radius*3;
			WebGLFactory.controls.maxDistance = 40;
			WebGLFactory.controls.addEventListener( 'change', render );
		
		//light
		WebGLFactory.scene.add(new THREE.AmbientLight(0x333333));
		WebGLFactory.light = new THREE.DirectionalLight(0xffffff, 1);
			WebGLFactory.light.position.set(5,2,5);
			WebGLFactory.scene.add(WebGLFactory.light);
		
		triangle = GameMain.images[7];
		
		//planet sphere
		var planet = new THREE.Mesh(
			new THREE.SphereGeometry(SphereFactory.radius, 32, 32),
			new THREE.MeshPhongMaterial({
			map: GameMain.images[0],
			bumpMap: GameMain.images[1],
			bumpScale: .15,
			specularMap: GameMain.images[2]
			//wireframe: true
		}));
			GameMain.objects.push(planet);
			WebGLFactory.scene.add(planet);
		
		//custom shader for cloud aura
		var customMaterialAtmosphere = new THREE.ShaderMaterial({
	    	uniforms:       
				{ 
					"c": {type: "f", value: .5 },
					"p": {type: "f", value: 4.0}
				},
			vertexShader:   document.getElementById('vertexShaderAtmosphere').textContent,
			fragmentShader: document.getElementById('fragmentShaderAtmosphere').textContent,
			transparent: true
		});
		
		var mesh = new THREE.Mesh( planet.geometry.clone(), customMaterialAtmosphere );
			mesh.scale.x = mesh.scale.y = mesh.scale.z = 1.1;
			mesh.material.side = THREE.BackSide;
			WebGLFactory.scene.add(mesh);
		
		//moon geometry w/ material and bump map = realism
		moon = new THREE.Mesh(new THREE.SphereGeometry(1.36,32,32), 
			new THREE.MeshPhongMaterial({
			map: GameMain.images[4],
			bumpMap: GameMain.images[5],
			bumpScale: .001
			//wireframe: true
		}));
			moon.position.set(6,6,20);
			WebGLFactory.scene.add(moon);
				
		clouds = new THREE.Mesh(new THREE.SphereGeometry(SphereFactory.radius+.05,32,32), 
			new THREE.MeshBasicMaterial({
				map: GameMain.images[3],
  				transparent: true
		}));
			WebGLFactory.scene.add(clouds);
			setParticles();//make cities
			
		//document mouse events
		document.addEventListener( 'mousemove', onDocumentMouseMove, false );
		document.addEventListener( 'mousedown', onDocumentMouseDown, false );
		document.addEventListener( 'mouseup', onDocumentMouseUp, false );
		window.addEventListener( 'resize', onWindowResize, false );
		
		setInterval(moveBox, 30);//start missile loop - independent of render loop
		animate();//start rendering loop
	}