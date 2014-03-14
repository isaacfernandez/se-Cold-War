	var FACTORY_WEIGHT = 1;
	var RESEARCH_WEIGHT = .33;
	var HOUSE_WEIGHT = .77;
	
	Player = function(team){
		this.team = team;
		this.teamName = (GameConstants.CAPITALIST == team) ? "Capitalist" : "Communist";
		
		this.militaryProductionP= .33;
		this.capitalProductionP = .33;
		this.consumerProductP = .33;
		this.researchBudget = .01;
		
		this.population = 300000; // thousands
		this.popularity = 20;
		this.popularityStability = 10;
		
		this.cashReserve = 10000000000; //Tis a Billion
		//this.GPD;
		this.currentTaxRate = .33;
		
		this.militaryDevelopmentIndex = 0; //Progress to the hydrogen bomb
		this.economicDevelopmentIndex = 0; //Overall index of Factories / Research Facilities / Houses
		this.scienceProgressIndex = 0; //Progress on pure science, take me to the moon
		
		
		//Aggregate sums
			//military
		this.troops = 100;
		this.transports = 10;
		this.conventional_missiles = 0;
		this.nuclear_missiles = 0;
		this.hydrogen_missiles = 0;
			//Economic
		this.factories = 25;
		this.houses = 25; //Not just houses. Stands for consumer production.
		this.researchFacilities = 5;
		this.population = 1000;
		
		//Player Passive Game Loop
		
		this.update = function (){
			this.CityProcessing(game.cities);
				//Calculate development indexes, as a way of generating a useable median income
				this.economicDevelopmentIndex = (this.factories * FACTORY_WEIGHT) 
				+ (this.researchFacilities * RESEARCH_WEIGHT)
				+ (this.houses * HOUSE_WEIGHT);
				console.log(this.teamName + "has an economic index of " + this.economicDevelopmentIndex);
				//calculate cash income
					
		}
		
		
		
		//Calculate aggregate
		this.CityProcessing = function ( city_arr ) {
			var agg_troops=0; //aggregates / sums
			var agg_transports=0;
			var agg_c_missile=0;
			var agg_n_missile=0;
			var agg_h_missile=0;
			var agg_factories=0;
			var agg_houses=0;
			var agg_researchFacilities=0;
			var agg_population=0;	
				for (var i = 0; i < city_arr.length; i++) {
						if (this.team == city_arr[i].team) {
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
	}