function awareOfCheck(tP){
	let tempArr = [];
	players.forEach(function(oP,index){
		if(oP.name != tP.name){
			let dist = hypD(oP.x - tP.x,oP.y - tP.y);
			if(dist <= tP.sightRange){
				//Units have a % of chance of being seen, increasing exponential up to their fight range
				if(Math.pow(Math.random(),1/3) * (tP.sightRange - tP.fightRange) > dist - tP.fightRange)
					tempArr.push(oP);
			}
		}
	});
	return tempArr;
}
function inRangeOfCheck(tP){
	let tempArr = [];
	players.forEach(function(oP,index){
		if(oP.name != tP.name){
			let dist = hypD(oP.x - tP.x,oP.y - tP.y);
			if(dist <= (tP.fightRange + tP.fightRangeB) && tP.awareOf.indexOf(oP)>=0){
				let fightChance = 50;
				let peaceChance = 50;
				if(tP.personality == oP.personality){
					peaceChance += 40;
					fightChance -= 20;
				} else if (tP.personality != 'Neutral' && oP.personality != 'Neutral'){
					fightChance += 40;
					peaceChance -= 20;
				}
				if(tP.moral == 'Lawful')
					peaceChance += 75;
				if(tP.moral == 'Chaotic')
					fightChance += 100;
				if(tP.weapon.name == "🗡️" || oP.weapon.name == "🗡️"){
					peaceChance = 0;
					fightChance = 1;
				}
				//console.log("Fight check");
				//console.log(tP);
				//console.log(oP);
				let rollResult = roll([['fight',fightChance],['peace',peaceChance]]);
				//console.log(fightChance + " " + peaceChance + " " + rollResult);
				if(rollResult == 'fight')
					tempArr.push(oP);
			}
		}
	});
	return tempArr;
}
function bombCheck(tP){
	doodads.forEach(function(tD,index){
		let dist = hypD(tP.x - tD.x, tP.y - tD.y);
		if(dist <= tD.triggerRange){
			let blowUpChance = 1;
			let blowUpNoChance = 3;
			if(tD.owner == tP)
				blowUpNoChance += 20;
			if(roll([["yes",blowUpChance],["no",blowUpNoChance]]) == 'yes')
				tD.blowUp();
		}
	});
}
function damage(tP,oP){
	let dmg = 0;
	switch(tP.constructor.name){
		case "Char":
		dmg = Math.floor(Math.random() * tP.fightDmg) * tP.fightDmgB;
		oP.health -= dmg;
		if(tP.weapon.name == "🗡️")
			tP.health += dmg;
		if(tP.weapon){
			tP.weapon.uses--;
			if(tP.weapon.uses == 0)
				tP.weapon = "";
		}
		oP.lastAttacker = tP;
		if(oP.health > 0){
			tP.lastAction = "fights " + oP.name;
			let dist = hypD(oP.x - tP.x,oP.y - tP.y);
			if(oP.awareOf.indexOf(tP)>=0){
				if(oP.fightRange + oP.fightRangeB >= dist){
					let dmg = Math.floor(Math.random() * oP.fightDmg) * oP.fightDmgB;
					tP.health -= dmg;
					if(oP.weapon.name == "🗡️")
						oP.health += dmg;
					if(tP.weapon){
						tP.weapon.uses--;
						if(tP.weapon.uses == 0)
							tP.weapon = "";
					}
					if(tP.health <= 0){
						oP.lastAction = "kills " + tP.name;
						oP.kills++;
						tP.death = "killed by " + oP.name;
						if(tP.weapon.name == "🗡" && Math.random() > 0.5){
							oP.weapon = tP.weapon;
							tP.weapon = "";
						}
					} else {
						oP.lastAction = "fights " + tP.name;
					}
				} else {
					oP.lastAction = "is attacked out of range";
					console.log(oP.fightRange + " " + oP.fightRangeB + " " + dist);
				}
			} else {
				if(oP.lastAction == "sleeping"){
					oP.lastAction = "was attacked in their sleep";
				} else {
					oP.lastAction = "is caught offguard";
				}
			}
		} else {
			tP.kills++;
			if(oP.weapon.name == "🗡" && Math.random() > 0.5){
				tP.weapon = oP.weapon;
				oP.weapon = "";
			}
			if(tP.personality == oP.personality && tP.personality != 'Neutral'){
				tP.lastAction = "betrays " + oP.name;
				oP.death = "betrayed by " + tP.name;
			} else {
				tP.lastAction = "kills " + oP.name;
				if(oP.lastAction == "sleeping"){
					oP.death = "killed in their sleep by " + tP.name;
				} else {
					oP.death = "killed by " + tP.name;
				}
			}
		}
		break;
	case "Doodad":
		dmg = Math.floor(Math.random() * tP.dmg);
		oP.health -= dmg;
		if(oP.health <= 0){
			tP.owner.kills++;
			if(oP == tP.owner){
				oP.death = "blown up by their own bomb";
			} else {
				oP.death = "blown up by " + tP.owner.name;
			}
		}
		break;
	default:
		break;
	}
}