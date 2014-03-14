var socket;

var Timer;
var status;	

var game;
var GameStarted = false;



GameConstants = {};
GameConstants.CAPITALIST = 1;
GameConstants.COMMUNIST = 2;
GameConstants.NEUTRAL = 3;
GameConstants.TROOP_COST = 1500;
GameConstants.TRANSPORT_COST = 15000;
GameConstants.CONVENTIONAL_MISSILE_COST = 500000;
GameConstants.NUCLEAR_MISSILE_COST = 500000;
GameConstants.HYDROGEN_MISSILE_COST = 500000;

GameConstants.NEW_PLAYER = 200;
GameConstants.GAME_FULL = 400;
GameConstants.TEAM_FULL = 401;
GameConstants.GAME_NOT_FOUND = 404;
	
var player;

window.onload = function(){
	//check if this user was already playing a game
	console.log("Loaded");
}
	
var Timer =setInterval(function(){
	if (GameStarted){
		update(); }
}, 25);
		
		
function update(){
	//Set up a long timer to keep production possibilities curve decisions updated
}
	
function connectToGame(gID, t){
	console.log(gID + " " + t);
	console.log(socket);
	socket = io.connect('http://localhost:3000');
	console.log('socket is listening');
	socket.on('game_message', function(data){
	if (data.game_id == gID) {	alert(data.message); }
});
		
socket.on('system_message', function  (data) {
status = data.message + " ... attempting to join team";
updateStatus(status);
console.log(data);
console.log(gID + "is the id requested");
socket.emit('request_team_join', {game_id: gID, team: t});
socket.on('team_join_reply', function(data){
	console.log("Server has replied " + data.message);
	status = data.message + " ... attempting to join team";
	updateStatus(status);			
	socket.on('team_join_complete', function(data) {
	switch (data.join_status) {
		case GameConstants.NEW_PLAYER:
			console.log("game join");
			updateStatus('Game has been joined. Asking for game info.');
			socket.emit('load_request', {});
			clearAll();
			break;
		case GameConstants.GAME_FULL:
			updateStatus('Error: Game is full');
			break;
		case GameConstants.TEAM_FULL:
			updateStatus('Error: Team is full');
			break;
		case GameConstants.GAME_NOT_FOUND:
			updateStatus('Error: Game not found');
			socket.disconnect();
			socket = null;
			document.getElementById("gamer").onclick = GAMENOTFOUND;
			break;
		default: console.log("You managed to hit default on switch 46. " + data.join_status);
			break;
	}
});
});
					
socket.on('game_start', function(data){
	game = data.game_state;
	updateStatus('Game data has been received. Setting up game...');
	for (var i = 0; i < game.players.length; i++){
		if (game.players[i].team == t){ 
			player = game.players[i];
		}
	}//Fire off whatever function sets up the display. Game is global, access from there.
});
				
socket.on('game_update', function (data){
	game.cities = data.cities;
	game.players = data.players;
	populateInfo(infoChoice);
	clientToServerChanges(); //begin this fun little loop
});
					
socket.on('admin_message', function(data){
	console.log(data); 	});
			});
		}
		
//!!!!!
var manuCityName = "Idaho";
var mP = .32;
var capP = .33;
var conP = .33;
var	resB = 0;
var rsvB = 0;

	
var uplink;
function clientToServerChanges(){
	uplink = setInterval( function(){   
		console.log(manuCityName);
		socket.emit('player_update', 
	{  manufacturingCity: manuCityName,
	   military_production: mP, 
	   capital_production: capP,
	   research_budget: resB,
	   reserve_budget: rsvB  } );
   }, 500);
}
	
		
function connect(){
	$("#ConnectorPrompt").hide();
	var gameRequested = parseInt($("#game_id").val());
	var team =  $('input[name=team]:checked').val();
	
	if ( ! isNumber(gameRequested) || (gameRequested < 0 ) ) { 
		console.log("invalid id");
		$("#ConnectorPrompt").show();
	}
		
	if (!team) {
		console.log("no team selected.");
		$("#ConnectorPrompt").show();
	}
	updateStatus("Connecting");
	connectToGame(gameRequested, team);		
}
		
function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function setUpTeamResponse(){
	var request = new XMLHttpRequest()
	request.onload = function(e) { putOnTable(this.responseText); }
	request.open("GET", "/getGames", true);
	request.send()
}
	
