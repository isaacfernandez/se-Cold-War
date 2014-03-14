 	var angularSpeed = 0.01; 
    var lastTime = 0;
    var mouseX = 0, mouseY = 0;
    
	//variables
    var canvas = null,
		renderer = null,
		camera = null,
		count = 0,
		scene = null,
		controls = null,
		objects2 = null,
		light = null,
		moonMesh = null,
		planetCloud = null,
		projector = null,
		startAnimation = setInterval(function(){checkStart()},30),
		total = 7,
		spline = [],
		objects = [],
		curvedLine = [],
		atmposphere = null,
		missileArr = [],
		cities = [],
		shields = [],
		counter = [],
		gCounter = 0,
		isMouseDown = false,
		readyToKill = false,
		radius = 5,
		tangent = new THREE.Vector3(),
		axis = new THREE.Vector3(),
		up = new THREE.Vector3(0, 1, 0),
		city_arr = new Array(),
		//replace these values with CSVs - need isaac to set up server reading
		cityLatLong = [[13.75,100.466],[39.913889,116.391667],[-34.603333,-58.381667],[30.05,31.233333],[28.61,77.23],
			[23.7,90.375],[41.013611,28.955],[-6.2,106.8],[24.86,67.01],[4.325,15.322222],
			[6.453056,3.395833],[-12.043333,-77.028333],[51.507222,0.1275],[14.583333,121],[19.433333,-99.133333],
			[55.75,37.616667],[40.6,-73.9],[-22.908333,-43.196389],[35.689444,139.691667]],
		//get the names of the cities from CSVs - this is bad..
		cityNames = ["Bangkok, Thailand","Beijing, China", "Buenos Aires, Argentina", "Cairo, Egypt",
		"Delhi, India", "Dhaka, Bangladesh", "Instanbul, Turkey", "Jakarta, Indonesia", "Karachi, Pakistan",
		"Kinshasa, Republic of Congo", "Lagos, Nigeria", "Lima, Peru", "London, UK", "Manila, Philippines",
		"Mexico City, Mexico", "Moscow, Russia", "New York City, USA","Rio de Janeiro, Brazil", "Tokyo, Japan"],
		citySide = ["ALLIED","COMMY","ALLIED","COMMY","ALLIED","COMMY","ALLIED","COMMY","ALLIED","COMMY",
		"ALLIED","COMMY","ALLIED","COMMY","ALLIED","COMMY","ALLIED","COMMY","ALLIED"];
		
	City = function( name, team, coord, armed, population, troops){
		this.name = name;
		this.team = team;
		this.coord = coord;
		this.armed = armed;
		this.population = population;
		this.troops = troops;
		this.isDead = false;
	}
	
	//sets up city properties
	function Cities(){
		for(var i = 0;i<cityLatLong.length;i++){
			city_arr.push( new City(cityNames[i], citySide[i], latLongToVector3(cityLatLong[i][0],cityLatLong[i][1],radius,0), false, 1000, 0) );
		}
	}
	
	Missile = function(object, target){
		this.object = object;
		this.target = target;
	}

	//create city dots and interactivity
	function setParticles(){
		for(var i = 0;i<city_arr.length;i++){
			var shield = new THREE.SphereGeometry(.4,32,32);
			var color;
			color = (city_arr[i].team=="COMMY") ? 0xFF0000 : 0x000FF;
			var shieldMaterial = new THREE.MeshBasicMaterial({
				color: color,
				opacity: 0.35,
				transparent: true
			});
			var shieldMesh = new THREE.Mesh(shield, shieldMaterial);
				shieldMesh.position = city_arr[i].coord;
				shieldMesh.id = shields.length;
			var city = new THREE.SphereGeometry(.1, 32, 32);
			var cityMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff});//Math.random() * 0xffffff, opacity: 0.1 } );
			var cityMesh = new THREE.Mesh(city,cityMaterial);
				cityMesh.position = city_arr[i].coord;
				cityMesh.id = cities.length;
			objects2.add(cityMesh);
			objects2.add(shieldMesh);
			cities.push(cityMesh);
			shields.push(shield);
		}scene.add(objects2);
	}
	
	//convert the lat/long of countries to Cartesian x/y/z
	function latLongToVector3( lat, lon, radius, heigth ) {
        var phi = ( lat ) * Math.PI/180;
        var theta = ( lon - 180 ) * Math.PI/180;
        var x = -( radius + heigth ) * Math.cos( phi ) * Math.cos( theta );
        var y = ( radius + heigth ) * Math.sin( phi );
        var z = ( radius + heigth ) * Math.cos( phi ) * Math.sin( theta );
        var latLongOnSphere	= new THREE.Vector3( x, y, z );
        return latLongOnSphere;
    }
		
	//rendering loop
	function animate(){
		// update
        var time = (new Date()).getTime();
        var timeDiff = time - lastTime;
        var angleChange = angularSpeed * timeDiff * 2 * Math.PI / 1000;
        planetCloud.rotation.y += angleChange;
		lastTime = time;
        // request new frame
        controls.update();
		render();
		renderer.render( scene, camera );
		requestAnimationFrame(animate);
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
		isMouseDown = true;
		controls.enabled = false;
		detectIntersections(event);
	}
	
	//detect mouse up
	function onDocumentMouseUp(event){
		isMouseDown = false;
		controls.enabled = true;
		for(var i = 0;i<cities.length;i++){
			cities[i].material.color.setHex( 0xffffff );
		}
	}
	
	//handle window resizing for more precise click detections
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
	
	//create a missile
	function moveBox(){
		for(var i = 0;i<missileArr.length;i++){
			if(missileArr[i]!=null){
				if(counter[i] <= 1){
					missileArr[i].object.position = spline[i].getPointAt(counter[i]);
					tangent = spline[i].getTangentAt(counter[i]).normalize();
					axis.crossVectors(up, tangent).normalize();
					var radians = Math.acos(up.dot(tangent));
					missileArr[i].object.quaternion.setFromAxisAngle(axis, radians);
					counter[i] += 0.005;
				}else{
					removeObject(i);
				}
			}
		}
	}
	
	//remove missile and flight path
	function removeObject(i){
		scene.remove(curvedLine[i]);
		counter.splice(i,1);
		city_arr[missileArr[i].target].population -= 500;
		if(city_arr[missileArr[i].target].isDead==false && city_arr[missileArr[i].target].population<=0){
			for(var k = 0;k<2;k++){
				for(var j = 0;j<objects2.children.length;j++){
					if(objects2.children[j].id==missileArr[i].target){
						objects2.remove(objects2.children[j]);
						city_arr[missileArr[i].target].isDead=true;
					}
				}
			}
		}
		scene.remove(missileArr[i].object);
		missileArr.splice(i,1);
		spline.splice(i,1);
		curvedLine.splice(i,1);
		objects.splice(i,1);
	}
	
	function detectIntersections(event){
		//set up intersection detection
		var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, .5 );
			projector.unprojectVector( vector, camera );
		var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
		var intersects = raycaster.intersectObjects( cities );
		if(intersects.length>0){
		var intersect = intersects[0].object.id;
			if(isMouseDown){
				intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
				if(readyToKill==false){
					//set first destination
					console.log(city_arr[intersect].name+" is active");
					for(var j = 0;j<city_arr.length;j++)
						city_arr[j].armed=false;
					city_arr[intersect].armed=true;
					readyToKill = true;
				}else if((city_arr[intersect].armed == false)){
					makeMissile(intersects[0]);
					//reset detection
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
				objects2.updateMatrixWorld();
				//find the second destination
				var toIndex = intersects.object.id;
				console.log(city_arr[i].name+" to "+city_arr[toIndex].name);
				
				//log pos1 cartesian to pos2 cartesian
				var pos1 = new THREE.Vector3();
					pos1.getPositionFromMatrix( cities[i].matrixWorld );
				var pos2 = new THREE.Vector3();
					pos2.getPositionFromMatrix( intersects.object.matrixWorld );
				var lineGeometry = makeConnectionLineGeometry(pos1,pos2,null,null);
						
				//get the points for missile flight path
				var points = getVertexes();
				var aSpline = new THREE.SplineCurve3(points);
					spline.push(aSpline);
				
				var colors = (city_arr[i].team=="COMMY") ? 0xff0000 : 0x0000ff;
				
				//war head geometry and material
				var geometry1 = new THREE.CylinderGeometry(0, .075, .1, 50, 50, false);
				var material1 = new THREE.MeshBasicMaterial({color: colors});
				var boxes1 = new THREE.Mesh(geometry1, material1);
				boxes1.position.set(boxes1.position.x,boxes1.position.y+.2,boxes1.position.z);
				
				//missile body geometry and material
				var geometry2 = new THREE.CylinderGeometry(.075, .075, .3, 50, 50, false);
				var material2 = new THREE.MeshBasicMaterial({color: colors});
				var boxes2 = new THREE.Mesh(geometry2, material2);	
				
				//missile
				var missile = new THREE.Object3D();
					missile.add(boxes1);
					missile.add(boxes2);
				missileArr.push(new Missile(missile,intersects.object.id));
					scene.add(missile);
					counter.push(0);
						
				//make the red flight path line
				var curvedLineMaterial =  new THREE.LineBasicMaterial( { color: 0xFF0000, linewidth: 1 } );
				var curvedLines = new THREE.Line(lineGeometry, curvedLineMaterial);
				curvedLine.push(curvedLines);
					scene.add(curvedLines);
					objects.push(curvedLines);
				readyToKill=false;
				for(var j = 0;j<city_arr.length;j++){
					city_arr[j].armed=false;
				}
				break;
			}else if(city_arr[i].armed==true && city_arr[intersects.object.id].team==city_arr[i].team){
				console.log(city_arr[intersects.object.id].team+" to "+city_arr[i].team+" wont work");
				readyToKill=false;
				for(var j = 0;j<city_arr.length;j++){
					city_arr[j].armed=false;
				}
			}
		}
	}
	
	//render screen and camera positioning
	function render() {
      if(isMouseDown){
			var timer = new Date().getTime() * 0.0005;
			var i = 1;
			var rotSpeed  = .02;
			var x = camera.position.x;
			var z = camera.position.z;
			var x2 = light.position.x;
			var z2 = light.position.z;
			if(mouseX<-.4){//left click
				camera.position.x = x * Math.cos(rotSpeed) - z * Math.sin(rotSpeed);
				camera.position.z = z * Math.cos(rotSpeed) + x * Math.sin(rotSpeed);
				light.position.x = x2 * Math.cos(rotSpeed) - z2 * Math.sin(rotSpeed);
				light.position.z = z2 * Math.cos(rotSpeed) + x2 * Math.sin(rotSpeed);
			}else if(mouseX>.4){//right click
				camera.position.x = x * Math.cos(rotSpeed) + z * Math.sin(rotSpeed);
				camera.position.z = z * Math.cos(rotSpeed) - x * Math.sin(rotSpeed);
				light.position.x = x2 * Math.cos(rotSpeed) + z2 * Math.sin(rotSpeed);
				light.position.z = z2 * Math.cos(rotSpeed) - x2 * Math.sin(rotSpeed);
			}
		}camera.lookAt( scene.position );
    }	
		
	function checkStart(){
		if(count==total){
			console.log("gay");
			animate();//start rendering loop
			clearInterval(startAnimation);
		}else{
			console.log("Agh"+count+" "+total);
		}
	}
		
	//pretty much the main function..	
	function init(){	
		Cities();
		//initial settings - scene and rendering
		canvas = document.getElementById("container");
		document.body.appendChild(canvas);
		renderer = new THREE.WebGLRenderer({antialias: true});
		var w = window.innerWidth;
		var h = window.innerHeight;
		renderer.setSize(w,h);
		canvas.appendChild(renderer.domElement);
		
		//scene
		scene = new THREE.Scene();
		
		//projector
		projector = new THREE.Projector();
		
		//rotational object
		objects2 = new THREE.Object3D();
		objects2.position.set(0,0,0);
		
		//camera
		camera = new THREE.PerspectiveCamera( 45, w/h, 1, 10000 );
		camera.position.z = 35;
		
		//controls
		controls = new THREE.TrackballControls( camera );
			controls.minDistance = radius*3;
			controls.maxDistance = 40;
		controls.addEventListener( 'change', render );
		
		//light
		scene.add(new THREE.AmbientLight(0x333333));
		light = new THREE.DirectionalLight(0xffffff, 1);
		light.position.set(5,2,5);
		scene.add(light);		
		total = 7;
		count=0;
		//earth color texture
		var texture = new THREE.TextureLoader();
			texture.load("images/earth-day.jpg",function(t){
				count++;
			});
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.needsUpdate = true;
		
		//bump texture - for mountains and ridges
		var textureBump = new THREE.TextureLoader();
			textureBump.load("images/earthBump.jpg",function(t){
				count++;
			});
			textureBump.wrapS = textureBump.wrapT = THREE.RepeatWrapping;
			textureBump.needsUpdate = true;
		
		//glare texture
		var textureSpec = new THREE.TextureLoader();
			textureSpec.load("images/earthSpec.jpg",function(t){
				count++;
			});
			textureSpec.wrapS = textureSpec.wrapT = THREE.RepeatWrapping;
			textureSpec.needsUpdate = true;
		
		//cloud texture
		var textureCloud1 = new THREE.TextureLoader();
			textureCloud1.load("images/clouds.png",function(t){
				count++;
			});
			textureCloud1.wrapS = textureCloud1.wrapT = THREE.RepeatWrapping;
			textureCloud1.needsUpdate = true;		
		
		//planet sphere
		var planet = new THREE.SphereGeometry(radius, 64, 32);
		var planetMaterial = new THREE.MeshPhongMaterial({
			map: texture,
			bumpMap: textureBump,
			bumpScale: .2,
			specularMap: textureSpec,
			specular: new THREE.Color('grey')
			//wireframe: true
		});
		
		var planetMaterial2 = new THREE.MeshLambertMaterial({
			map: textureCloud1,
			side        : THREE.DoubleSide,
		 	opacity     : 0.35,
  			transparent : true
		});
		
		var customMaterialAtmosphere = new THREE.ShaderMaterial({
	    	uniforms:       
				{ 
					"c": {type: "f", value: .5 },
					"p": {type: "f", value: 6.0}
				},
			vertexShader:   document.getElementById('vertexShaderAtmosphere').textContent,
			fragmentShader: document.getElementById('fragmentShaderAtmosphere').textContent
		});
		
		var mesh = new THREE.Mesh( planet.clone(), customMaterialAtmosphere );
		mesh.scale.x = mesh.scale.y = mesh.scale.z = 1.1;
		mesh.material.side = THREE.BackSide;
		scene.add(mesh);
		
		//moon color texture
		var moontexture = new THREE.TextureLoader();
			moontexture.load("images/moon.jpg",function(t){
				count++;
			});
			moontexture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			moontexture.needsUpdate = true;
		
		//bump texture - for mountains and ridges
		var moontextureBump = new THREE.TextureLoader();
			moontextureBump.load("images/moonBump.jpg",function(t){
				count++;
			});
			moontextureBump.wrapS = textureBump.wrapT = THREE.RepeatWrapping;
			moontextureBump.needsUpdate = true;
		
		var moon = new THREE.SphereGeometry(1.36,32,32);
		var moonMaterial = new THREE.MeshPhongMaterial({
			map: moontexture,
			bumpMap: moontextureBump,
			bumpScale: .01
			//wireframe: true
		});
		
		//moon texture
		moonMesh = new THREE.Mesh(moon,moonMaterial);
			moonMesh.position.set(6,6,20);
			scene.add(moonMesh);
		
		//star texture picture
		var starss = new THREE.TextureLoader();
			moontextureBump.load("images/galaxy_starfield.png",function(t){
				count++;
			});
			starss.wrapS = starss.wrapT = THREE.RepeatWrapping;
			starss.needsUpdate = true;
		
		//star field background		
		var stars = new THREE.Mesh(
			new THREE.SphereGeometry(600, 32, 32), 
			new THREE.MeshPhongMaterial({
				map: starss,
				side: THREE.BackSide
			})
		);
		scene.add(stars);
				
		var planetMesh = new THREE.Mesh(planet, planetMaterial);
		planetCloud = new THREE.Mesh(new THREE.SphereGeometry(radius+.05,32,32), planetMaterial2);
			objects.push(planetMesh);
			scene.add(planetCloud);
			setParticles();//make cities
			scene.add(planetMesh);
		//document mouse events
		document.addEventListener( 'mousemove', onDocumentMouseMove, false );
		document.addEventListener( 'mousedown', onDocumentMouseDown, false );
		document.addEventListener( 'mouseup', onDocumentMouseUp, false );
		window.addEventListener( 'resize', onWindowResize, false );
			setInterval(moveBox, 30);//start missile loop - independent of render loop
	}