class Char {
	constructor(name,img,x,y){
		this.name = name;
		this.img = img;
		this.x = x;
		this.y = y;
		this.id = players.length;
		
		this.energy = 100;
		this.maxEnergy = 100;
		this.stamina = 100;
		this.kills = 0;
		this.killExp = 1.1;
		this.exp = 0;
		this.sightRange = 200;
		this.sightRangeB = 0;
		this.fightRange = 24;
		this.fightRangeB = 0;
		this.fightDmg = 25;
		this.fightDmgB = 1.00;
		this.visibility = 100;
		this.currentAction = {};
		this.awareOf = [];
		this.finishedAction = true;
		this.goal = "";
		this.moveSpeed = mapSize / 40;
		//Modifiers
		this.fightDesire = 100;
		this.peaceDesire = 100;
		this.moral = roll([['Chaotic',1],['Neutral',2],['Lawful',1]]);
		this.personality = rollSpecialP(this.name);
		this.personality = roll([['Evil',1],['Neutral',2],['Good',1]]);
		this.health = rollSpecialH(this.personality);
		//roll([['Evil',1],['Neutral',2],['Good',1]])
		this.traits = {};
		moralNum[this.moral]++;
		personalityNum[this.personality]++;
		
		this.alliance = {};
		this.opinions = [];
		this.recentlySeen = [];
		
		//Inventory
		this.weapon = "";
	}
	draw() {
		let charDiv = $('#char_' + this.id);
		if(!charDiv.length){
			$('#players').append("<div id='char_" + this.id + "' class='char'><div class='charName'>" + this.name + "<div class='charWeap'></div></div><div class='healthBar' style='margin-bottom:-10px'></div><div class='energyBar' style='margin-bottom:-10px'></div></div>");
			charDiv = $('#char_' + this.id);
			charDiv.css('background-image',"url(" + this.img + ")");
			$('#table').append("<div class='container alive' id='tbl_" + this.id + "'><img src='" + this.img + "'></img><div style='position:absolute;width:50px;height:50px;z-index:1;top:0;left:0'><div class='healthBar'></div><div class='energyBar'></div><div class='kills'></div></div><div class='info'><div>" + this.moral.substring(0,1) + this.personality.substring(0,1) + " <b>" + this.name + "</b><span class='weapon'></span></div><div class='status'></div></div></div>");
			this.div = charDiv;
		} 
		//charDiv.css('left',this.x / 1000 * .95 * $('#map').width() - iconSize/2);
		//charDiv.css('top',this.y / 1000 * .95 * $('#map').height() - iconSize/2);
		charDiv.css({transform:"translate(" + (this.x / mapSize * $('#map').width() - iconSize/2) + "px," + (this.y / mapSize *  $('#map').height() - iconSize/2) + "px)"},function(){
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
		this.fightDmgB *= Math.pow(this.killExp,this.exp/100);
		switch(terrainCheck(this.x,this.y)){
			case "⛰️":
				this.sightRangeB += 100;
				break;
			case "🌳":
				this.sightRangeB -= 50;
				this.fightRangeB -= 4;
				this.visibility
				break;
			case "💧":
				this.fightRangeB = 0;
				break;
			default:
				break;
		} 
	}
	planAction(){
		//Lancer check
		this.calc();
		if(this.weapon){
			if(this.weapon.name == "🔱"){
				if(roll([["die",1],["live",20000]]) == "die"){
					this.health = 0;
					this.death = "Died by their own spear";
					this.die();
					action();
					return;
				}
			} else if (this.weapon.name == "🗡"){
				this.health -= (this.weapon.fightBonus - 1.5 - this.kills/20);
				if(this.health <= 0){
					this.death = "Succumbed to SEX SWORD";
					this.die();
					action();
					return;
				}
			}
			if (this.weapon.name == "🗡"){
				this.div.addClass("sexSword");
			} else {
				this.div.removeClass("sexSword");
			}
		}
		if(this.lastAction == 'sleeping' || this.lastAction == 'trapped'){
			this.awareOf = [];
			this.inRangeOf = [];
		} else {
			//Opponents in sight
			this.awareOf = awareOfCheck(this);
			//Opponents in range
			this.inRangeOf = inRangeOfCheck(this);
		}
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
			if((this.energy < Math.random()*25 + 25 || (Math.pow(100 - this.health,2) > Math.random() * 2500+ 2500 && !this.awareOf.length)) && terrainCheck(this.x,this.y) != "💧"){
				this.plannedAction = "forage";
			} else if(this.currentAction.name){
				this.plannedAction = this.currentAction.name;
			} else {
				this.currentAction = {};
				let sexSwordNearby = false;
				let tP = this;
				this.inRangeOf.forEach(function(oP,index){
					if(oP.weapon.name == "🗡"){
						if (Math.random() > 0.3){
							sexSwordNearby = true;
							tP.plannedTarget = oP;
							tP.plannedAction = "fight";
							oP.plannedAction = "fight";
						}
					}
				});
				if(!sexSwordNearby){
					options.push(["move",100]);
					if(this.inRangeOf.length > 0)
						options.push(["fight",100]);
					if((hour >= 22 || hour < 5) && this.lastAction != "woke up" && terrainCheck(this.x,this.y) != "💧")
						options.push(["sleep",100]);
					this.plannedAction = roll(options);
					if(this.plannedAction == "fight"){
						this.plannedTarget = this.inRangeOf[0];
						this.inRangeOf[0].plannedAction = "fight";
					}
				}
			}
		}
		action();
	}
	doAction(){
		//timerClick(this.name + " " + this.plannedAction);
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
				case "sleep":
					this.sleep();
					break;
				case "trapped":
					this.escapeTrap();
					break;
				default:
					//console.log(this.name + " has no planned action");
					break;
			}
		}
		if(this.lastAction == 'sleeping'){
			this.div.find('.charName').addClass('sleep');
		} else {
			this.div.find('.charName').removeClass('sleep');
		}
		if(this.lastAction == 'tried to escape the trap'){
			this.div.find('.charName').addClass('trapped');
		} else {
			this.div.find('.charName').removeClass('trapped');
		}
		//timerClick("updateTable");
		
