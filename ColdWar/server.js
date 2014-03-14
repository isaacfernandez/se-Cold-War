var express = require('express')
  , http = require('http');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);


		io.sockets.on('connection', function(socket) {
			var GameReadyState = 0;
			socket.emit('system_message', { message: "Socket connection established"});
			socket.on('request_team_join', function(data) {
				socket.emit('team_join_reply', { message: "Team join request received"});
					var game =  findGameByID(data.game_id);
				 if (game == null) { socket.emit('team_join_complete', {join_status: GameConstants.GAME_NOT_FOUND});
				} else {
					var gameResponse =game.addPlayer(data.team);
						if (gameResponse == GameConstants.NEW_PLAYER){
							socket.team = data.team;
							socket.gameId = data.game_id;
							console.log("A player has joined the game " + game.gameName);
							findGameByID( socket.gameId).status = "Joining";
							socket.broadcast.emit('game_message', {message: "A " + socket.team + " has joined the game." , game_id:socket.gameId});
						}	
					socket.emit('team_join_complete', {join_status: gameResponse});
					}//end else game not found
				});
			
			socket.on('load_request', function(){
				socket.emit('game_start', {game_state : findGameByID( socket.gameId) } );
				findGameByID( socket.gameId).gameReadyState++;
			});
			
			
			socket.on('player_ready', function(){
				findGameByID(socket.gameId).sockets.push(this);
				socket.player = findGameByID( socket.gameId).findPlayerByTeam(socket.team);
					console.log(socket.player.teamName + "is ready");
				findGameByID( socket.gameId).gameReadyState++;
				if( findGameByID( socket.gameId).gameReadyState == 4) {
					//Begin game loop
					console.log("GAME is ready to begin");
					findGameByID( socket.gameId).beginGame(); }
			});
			
			/*
			manufacturingCity: manuCityName,
			   military_production: mP, 
			   capital_production: capP,
			   research_budget: resB,
			   reserve_budget: rsvB  
			   
			   		this.militaryProductionP= 0.33;
		this.capitalProductionP = 0.33;
		this.consumerProductP = 0.33;
		this.researchBudget = 0.01;
		this.reserveBudget = 0.0;
			*/
			
			socket.on('player_update', function(data){
				socket.player.setManufacturingCity( data.manufacturingCity, findGameByID(socket.gameId).cities );
				socket.player.capitalProductionP = data.capital_production;
				socket.player.consumerProductP = data.military_production;
				socket.player.researchBudget = data.research_budget;
				socket.player.reserverBudget = data.reserve_budget;
			});
			
			socket.on('admin', function (data) {
				socket.emit('admin_message', {games : Games});
			});
			
		});
		
	
app.configure(function(){ //Configures static app
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
});

app.get('/getGames', function(req, res) {//Return a list of all games 
	var response ="";
	for (var i = 0; i < Games.length; i++){
	 response +=Games[i].gameName + ":" + Games[i].gameId + " status: " + Games[i].status + '</br>'
	 + 'game url is : <a href="/'+ Games[i].gameURL + '">this.</a> </br> ' ; 
	}
	
	for (var i = 0; i < Games.length; i++) {
			console.log(Games[i].gameName + " " + Games[i].gameId + " status: " + Games[i].status );
	}
	
	res.send(response);
});

/*
app.get('/createLobby', function(req, res) { //Create a new game object
   var GameName = req.query.GameName;
    var GameSpeed = req.query.GameSpeed;
	//var GameCities = req.body.GameCities;
    console.log("post received: %s %s", GameName, GameSpeed);
    if (!GameName) {  return res.send(400, 'Must specify a name!');  }
    if (!GameSpeed) {   return res.send(400, 'Must specify a speed'); }
    
	var city_arr = new Array();
		for(var i = 0;i<cityLatLong.length;i++){  //City = function(name, team, coord_arr, trps, trans, c_m, fact, rsF, haus, pop  )
			city_arr.push( new City(cityNames[i], cityTeam[i], cityLatLong[i], 10, 1, 1, 5, 1, 10, cityPopulations[i]) );
		}
		var newGame = new Game(GameName, GameSpeed, city_arr);
	Games.push( newGame  );
	res.send("Game has been created. It's game id is " + newGame.gameId + "</br>" + "<a href='/lobby.html'> Return to lobby </a>");
});

*/


