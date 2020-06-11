class Char {
	constructor(name,img,x,y){
		this.name = name;
		this.img = img;
		this.x = x;
		this.y = y;
		this.id = players.length;
		this.health = 100;
		this.energy = 100;
		this.stamina = 100;
		this.kills = 0;
		this.killExp = 1.05;
		this.sightRange = 200;
		this.sightRangeB = 0;
		this.fightRange = 24;
		this.fightRangeB = 0;
		this.fightDmg = 20;
		this.fightDmgB = 1.00;
		this.currentAction = {};
		this.awareOf = [];
		this.finishedAction = true;
		this.goal = "";
		//Modifiers
		this.fightDesire = 100;
		this.peaceDesire = 100;
		this.moral = roll([['Chaotic',1],['Neutral',1],['Lawful',1]]);
		this.personality = roll([['Evil',1],['Neutral',1],['Good',1]]);
		this.traits = {};
		moralNum[this.moral]++;
		personalityNum[this.personality]++;
		
		//Inventory
		this.weapon = "";
	}
	draw() {
		let charDiv = $('#char_' + this.id);
		if(!charDiv.length){
			$('#map').append("<div id='char_" + this.id + "' class='char'><div class='charName'>" + this.name + "</div><div class='healthBar' style='margin-bottom:-10px'></div></div>");
			charDiv = $('#char_' + this.id);
			charDiv.css('background-image',"url(" + this.img + ")");
			
			$('#table').append("<div class='container alive' id='tbl_" + this.id + "'><img src='" + this.img + "'></img><div style='position:absolute;width:50px;height:50px;z-index:1;top:0;left:0'><div class='healthBar'></div><div class='energyBar'></div></div><table><tr><tr><th colspan=6>" + this.moral.substring(0,1) + this.personality.substring(0,1) + " " + this.name + "<span class='weapon'></span></th></tr></table></div>");
			let tbl = $("#table #tbl_" + this.id + " table");
			tbl.append("<tr><td colspan=6 class='tbl_status'></tr>");
			tbl.append("<tr><td>K</td><td class='tbl_kills'>" + this.kills + "</td></tr>");
			this.div = charDiv;
		} 
		//charDiv.css('left',this.x / 1000 * .95 * $('#map').width() - iconSize/2);
		//charDiv.css('top',this.y / 1000 * .95 * $('#map').height() - iconSize/2);
		charDiv.css({transform:"translate(" + (this.x / 1000 * .95 * $('#map').width() - iconSize/2) + "px," + (this.y / 1000 * .95 * $('#map').height() - iconSize/2) + "px)"},function(){
		});
	}
	calc(){
		this.sightRangeB = 0;
		this.fightRangeB = 0;
		this.fightDmgB = 1;
		if(this.weapon){
			this.sightRangeB += this.weapon.sightBonus;
			this.fightRangeB += this.weapon.rangeBonus;
			this.fightDmgB *= this.weapon.fightBonus;
		}
		if(this.kills)
			this.fightDmgB *= Math.pow(this.killExp,this.kills);
	}
	planAction(){
		//Lancer check
		if(this.weapon){
			if(this.weapon.name == "🔱"){
				if(roll([["die",1],["live",20000]]) == "die"){
					this.health = 0;
					this.death = "Died by their own spear";
					this.die();
					action();
					return;
				}
			}
		}
		//Opponents in sight
		this.awareOf = awareOfCheck(this);
		//Opponents in range
		this.inRangeOf = inRangeOfCheck(this);
		if(!this.goal){
			switch(this.moral){
				case 'Chaotic':
					this.goal = "kill";
					break;
				case 'Neutral':
					this.goal = "none";
					break;
				case 'Lawful':
					this.goal = "survive";
				default:
					break;
			}
		}
		if(!this.plannedAction){
			let options = [];
			if(this.energy < Math.random()*25 + 25){
				this.plannedAction = "forage";
			} else if(this.currentAction.name){
				this.plannedAction = this.currentAction.name;
			} else {
				this.currentAction = {};
				options.push(["move",100]);
				if(this.inRangeOf.length > 0)
					options.push(["fight",100]);
				this.plannedAction = roll(options);
				if(this.plannedAction == "fight"){
					this.plannedTarget = this.inRangeOf[0];
					this.inRangeOf[0].plannedAction = "fight";
				}
			}
		}
		//console.log(this);
		action();
	}
	doAction(){
		this.div.removeClass("fighting");
		if(this.health > 0){
			//console.log(this.name + " " + this.plannedAction);
			switch(this.plannedAction){
				case "forage":
					this.forage();
					break;
				case "move":
					this.move();
					break;
				case "fight":
					this.fight();
					break;
				default:
					//console.log(this.name + " has no planned action");
					break;
			}
		}
		updateTable();
		this.limitCheck();
		this.finishedAction = true;
	}
	fight(){
		this.calc();
		this.div.addClass("fighting");
		if(this.plannedTarget){
			this.lastAction = "fighting";
			let oP = this.plannedTarget;
			oP.calc();
			let dmg = Math.floor(Math.random() * this.fightDmg) * this.fightDmgB;
			oP.health -= dmg;
			if(this.weapon){
				this.weapon.uses--;
				if(this.weapon.uses == 0)
					this.weapon = "";
			}
			oP.lastAttacker = this;
			if(oP.health > 0){
				this.lastAction = "fights " + oP.name;
				let dist = hypD(oP.x - this.x,oP.y - this.y);
				if(oP.awareOf.indexOf(this)>=0){
					if(oP.fightRange + oP.fightRangeB >= dist){
						let dmg = Math.floor(Math.random() * oP.fightDmg) * oP.fightDmgB;
						this.health -= dmg;
						if(this.weapon){
							this.weapon.uses--;
							if(this.weapon.uses == 0)
								this.weapon = "";
						}
						if(this.health <= 0){
							oP.lastAction = "kills " + this.name;
							oP.kills++;
							this.death = "killed by " + oP.name;
						} else {
							oP.lastAction = "fights " + this.name;
						}
					} else {
						oP.lastAction = "is attacked out of range";
					}
				} else {
					oP.lastAction = "is caught offguard";
				}
			} else {
				this.kills++;
				if(this.personality == oP.personality && this.personality != 'Neutral'){
					this.lastAction = "betrays " + oP.name;
					oP.death = "betrayed by " + this.name;
				} else {
					this.lastAction = "kills " + oP.name;
					oP.death = "killed by " + this.name;
				}
			}
		}
		this.energy -= 20;
		if(this.energy < 0){
			//this.death = "exhausted to death from fighting";
			//this.die();
		}
		this.plannedTarget = "";
		this.currentAction = {};
	}
	forage(){
		if(this.currentAction.name != "forage"){
			this.currentAction = {};
			this.currentAction.name = "forage";
			this.currentAction.turnsLeft = 2;
		}
		this.currentAction.turnsLeft--;
		this.energy -= 5;
		this.stamina -= 2.5;
		this.lastAction = "foraging";
		if(this.currentAction.turnsLeft == 0){
			switch(roll([["success",900],["fail",100],["poisoned",1]])){
				case "success":
					this.energy += Math.floor(Math.random() * 30+30);
					this.health += Math.floor(Math.random() * 5);
					this.lastAction = "forage success";
					if(!this.weapon){
						switch(roll([["🔪",1],["🔫",1],["🔱",1],["Nothing",50]])){
							case "🔪":
								this.weapon = new Item("🔪");
								break;
							case "🔫":
								this.weapon = new Item("🔫");
								break;
							case "🔱":
								this.weapon = new Item("🔱");
								break;
							default:
								break;
						}
						if(this.weapon){
							this.lastAction = "found " + this.weapon.name;
							this.calc();
						}
					}
					break;
				case "fail":
					this.lastAction = "forage fail";
					break;
				case "poisoned":
					this.health = 0;
					this.death = "death from poisoned berries";
					break;
			}
			this.currentAction = {};
		}
	}
	move(){
		if(this.currentAction.name != "move"){
			this.currentAction = {};
			let newX = 0;
			let newY = 0;
			if(Math.random() > players.length/100 && this.awareOf.length){
				newX = this.awareOf[0].x;
				newY = this.awareOf[0].y;
				this.lastAction = "following " + this.awareOf[0].name;
				this.currentAction.name = "";
			} else {
				let tries = 0;
				do {
					newX = Math.floor(Math.random()*1000);
					newY = Math.floor(Math.random()*1000);
					tries++;
				} while(!boundsCheck(newX,newY) && tries < 10);
				this.lastAction = "moving";
				this.currentAction.name = "move";
			}
			this.currentAction.targetX = newX;
			this.currentAction.targetY = newY;
		}
		//Calculating distance from target
		let distX = this.currentAction.targetX - this.x;
		let distY = this.currentAction.targetY - this.y;
		let dist = Math.sqrt(Math.pow(distX,2) + Math.pow(distY,2));
		let targetX = 0;
		let targetY = 0;
		
		//If target is 50 away
		if(dist <= 50){
			targetX = this.currentAction.targetX;
			targetY = this.currentAction.targetY;
		} else {
			let shiftX = distX / (dist/50);
			let shiftY = distY / (dist/50);
			targetX = this.x + shiftX;
			targetY = this.y + shiftY;
		}
		this.x = targetX;
		this.y = targetY;
		targetX = targetX / 1000 * .95 * $('#map').width() - iconSize/2;
		targetY = targetY / 1000 * .95 * $('#map').height() - iconSize/2;
		
		let charDiv = $('#char_' + this.id);
		charDiv.css({transform:"translate(" + targetX + "px," + targetY + "px)"},function(){
		});
		if(this.currentAction.targetX == this.x && this.currentAction.targetY == this.y)
			this.currentAction = {};
		this.energy -= Math.floor(Math.random()*5+2);
		if(Math.random*1000 > 995){
			this.health = 0;
			this.death = "Fell off a cliff";
		}
	}
	limitCheck(){
		if(this.energy <= 0){
			//if(!this.death) this.death = "death from exhaustion";
			//this.die();
			this.energy = 0;
		}
		if(this.energy > this.maxEnergy)
			this.energy = this.maxEnergy;
		if(this.health <= 0){
			this.health = 0;
			this.die();
		}
		if(this.health > 100){
			this.health = 100;
		}
		//if(this.energy < 25)
			//console.log(this.name + " low on energy");
	}
	die(){
		players = arrayRemove(players,this);
		$("#tbl_" + this.id).addClass("dead");
		$("#tbl_" + this.id).removeClass("alive");
		$("#char_" + this.id).addClass("dead");
		$("#tbl_" + this.id + " .tbl_health").text(0);
		$("#tbl_" + this.id + " .tbl_status").text(this.death);
		$('#table .container.alive').last().after($("#tbl_" + this.id));
		moralNum[this.moral]--;
		personalityNum[this.personality]--;
	}
}