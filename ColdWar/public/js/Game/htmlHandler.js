var infoChoice = 1;

function updateStatus( s ){
	status = s;
	$('#status').text(s);
}
		
function clearAll(){
	$('#status').css("width","200px");
	$('#lobby').fadeOut(1000, function(){
		$('#gamer').fadeOut(1000, function(){
			document.getElementById("gamer").onclick = STARTGAME;
			$("#gamer").text("READY?");
			$("#gamer").css("display","block");
			$("#gamer").css("marginTop","1");
			$("#gamer").css("marginLeft","85%");
		});
	});
}
		
function GAMENOTFOUND(){
	console.log("gamer");
	document.getElementById("gamer").onclick = function(){};
	document.getElementById("gamer").innerHTML = "<div id='ConnectorPrompt'>Game ID<input type='number' id='game_id'></input></br><input type='radio' name='team' value='1'>Capitalist</input></br><input type='radio' name='team' value='2'>Communist</input></br><button id='attempt_connect' onclick='connect();'>Attempt Connection </button></div><div id='game_window'><div id='status'> Not connected </div><div id='Player_info'></div>";
}
		
function STARTGAME(){
	document.getElementById("gamer").onclick = function(){};
	$("#video").remove();
	init();
	socket.emit('player_ready');
	$("#gamer").text("REQUEST SENT");
	$("#gamer").fadeOut(1000);
	$("#gameMenu").animate({
		bottom: 0
	},1000);
}

function putOnTable(e){
	if(e!="")$("#teamTable").html(e);
}

function change(){
	period++;
	if(period>=3)period = 0;
	var myLoad = "Loading textures and game elements...";
	for(var i = 0;i<=period;i++)myLoad+=".";
	document.getElementById("loadingDiv").innerHTML = myLoad;
}

function changeLoadingDiv(){
	$("#loadingDiv").css("width","10px");
	$("#loadingDiv").css("top","100px");
	$("#loadingDiv").css("marginLeft","-55%");
	$("#loadingDiv").html("");
	$("#loadingDiv").animate({
		width: "150px",
		paddingLeft: "100px",
		height: "15px"
	}, 1000).promise().done(function(){
		$("#loadingDiv").html("REQUEST A GAME!");
	});
	clearInterval(loader);
	doneLoading = true;
}
	
function start(){
	if(doneLoading){
		lobby();
	}
}
	
function lobby(){
	$("#loadingDiv").fadeOut(1000);
	$("#lobby").animate({
		marginTop: "10"
	},1000);
	$("#gamer").animate({
		marginTop: "150"
	},1000)
	
	$("#teamTable").animate({
		marginTop: "50"
	},1000).promise().done(function(){
		setUpTeamResponse();
	});
}

function populateInfo(choice){
	var info = "";
	thisPlayer = game.players[0];
	switch(choice){
		case 1: 
			info = 
				"Game Id: "+thisPlayer.gameId+"<br>"+
				"<br>Team: "+thisPlayer.teamName+"<br>"+
				"Number of cities owned: "+thisPlayer.ownedCities+"<br>"+
				"Population: "+thisPlayer.population+" thousand<br>"+
				"Troops: "+thisPlayer.troops+" thousand<br>"+
				"Taxes: "+thisPlayer.currentTaxRate*100+"%<br>"+
				"<br>Production Rates:<br>"+
					"Capital: "+thisPlayer.capitalProductionP*100+"%<br>"+
					"Consumer: "+thisPlayer.consumerProductP*100+"%<br>"+
					"Military: "+thisPlayer.militaryProductionP*100+"%<br>"+
				"<br>Buildings:<br>"+
					"Factories: "+thisPlayer.factories+"<br>"+
					"Houses: "+thisPlayer.factories+"<br>"+
				"<br>Popularity:<br>"+
					"Overall Popularity: "+thisPlayer.popularity+"%<br>"+
					"Popularity Stability: "+thisPlayer.popularityStability+"<br>"+
				"<br>Research:<br>"+
					"Budget: "+thisPlayer.researchBudget+" thousand<br>"+
					"Facilities: "+thisPlayer.researchFacilities+"<br>"+
					"Science Progress Index: "+thisPlayer.scienceProgressIndex+"%";		
			break;
		case 2: 
			info = "Number of Cities: "+game.players[0].ownedCities+"<br><br>Cities:<br>";
			var most = 0;
			var mostName;
				for(var i = 0;i<game.cities.length;i++){
					if(game.cities[i].teamName==thisPlayer.teamName){
						info+= game.cities[i].name+"<br>";
						if(most<=game.cities[i].nuclear_missiles){
							most = game.cities[i].nuclear_missiles;
							mostName = game.cities[i].name;
						}
					}
				}mostName = mostName.split(",");
				info+= "<br>Best Overall City: "+"<br>";
				if(most!=0)info+="Most Nukes: "+mostName[0]+"<br>";
				info+="Most Productive: "+"<br>"+
					  "Best Military Might: "+"<br>";
			break;
		case 3: 
			info = "Economic Dev. Index: "+thisPlayer.economicDevelopmentIndex+"<br><br>";
			info += "Where will manufacturing be expanded?<br>";
				for(var i = 0;i<document.getElementsByName("economy_radio").length;i++){
				if(document.getElementsByName("economy_radio")[i].checked==true){
					manuCityName = document.getElementsByName("economy_radio")[i].value;
					console.log(manuCityName + " / " +i);
					}
				}	
				
				
				for(var i = 0;i<game.cities.length;i++){
				if(game.cities[i].teamName==thisPlayer.teamName){
					info+="<input type='radio' name='economy_radio' id='economyCity' ";
					if(game.cities[i].name==manuCityName){info+='checked';}
					info+=" value='"+game.cities[i].name+"'/> " + game.cities[i].name + " <br>";
					$("#infoSlider").html(info);
					}
				}
			break;
		case 4: 
			info = ""+thisPlayer.troops;
			break;
		case 5: 
			info = ""+game.players[0].ownedCities;
			break;
	}$("#infoSlider").html(info);
}

	
function slideInfo(){
	$("#infoSlider").animate({
		right: "0"
	});
}

function exitInfo(){
	$("#infoSlider").animate({
		right: "-265px"
	},1000);
}

function slide(choice){
	switch(choice){
		case 1: case 2: case 3: case 4: case 5: infoChoice = choice; populateInfo(infoChoice);break;
		case 6: exitInfo();break;
	}
}

function callArrows(x){
	if(x<-.4){
		$(".arrow-left").css("display","block");
	}else if(x>.4){
		$(".arrow-right").css("display","block");
	}else{
		$(".arrow-left").css("display","none");
		$(".arrow-right").css("display","none");
	}
}