app.post('/createLobby', function(req, res) { //Create a new game object
   var GameName = req.body.GameName;
    var GameSpeed = req.body.GameSpeed;
	//var GameCities = req.body.GameCities;
    console.log("post received: %s %s", GameName, GameSpeed);
    if (!req.body.GameName) {  return res.send(400, 'Must specify a name!');  }
    if (!req.body.GameSpeed) {   return res.send(400, 'Must specify a speed'); }
    
	var city_arr = new Array();
		for(var i = 0;i<cityLatLong.length;i++){  //City = function(name, team, coord_arr, trps, trans, c_m, fact, rsF, haus, pop  )
			city_arr.push( new City(cityNames[i], cityTeam[i], cityLatLong[i], 10, 1, 1, 5, 1, 10, cityPopulations[i]) );
		}
		var newGame = new Game(GameName, GameSpeed, city_arr);
	Games.push( newGame  );
	res.send("Game has been created. It's game id is " + newGame.gameId + "</br>" + "<a href='/lobby.html'> Return to lobby </a>");
});

server.listen(3000);

var Games = new Array();
	var id_counter = 0;
	function GameId(){
		return id_counter++;
	}
	function findGameByID( id ) {
   		for (var i = 0; i < Games.length; i++) {
			if (Games[i].gameId == id)  { 
			return Games[i]; }
		}
	return null;
	}

	//Credit for JavaScript implementation of the Haversine Formula for Straight Line Distances from Latitude and Longitudes
	var R = 6371; // km mean Radius of the earth
	function harversineDistance(lat1, lon1, lat2, lon2){
		var dLat = toRad(lat2-lat1);
		var dLon = toRad(lon2-lon1);
		var lat1 = toRad(lat1);
		var lat2 = toRad(lat2);
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    	    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		var distance = R * c;
	return distance;
	}
		
	function GameId(){return id_counter++; }
     function log10(val) {return Math.log(val) / Math.LN10; }
	
		
	function toRad(x) {
   		return x * Math.PI / 180; }
	function round( n ) { //rounds to three decimal places
		return (Math.round(n * 1000) / 1000);}
	
	//Game Constants
	GameConstants = {};
	GameConstants.CAPITALIST = 1;
	GameConstants.COMMUNIST = 2;
	GameConstants.NEUTRAL = 3;
	GameConstants.TROOP_COST = 150;
	GameConstants.TRANSPORT_COST = 1500;
	GameConstants.CONVENTIONAL_MISSILE_COST = 500000;
	GameConstants.NUCLEAR_MISSILE_COST = 500000;
	GameConstants.HYDROGEN_MISSILE_COST = 500000;
	
	GameConstants.NEW_PLAYER = 200;
	GameConstants.GAME_FULL = 400;
	GameConstants.TEAM_FULL = 401;
	GameConstants.GAME_NOT_FOUND = 404;
	 //the global location for object / object communication
	var GameSpeed;
	var p1, p2;
	var city_array;
	//Only for server	
	
	//All parties have the following
	Game = function( name , speed, cities ){
		this.gameId = GameId();
		this.status = "created";
		this.gameReadyState = 0;
		this.gameName = name;
		this.gameSpeed = speed;
		this.players = new Array();
		this.cities = cities;
		this.armies = new Array();
		this.missiles = new Array();
		this.gameLoop = null;
		
		this.sockets = new Array();
		
		var prevTime;
		var curTime;
		var deltaTime;
		
		
		this.update = function(){
			prevTime = curTime;
        	curTime = new Date().getTime();
        	deltaTime = (curTime - prevTime) / 100;	
        	console.log("delta " + deltaTime);
			for (var i = 0; i < this.players.length; i++){
				this.players[i].update(this);
			}
			for (var i = 0; i < this.missiles.length; i++){
				this.missiles[i].update();
			}
			
			for (var i = 0; i < this.sockets.length; i++){
			//if you want to hide information from the player, here is where
				//console.log(this);
				this.sockets[i].emit('game_update', {players: this.players, cities:this.cities});
			}
			
		};
		
		this.beginGame = function(){
			console.log(this.sockets);
			console.log('players1:%j' + this.players);
			this.gameLoop = setInterval(this.update.bind(this), 100000 / this.gameSpeed);
			curTime = new Date().getTime();
		};
		
		this.addPlayer = function( team ){
			console.log("attempting to join " + team);
			if (this.players.length >= 2) {
				console.log("Sorry, there are already two players in this game. Perhaps as a spectator?");
				return GameConstants.GAME_FULL;
			}
			if ( (this.players[0] != null) &&this.players[0].team == team) {
				console.log(this.players[0].team);
				console.log("Sorry, a player is already connected to that team.");
				return GameConstants.TEAM_FULL;
			}
			player = new Player(team)
			player.gameId = this.gameId;
			this.players.push(player);
			return GameConstants.NEW_PLAYER;
		};

		this.findPlayerByTeam = function (team){
			for (var i = 0; i < this.players.length; i++) {
				if (this.players[i].team == team) {
				return this.players[i];
				}
			}
		};
		
		this.missileLaunch = function(team, city_o, city_t, type){ //origin and target
			var missile;
			if (city_o.team == team && !city_t.isDead){ //We are shooting correctly, and at a city that is still standing
				switch (type) { //rework this with constants, what are you a noob
					case "conventional": 
						if (city_o.conventional_missiles > 0) {  missile = new Missile(city_o, city_t, type); };
						break;
					case "nuclear":
						if (city_o.nuclear_missiles > 0) {  missile = new Missile(city_o, city_t, type); };
						break;
					case "hydrogen":
						if (city_o.hydrogen_missiles > 0) { missile = new Missile(city_o, city_t, type); };
						break;
					default:
						break;
				}
				if (missile) {
                    missile.armed = true;				
					missiles.push(missile); //fuck my naming convention
					}
				}
		};
		
	}	
	Missile = function(origin, destination, type){
		this.origin = origin;
		this.destination = destination;
		this.type = type;
		thiss.isAlive = true;
		this.speed = 5; //Kilometers a second
		this.armed = false;
		
		this.travelDistance = harversineDistance(origin.lat, origin.lon, destination.lat, destination.lon);
		this.tickToDestination = this.travelDistance / this.speed; // Number of updates required to reach destination
		this.ticksTraveled = 0;
		
		this.update = function(){
			this.ticksTraveled++;
			//TODO
			//drawcode and stuff
			
			if (this.ticksTraveled == this.tickToDestination) {
			   if (this.armed){
				this.destination.hitByMissile( this );}
				else { this.destination.receiveMissile;}
				this.isAlive = false;
			}	
		}		
	}
	var FACTORY_WEIGHT = 1.2;
	var RESEARCH_WEIGHT = 0.33;
	var HOUSE_WEIGHT = 0.77;	
	Player = function(teamc){
		this.team = teamc;
		this.teamName = (GameConstants.CAPITALIST == teamc) ? "Capitalist" : "Communist";
		
		this.gameId;//Scope works in mysterious ways, use to crossreference
		this.ownedCities = 0;
		this.gameTick = 0;
		this.militaryProductionP= 0.33;
		this.capitalProductionP = 0.33;
		this.consumerProductP = 0.33;
		this.researchBudget = 0.01;
		this.reserveBudget = 0.0;
		
		this.population = 0; // thousands
		this.popularity = 20;
		this.popularityStability = 10;
		
		this.cashReserve = 0; //Tis a Billion
		this.GPD;
		this.currentTaxRate = .33;
		
		this.militaryDevelopmentIndex = 0; //Progress to the hydrogen bomb
		this.economicDevelopmentIndex = 0; //Overall index of Factories / Research Facilities / Houses
		this.scienceProgressIndex = 0; //Progress on pure science, take me to the moon
		
		this.troopProduction = .5;
		this.transportProduction = .5;		
		
		//Aggregate sums
			//military
		this.troops = 0;
		this.transports = 0;
		this.conventional_missiles = 0;
		this.nuclear_missiles = 0;
		this.hydrogen_missiles = 0;
			//Economic
		this.factories = 0;
		this.houses = 0; //Not just houses. Stands for consumer production.
		this.researchFacilities = 5;
		this.population = 0;
		
		//this.CityProcessing(game.cities);
		//Player Passive Game Loop
		
		this.update = function (game){
			this.gameTick++;
				this.toString();//Development branch hook; delete on serverside
				this.CityProcessing(game.cities);
				//Calculate development indexes, as a way of generating a useable median income
				this.economicDevelopmentIndex = Math.floor( (this.factories * FACTORY_WEIGHT) 
				+ (this.researchFacilities * RESEARCH_WEIGHT)
				+ (this.houses * HOUSE_WEIGHT) );
				//calculate cash income		
				var grossIncome = this.population * this.economicDevelopmentIndex * this.currentTaxRate;
				
				var GDP;
				try {
					if (this.militaryProductionP + this.capitalProductionP + this.consumerProductionP + this.researchBudget + this.reserveBudget) {throw "Income alloted is greater than 100%"; }
				var militaryMoney = grossIncome * this.militaryProductionP;
				var capitalMoney = grossIncome * this.capitalProductionP;
				var consumerMoney = grossIncome * this.consumerProductP;
				var researchMoney = grossIncome * this.researchBudget;
				var reserveMoney = grossIncome * this.reserveBudget;
				} catch(err) {console.log(err);}
				this.militaryProduction(militaryMoney, game.cities);
				this.capitalProduction(capitalMoney, game.cities);
				this.consumerProduction(consumerMoney, game.cities);
				this.researchProgress(researchMoney, game.cities);
				this.reserveCurrency(reserveMoney, game.cities);
				//Population growth
				
		
		}
		
		this.militaryProduction = function(money, c){
			var new_troops = (this.troopProduction * money) / GameConstants.TROOP_COST; 
			var new_transports = (this.transportProduction * money) / GameConstants.TRANSPORT_COST;
			var troop_growth = Math.floor(new_troops / this.ownedCities);
			var transport_growth = Math.floor(new_transports / this.ownedCities);
			for (var i = 0; i < c.length; i++) {
						if (this.team == c.team) {
					c[i].troops += troop_growth;
					c[i].transports += transport_growth;
					}
				}
		}
		
		this.capitalProduction = function(money, c){
			//log(x^4/3)
			var new_factories = log10( Math.pow(money, 4/3) );
			new_factories -= new_factories%Math.floor(new_factories);
			for (var i = 0; i < c.length; i++) {
						if (this.team == c[i].team) {
							if (c[i].manufacturingCity) { c[i].factories += new_factories;
								break;}
						}
			}
		};
		
		this.consumerProduction = function(money, c){
			var new_money = (money) * ( 1 - this.consumerProductP / 2);
			var new_houses = log10( Math.pow(new_money, 4/3) );
			for (var i = 0; i < c.length; i++) {
				if (this.team == c[i].team) {
					c[i].houses += new_houses;
					}
			}//end for	
		}
		
		this.researchProgress = function (money) {
		     var r_m = (money) * ( 1 - this.consumerProductP / 2);
			 r_m = r_m / 10000;
			 this.scienceProgressIndex += Math.floor(r_m);
		}
		
		this.reserveCurrency = function(money){
			this.cashReserve += Math.floor(money);
		}		
		
		this.buyMissile = function( type, cityName){
			var missile_cost = 0;
				switch (type) { //rework this with constants, what are you a noob
					case "conventional": 
							missile_cost = GameConstants.CONVENTIONAL_MISSILE_COST
						break;
					case "nuclear":
						missile_cost = GameConstants.NUCLEAR_MISSILE_COST;
						break;
					case "hydrogen":
						missile_cost = GameConstants.HYDROGEN_MISSILE_COST;
						break;
					default: console.log("error invalid type on missile creation");
						break;
				}
			
			if (this.cashReserve < missile_cost){
				console.log("Not enough cash.");
				return;
			}//we can afford it
			
			if (type == "hydrogen"){
				if (this.militaryDevelopmentIndex < 100) {
					console.log("Error, hydrogen bomb has not been researched by this nation.");
					return;
				}
			}//we have the technology
			
			for (var i = 0; i < game.cities.length; i++) {
				if (this.team == game.cities[i].team) {
					if (game.cities[i].name == cityName) { 
							game.cities[i].conventional_missiles++; //TODO
							console.log("A bomb has been bought for " + game.cities[i].name);
							break;}
						}
			}
		};//Missile bought by player
				
		//Calculate aggregate
		this.CityProcessing = function( city_arr ) {
			var agg_troops=0; //aggregates / sums
			var agg_transports=0;
			var agg_c_missile=0;
			var agg_n_missile=0;
			var agg_h_missile=0;
			var agg_factories=0;
			var agg_houses=0;
			var agg_researchFacilities=0;
			var agg_population=0;
			this.ownedCities = 0;
				for (var i = 0; i < city_arr.length; i++) {
						if (this.team == city_arr[i].team) {
					this.ownedCities++;
					agg_troops +=city_arr[i].troops;
					agg_transports+=city_arr[i].transports;
					agg_c_missile +=city_arr[i].conventional_missiles;
					agg_n_missile +=city_arr[i].nuclear_missiles;
					agg_h_missile +=city_arr[i].hydrogen_missiles;
					agg_factories +=city_arr[i].factories;
					agg_houses +=city_arr[i].houses;
					agg_researchFacilities +=city_arr[i].researchFacilities;
					agg_population +=city_arr[i].population; } //this do for cities in my team
									}
			this.transports = agg_transports;
			this.troops = agg_troops;
			this.conventional_missiles = agg_c_missile;
			this.nuclear_missiles = agg_n_missile;
			this.hydrogen_missiles = agg_h_missile;
			this.factories = agg_factories;
			this.researchFacilities = agg_researchFacilities;
			this.houses = agg_houses;
			this.population = agg_population;
			};
		this.setManufacturingCity = function ( name, city_arr ) {
		for (var i = 0; i < city_arr.length; i++) {
						if (this.team == city_arr[i].team) {
			            if (city_arr[i].name === name) {
						 city_arr[i].manufacturingCity = true;
						 console.log("City logged successfully"  + city_arr[i].name); 
						 }	else { city_arr[i].manufacturingCity = false;}
      			} //end if
			}//end for
		}
		
	}

	City = function(name, team, coord_arr, trps, trans, c_m, fact, rsF, haus, pop  ){
		this.manufacturingCity = false;
		this.isDead = false;
		this.name = name;
		this.team = team;
		this.teamName = (GameConstants.CAPITALIST == team) ? "Capitalist" : "Communist";
		this.coord = coord_arr;
		this.lat = this.coord[0];
		this.lon = this.coord[1];
		this.troops = 0;
		this.transports = trans;
		this.conventional_missiles = c_m;
		this.nuclear_missiles = 0;
		this.hydrogen_missiles = 0;
		this.factories = fact;
		this.researchFacilities = rsF;
		this.houses = haus;
		this.population = pop;
		this.hitTimer = 0;
		this.armed = false;
		
		this.receiveMissile = function(missile){
		
		switch (missile.type) { //rework this with constants, what are you a noob
			case "conventional": 
				this.conventional_missiles++;
				break;
			case "nuclear":
				this.nuclear_missiles++;
				break;
			case "hydrogen":
				this.hydrogen_missiles++;
				break;
			default: console.log("error invalid type on missile creation");
				break;
    		}
		
		}; //missile transported from a city
		
		this.hitByMissile = function(missile){
		console.log(this.name + " has been hit by a " + missile.type + " missile.");
		//TODO
		}
		
	}
	
	/*
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
		this.armed = false;
	}
	*/
	function prettyJSON(obj) {
    	return JSON.stringify(obj, null, 2);
	}
	
		//Test model
	var cityLatLong = [[13.75,100.466],[39.913889,116.391667],[-34.603333,-58.381667],[30.05,31.233333],[28.61,77.23],
					[23.7,90.375],[41.013611,28.955],[6.2,106.8],[24.86,67.01],[4.325,15.322222],
					[6.453056,3.395833],[-12.043333,-77.028333],[51.507222,0.1275],[14.583333,121],[19.433333,-99.133333],
					[55.75,37.616667],[40.6,-73.9],[-22.908333,-43.196389],[35.689444,139.691667], [23.133333, -82.383333]];
		//get the names of the cities from CSVs - this is bad..
	var cityNames = ["Bangkok, Thailand","Beijing, China", "Buenos Aires, Argentina", "Cairo, Egypt",
				"Delhi, India", "Dhaka, Bangladesh", "Instanbul, Turkey", "Jakarta, Indonesia", "Karachi, Pakistan",
				"Kinshasa, Republic of Congo", "Lagos, Nigeria", "Lima, Peru", "London, UK", "Manila, Philippines",
				"Mexico City, Mexico", "Moscow, Russia", "New York City, U.S.A","Rio de Janeiro, Brazil", "Tokyo, Japan", "Havana, Cuba"];
		
	var cityTeam = [GameConstants.CAPITALIST,GameConstants.COMMUNIST,GameConstants.CAPITALIST,GameConstants.COMMUNIST,GameConstants.CAPITALIST,GameConstants.COMMUNIST,GameConstants.CAPITALIST,GameConstants.COMMUNIST,GameConstants.CAPITALIST,GameConstants.COMMUNIST,
				GameConstants.CAPITALIST,GameConstants.COMMUNIST,GameConstants.CAPITALIST,GameConstants.COMMUNIST,GameConstants.CAPITALIST,GameConstants.COMMUNIST,GameConstants.CAPITALIST,GameConstants.COMMUNIST,GameConstants.COMMUNIST, GameConstants.COMMUNIST];
	var cityPopulations = [3000, 6000, 6766, 4910, 2845, 697, 2202, 3297, 2405, 786, 1242, 2223, 8900, 2829, 7028, 6622, 7900,
							5891, 13457, 2142 ];