		//timerClick("updateTable");
		//timerClick("limitCheck");
		this.limitCheck();
		//timerClick("limitCheck");
		this.finishedAction = true;
		//timerClick(this.name + " " + this.plannedAction);
	}
	escapeTrap(){
		console.log("Escape");

		timerClick("escape");
		if (Math.floor(Math.random() * 10) > 8){
			this.lastAction = "escaped a trap";
			this.currentAction = {};
		} else {
			this.energy -= 10;
			this.health -= Math.floor(Math.random() * 5);
			this.lastAction = "tried escape a trap";
			if(this.health <= 0) 
				this.death = "died escaping a trap";
		};
		timerClick("escape");
	}
	fight(){
		this.calc();
		this.div.addClass("fighting");
		if(this.plannedTarget){
			this.lastAction = "fighting";
			let oP = this.plannedTarget;
			oP.calc();
			damage(this,oP);
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
						let weaponOdds = [["🔪",30],["🔫",20],["🔱",25],["💣",5],["🕳",10],["🏹",20],["Nothing",500]];
						if(sexSword){
							weaponOdds.push(["🗡",1]);
						}
						this.weapon = new Item(roll(weaponOdds));
						if(this.weapon.name == "Nothing")
							this.weapon = "";
						if(this.weapon.name == "🗡")
							sexSword = false;
						if(this.weapon){
							this.lastAction = "found " + this.weapon.name;
							if(this.weapon.name == "🗡"){
								this.plannedAction = "Find sex sword";
								this.lastAction = "<span style='color:red'>found SEX SWORD</span>";
							}
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
		//timerClick("move");
		if(this.currentAction.name != "move"){
			this.currentAction = {};
			let newX = 0;
			let newY = 0;
			let sexSwordNearby = false;
			let tP = this;
			this.awareOf.forEach(function(oP,index){
				if(oP.weapon.name == "🗡" && Math.random() > 0.1){
					sexSwordNearby = true;
					newX = oP.x;
					newY = oP.y;
					tP.lastAction = "following SEX SWORD";
					tP.currentAction.name = "";
				}
			});
			if(!sexSwordNearby){
				if(Math.random() > players.length/100 && this.awareOf.length){
					newX = this.awareOf[0].x;
					newY = this.awareOf[0].y;
					this.lastAction = "following " + this.awareOf[0].name;
					this.currentAction.name = "";
				} else {
					let tries = 0;
					do {
						newX = Math.floor(Math.random()*mapSize);
						newY = Math.floor(Math.random()*mapSize);
						tries++;
					} while(!boundsCheck(newX,newY) && tries < 10);
					this.lastAction = "moving";
					this.currentAction.name = "move";
				}
			}
			this.currentAction.targetX = newX;
			this.currentAction.targetY = newY;
		}
		if(this.weapon){
			if((this.weapon.name == "💣" || this.weapon.name == "🕳") && roll([['use',20],['notuse',100]]) == 'use'){
				let tempDoodad = new Doodad(this.weapon.name,this.x,this.y,this);
				tempDoodad.draw();
				doodads.push(tempDoodad);
				this.weapon = "";
			}
		}
		//Calculating distance from target
		let distX = this.currentAction.targetX - this.x;
		let distY = this.currentAction.targetY - this.y;
		let dist = Math.sqrt(Math.pow(distX,2) + Math.pow(distY,2));
		let targetX = 0;
		let targetY = 0;
		
		if(terrainCheck(this.x,this.y)=="💧"){
			this.moveSpeedB = 0.5;
		} else {
			this.moveSpeedB = 1;
		}
		if(dist <= this.moveSpeed * this.moveSpeedB){
			targetX = this.currentAction.targetX;
			targetY = this.currentAction.targetY;
		} else {
			let shiftX = distX / (dist/(this.moveSpeed * this.moveSpeedB));
			let shiftY = distY / (dist/(this.moveSpeed * this.moveSpeedB));
			targetX = this.x + shiftX;
			targetY = this.y + shiftY;
			//console.log(terrainCheck(targetX,targetY));
			if(terrainCheck(targetX,targetY) == "💧" && terrainCheck(this.x + shiftX * 2, this.y + shiftY * 2)  == "💧" && this.lastAction != "swimming"){
				let swimChance = roll([["yes",1],["no",50]]);
				if(swimChance == "no"){
					var redirectTimes = 0;
					var redirectDir = roll([[-1,1],[1,1]]);
					var initialDir = Math.acos(shiftY/(this.moveSpeed*this.moveSpeedB));
					var tries = 314;
					do {					
						redirectTimes++;
						let newDir = initialDir + redirectDir * redirectTimes * 0.05;
						shiftX = (this.moveSpeed * this.moveSpeedB) * Math.sin(newDir);
						shiftY = (this.moveSpeed * this.moveSpeedB) * Math.cos(newDir);
						targetX = this.x + shiftX;
						targetY = this.y + shiftY;
						tries--;
					} while (swimChance == "no" && terrainCheck(targetX,targetY) == "💧" && tries > 0 && boundsCheck(targetX,targetY));
				}
			}
		}
		this.x = targetX;
		this.y = targetY;
		targetX = targetX / mapSize * $('#map').width() - iconSize/2;
		targetY = targetY / mapSize * $('#map').height() - iconSize/2;
		
		let charDiv = $('#char_' + this.id);
		charDiv.css({transform:"translate(" + targetX + "px," + targetY + "px)"},function(){
			
		});
		doodadCheck(this);
		if(this.currentAction.targetX == this.x && this.currentAction.targetY == this.y)
			this.currentAction = {};
		this.energy -= Math.floor(Math.random()*5+2);
		if(terrainCheck(this.x,this.y)=="💧"){
			this.lastAction = "swimming";
		} else if(terrainCheck(this.x,this.y)!="💧" && this.lastAction == "swimming"){
			this.lastAction = "moving";
		}
		if(roll([["die",1],["live",2000]]) == "die" && terrainDeath > 0 ){
			switch(terrainCheck(this.x,this.y)){
				case "️⛰️":
					this.health = 0;
					this.death = "Fell off a cliff";
					terrainDeath--;
					break;
				case "💧":
					this.health = 0;
					this.death = "Drowned";
					terrainDeath--;
					break;
				default:
					break;
			}
		}
		//timerClick("move");
	}
	sleep(){
		if(this.currentAction.name != "sleep"){
			this.currentAction.name = "sleep";
			this.currentAction.turnsLeft = Math.floor(Math.random()*3)+5;
		}
		this.currentAction.turnsLeft--;
		this.health += Math.floor(Math.random() * 2);
		this.energy += Math.floor(Math.random() * 10);
		if(this.currentAction.turnsLeft > 0){
			this.lastAction = "sleeping";
		} else {
			this.currentAction = {};
			this.lastAction = "woke up";
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
		dedPlayers.push(this);
		$("#tbl_" + this.id).addClass("dead");
		$("#tbl_" + this.id).removeClass("alive");
		$("#char_" + this.id).addClass("dead");
		$("#tbl_" + this.id + " .status").text(/*"D" + day + " H" + hour + " " + */this.death);
		$('#table .container.alive').last().after($("#tbl_" + this.id));
		moralNum[this.moral]--;
		personalityNum[this.personality]--;
		if(this.weapon){
			if(this.weapon.name == "💣"){
				let tempBomb = new Doodad("💣",this.x,this.y,this);
				tempBomb.draw();
				doodads.push(tempBomb);
				tempBomb.trigger();
				this.weapon = "";
			}
		}
	}
}