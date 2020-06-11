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
					fightChance -= 40;
				} else if (tP.personality != 'Neutral' && oP.personality != 'Neutral'){
					fightChance += 50;
					peaceChance -= 25;
				}
				if(tP.moral == 'Lawful')
					peaceChance += 100;
				if(tP.moral == 'Chaotic')
					fightChance += 100;
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