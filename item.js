class Item {
	constructor(name){
		this.name = name;
		this.sightBonus = 0;
		this.rangeBonus = 0;
		this.fightBonus = 0;
		this.uses  = 0;
		switch(this.name){
			case "🔱":
				this.fightBonus = 1.5;
				this.uses = Math.floor(Math.random() * 4) + 5;
				break;
			case "🔫":
				this.rangeBonus = 20;
				this.fightBonus = 1.5;
				this.uses = 4;
				break;
			case "🔪":
				this.fightBonus = 1.4;
				this.uses = Math.floor(Math.random() * 4) + 5;
				break;
			case "💣":
				break;
		}
	}
}