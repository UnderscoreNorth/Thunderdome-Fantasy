class Char {
	constructor(name,img,x,y){
		this.name = name;
		this.img = img;
		this.x = x;
		this.y = y;
		this.id = chars.length;
		this.health = 100;
		this.energy = 100;
		this.stamina = 100;
		this.kills = 0;
		this.killExp = 10;
		this.currentAction = {};
		this.awareOf = [];
		this.finishedAction = true;
	}
	draw() {
		let charDiv = $('#char_' + this.id);
		if(!charDiv.length){
			$('#map').append("<div id='char_" + this.id + "' class='char'>" + this.name + " </div>");
			charDiv = $('#char_' + this.id);
			charDiv.css('background-image',"url(" + this.img + ")");
			
			$('#table').append("<div class='container alive' id='tbl_" + this.id + "'><img src='" + this.img + "'></img><table><tr><tr><th colspan=6>" + this.name + "</th></tr></table></div>");
			let tbl = $("#table #tbl_" + this.id + " table");
			tbl.append("<tr><td colspan=6 class='tbl_status'></tr><tr>");
			tbl.append("<td>H</td><td class='tbl_health'>" + this.health + "</td>");
			tbl.append("<td>E</td><td class='tbl_energy'>" + this.energy + "</td>");
			tbl.append("<td>K</td><td class='tbl_kills'>" + this.kills + "</td>");
			tbl.append("</tr>");
			this.div = charDiv;
		} 
		charDiv.css('left',this.x / 1000 * .95 * $('#map').width() - iconSize/2);
		charDiv.css('top',this.y / 1000 * .95 * $('#map').height() - iconSize/2);
	}
	planAction(){
		let tempThis = this;
		//Opponents in sight
		this.awareOf = [];
		chars.forEach(function(chara,index){
			if(chara.name != tempThis.name){
				let dist = Math.sqrt(Math.pow(chara.x - tempThis.x,2)+Math.pow(chara.y - tempThis.y,2));
				if(dist <= sightRange){
					//Units within 200 units have a % of chance of being seen, up to 100% at 25
					if(Math.pow(Math.random(),1/3) * (sightRange - fightRange) > dist - fightRange)
						tempThis.awareOf.push(chara);
				}
			}
		});
		if(!this.plannedAction){
			//Opponents in fighting range
			if(this.energy > 20){
				chars.forEach(function(chara,index){
					if(chara.name != tempThis.name){
						let dist = Math.sqrt(Math.pow(chara.x - tempThis.x,2)+Math.pow(chara.y - tempThis.y,2));
						if(!tempThis.plannedTarget){
							console.log("no target");
							if(dist <= fightRange){
								console.log("target in range");
								if(tempThis.awareOf.indexOf(chara)>=0){
									console.log("target seen");
									if(Math.random() * 100 > 50){
										console.log("fight decided");
										tempThis.plannedAction = "fight";
										tempThis.plannedTarget = chara;
										chara.plannedAction = "fight";
									}
								}
							}
						}
					}
				});
			}
			if(!this.plannedAction){
				if(this.energy < Math.random()*25 + 25){
					this.plannedAction = "forage";
				} else if(this.currentAction.name){
					this.plannedAction = this.currentAction.name;
				} else {
					this.currentAction = {};
					if(this.energy < Math.random()*25 + 25){
						this.plannedAction = "forage";
					} else {
						this.plannedAction = "move";
					}
				}
			}
		}
		console.log(this);
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
		this.div.addClass("fighting");
		if(this.plannedTarget){
			this.lastAction = "fighting";
			let plannedTarget = this.plannedTarget;
			plannedTarget.health -= Math.floor(Math.random() * 30)+this.kills*this.killExp;
			plannedTarget.lastAttacker = this;
			if(plannedTarget.health > 0){
				this.lastAction = "fights " + plannedTarget.name;
				if(plannedTarget.awareOf.indexOf(this)>=0){
					this.health -= Math.floor(Math.random() * 30)+plannedTarget.kills*plannedTarget.killExp;
					if(this.health <= 0){
						plannedTarget.lastAction = "kills " + this.name;
						plannedTarget.kills++;
						this.death = "killed by " + plannedTarget.name;
					} else {
						plannedTarget.lastAction = "fights " + this.name;
					}
				} else {
					plannedTarget.lastAction = "is caught offguard";
				}
			} else {
				this.lastAction = "kills " + plannedTarget.name;
				this.kills++;
				plannedTarget.death = "killed by " + this.name;
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
			let roll = Math.random()*100;
			if(roll < 90){
				this.energy += Math.floor(Math.random() * 30+30);
				this.lastAction = "forage success";
			} else if(roll < 99) {
				this.lastAction = "forage fail";
			} else {
				this.health = 0;
				this.death = "death from poisoned berries";
			}
			this.currentAction = {};
		}
	}
	move(){
		if(this.currentAction.name != "move"){
			this.currentAction = {};
			let newX = 0;
			let newY = 0;
			if(Math.random() > chars.length/100 && this.awareOf.length){
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
		charDiv.animate({left:targetX,top:targetY},1000,function(){
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
		if(this.energy < 25)
			console.log(this.name + " low on energy");
	}
	die(){
		chars = arrayRemove(chars,this);
		$("#tbl_" + this.id).addClass("dead");
		$("#tbl_" + this.id).removeClass("alive");
		$("#char_" + this.id).addClass("dead");
		$("#tbl_" + this.id + " .tbl_health").text(0);
		$("#tbl_" + this.id + " .tbl_status").text(this.death);
		$('#table .container.alive').last().after($("#tbl_" + this.id));
	}
}