var players = [];
var dedPlayers = [];
var terrain = [];
var doodads = [];
var riverSpawns = [];
var doodadsNum = 0;
var interval = 1500;
var mapSize = 1000;
var initDone = false;
var playing = false;
var day = 0;
var hour = 8;
var iconSize = 24;
var moralNum = {"Chaotic":0,"Neutral":0,"Lawful":0};
var personalityNum = {"Evil":0,"Neutral":0,"Good":0};
var terrainDeath = 3; //Max num who can fall off a cliff
var sexSword = true;
var dirArr = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];
var lastT = 0;
var timerClicks = {};
var messages = [];
var lastMessage = -1;

$( document ).ready(function(){
	Init();
	players.forEach(function(chara,index){
		chara.draw();
	});
});
function Init(){
	if($('body').width() > $('body').height()){
		$('#map').width($('#map').height());
		$('#map').height($('#map').width());
		$('#side').width("calc(100% - 40px - " + ($('#map').width() + 100) + "px)");
		$('#side').css({'max-height':'100%','overflow-y':'scroll'});
	} else {
		$('#map').width('calc(100% - 40px)');
		$('#map').height($('#map').width());
		$('#map').width($('#map').height());
		$('#side').width("100%");
		$('#side').css({'max-height':'calc(100% - 40px - ' + $('#map').height() + "px)",'overflow-y':'scroll'});
	}
	charlist.forEach(function(i,index){
		$('#cnt_players').append("<div class='cnt_player'><input class='name' value='" + i[0] + "'><input class='img' value='" + i[1] + "'></div>");
	});
	$('#cnt_players').append("<div class='cnt_player'><input class='name' value=''><input class='img' value=''></div>");
	initDone = true;
	$('#cnt_players').on('change','.name',function(){
		if($('#cnt_players .name').last().val()){
			$('#cnt_players').append("<div class='cnt_player'><input class='name' value=''><input class='img' value=''></div>");
	}
});
}
function resetPlayers(){
	$('#cnt_players').html("<div class='cnt_player'><input class='name' value=''><input class='img' value=''></div>");
}
function startGame(){
	charlist = [];
	$('#cnt_players .cnt_player').each(function(){
		if($(this).find('.name').val())
			charlist.push([$(this).find('.name').val(),$(this).find('.img').val()]);
	});
	$('#table').html('');
	for(var i = 0;i<charlist.length;i++){
		let x = 0;
		let y = 0;
		do {
			x = Math.floor(Math.random() * mapSize);
			y = Math.floor(Math.random() * mapSize);
		} while(!boundsCheck(x,y));
		let tempChar = "";
		if(charlist[i]){
			tempChar = new Char(charlist[i][0],charlist[i][1],x,y);
		} else {
			tempChar = new Char("char" + i,"",x,y);
		}
		tempChar.draw();
		players.push(tempChar);
	}
	setInterval(timer,interval);
}
function timer(){
	if(playing){
		turn();
	}
}
function auto(){
	playing = !playing;
}
function turn(){
	let numReady = 0;
	players.forEach(function(chara,index){
		if(chara.finishedAction)
			numReady++;
	});
	if(numReady == players.length){
		switch(hour){
			case 7:
			case 20:
				$('#map').css('background','rgb(0,90,0)');
				break;
			case 6:
			case 21:
				$('#map').css('background','rgb(0,50,0)');
				break;
			case 8:
				$('#map').css('background','rgb(0,128,0)');
				break;
			case 22:
				$('#map').css('background','rgb(0,20,0)');
				break;
		}
		players.sort(() => Math.random() - 0.5);
		players.forEach(chara => chara.plannedAction = "");
		players.forEach(chara => chara.finishedAction = false);
		players.forEach(function(chara,index){
			//timerClick("plan " + chara.name);
			chara.planAction();
			//timerClick("plan " + chara.name);
		});
	}
}
function action(){
	let numReady = 0;
	players.forEach(function(chara,index){
		if(chara.plannedAction)
			numReady++;
	});
	if(numReady == players.length){
		players.forEach(function(chara,index){
			//timerClick("do " + chara.name);
			chara.doAction();
			//timerClick("do " + chara.name);
		});
		hour++;
		if(hour == 24){
			hour = 0;
			day++;
		}
		$('#day').text("Day " + day + " Hour " + hour);
		updateTable();
	}
}
function MapResize(){
	
}
function infoDisplay(){
	if($('#table').css('display')=='block'){
		$('#table').css('display','none');
		$('#messages').css('display','block');
	} else {
		$('#table').css('display','block');
		$('#messages').css('display','none');
	}
	
}
function boundsCheck(x,y){
	let valid = true;
	let boundX = Math.abs(x-mapSize/2);
	let boundY = Math.abs(y-mapSize/2);
	let limit = Math.sqrt(Math.pow(mapSize/2,2) - Math.pow(boundX,2));
	if(boundY > limit){
		valid = false;
	}
	let roundX = Math.round(x/25)*25;
	let roundY = Math.round(y/25)*25;
	if(terrain[roundX]){
		if(terrain[roundX][roundY]){
			if(terrain[roundX][roundY].type == "💧"){
				valid = false;
			}
		}
	}
	return valid;
}
function updateTable(){
	if($('#table').css('display')=='block'){
		players.forEach(function(chara,index){
			$("#tbl_" + chara.id + " .energyBar").css("width",(chara.energy/100)*100 + "%");
			$("#tbl_" + chara.id + " .healthBar").css("width",(chara.health/100)*100 + "%");
			$("#char_" + chara.id + " .healthBar").css("width",(chara.health/100)*100 + "%");
			$("#char_" + chara.id + " .energyBar").css("width",(chara.energy/100)*100 + "%");
			if(chara.weapon){
				$("#char_" + chara.id + " .charWeap").text(chara.weapon.name);
			} else {
				$("#char_" + chara.id + " .charWeap").text("");
			}
			$("#tbl_" + chara.id + " .status").html(chara.lastAction);
			$("#tbl_" + chara.id + " .kills").text(chara.kills);
			if(chara.weapon){
				$("#tbl_" + chara.id + " .weapon").text(chara.weapon.name);
			} else {
				$("#tbl_" + chara.id + " .weapon").text("");
			}
		});
		dedPlayers.forEach(function(chara,index){
			$("#tbl_" + chara.id + " .kills").text(chara.kills);
			if(chara.weapon){
				$("#tbl_" + chara.id + " .weapon").text(chara.weapon.name);
			} else {
				$("#tbl_" + chara.id + " .weapon").text("");
			}
		});
	} else {
		$('#messages td').css('opacity','0.3');
		players.forEach(function(chara,index){
			if(chara.plannedAction != "move" && chara.plannedAction != "sleep" && chara.plannedAction != "forage"){
				$('#eventMsg tbody').prepend("<tr><td>Day " + day + " " + hour + ":00</td><td><img src='" + chara.img + "'></img>" + chara.name + " " + chara.lastAction + "</td>>");
			}
		});
		dedPlayers.forEach(function(chara,index){
			if(!chara.diedMessage){
				$('#deathMsg tbody').prepend("<tr><td>Day " + day + " " + hour + ":00</td><td><img src='" + chara.img + "'></img>" + chara.death + "</td>>");
				chara.diedMessage = "Done";
			}
		});
		/*if(messages.length - 1 > lastMessage){
			for(let i = lastMessage + 1;i < messages.length;i++){
				$('#messages tbody').prepend("<tr><td>Day " + messages[i][2] + " " + messages[i][3] + ":00</td><td><img src='" + messages[i][0].img + "'></img>" + messages[i][1] + "</td>>");
			}
			lastMessage = messages.length - 1;
		}*/
	}
}
function arrayRemove(arr, value) { 
	return arr.filter(function(ele){ return ele != value; });
}
function hypD(x,y,hyp=true){
	if (hyp){
		return Math.sqrt(Math.pow(x,2)+Math.pow(y,2));
	} else {
		return Math.sqrt(Math.pow(x,2)-Math.pow(y,2));
	}
}
function terrainCheck(x,y){
	let roundX = Math.round(x/25)*25;
	let roundY = Math.round(y/25)*25;
	if(terrain[roundX]){
		if(terrain[roundX][roundY]){
			return terrain[roundX][roundY].type;
		} else {
			return "Index error";
		}
	}
}
var generated = false;
function generateTerrain(){
	terrain.forEach(function(terrRow,i){
		terrRow.forEach(function(terr,j){
			terr.destroy();
		});
	});
	riverSpawns = [];
	if(!generated){
	for(var i = 0;i<=mapSize;i+=25){
		terrain[i] = [];
		//timerClick("terrain row " + i);
		for(var j =0;j<=mapSize;j+=25){
			//timerClick("terrain bound check row " + i + " col " + j);
			if(boundsCheck(i,j)){
				//timerClick("terrain row " + i + " col " + j);
				let tempTerr = new Terrain("rand",i,j);
				tempTerr.draw();
				terrain[i][j] = tempTerr;
				//timerClick("terrain row " + i + " col " + j);
			}
			//timerClick("terrain bound check row " + i + " col " + j);
		}
		//timerClick("terrain row " + i);
	}
	timerClick("terrain spread");
	if(Math.floor($('#txt_spreadTerrain').val()) > 0){
		for(var i = 0;i<$('#txt_spreadTerrain').val();i++){
			spreadTerrain();
			//console.log("");
		}
	}
	riverSpawns.forEach(function(river,index){
		generateRiver(river,true);
	});
	timerClick("terrain spread");
	}
	//generated = true;
}
function spreadTerrain(){
	for(var i = 0;i<=mapSize;i+=25){
		for(var j =0;j<=mapSize;j+=25){
			if(terrain[i][j]){
				terrain[i][j].spread();
			}
		}
	}
}
function generateRiver(river,recursive){
	var dir = Math.floor(Math.random()*8);
	do {
		xDir = Math.floor(Math.random() * 3) - 1;
		yDir = Math.floor(Math.random() * 3) - 1;
	} while (xDir != 0 && yDir != 0);
	var length = Math.floor(Math.random()*20) + 10;
	//console.log(dir);
	var currX = river.x+dirArr[dir][0]*25;
	var currY = river.y+dirArr[dir][1]*25;
	var split = -1;
	if(Math.random() > 0.75 && recursive){
		split = Math.floor(Math.random() * (length - 5) + 10);
	}
	for(var i = 0;i<length;i++){
		//console.log(currX + " " + currY)
		if(terrain[currX]){
			if(terrain[currX][currY]){
				terrain[currX][currY].type = "💧";
				terrain[currX][currY].draw();
				if(i == split && recursive){
					generateRiver(terrain[currX][currY],false);
					//console.log("river split");
					//console.log(terrain[currX][currY]);
				}
			} 
		}
		let ChangeDir = Math.floor(Math.random() * 3) - 1;
		dir += ChangeDir;
		if(dir < 0)
			dir = 0;
		if(dir > 7)
			dir = 7;
		//console.log(dir);
		currX += dirArr[dir][0]*25;
		currY += dirArr[dir][1]*25;			
	}
}
function rollSpecialP(tempName){
	let tempArr = [
	"Andou",
	"Parn",
	"Lin Setsu A",
	"Tsukasa",
	"Teppei",
	];
	if (tempArr.includes(tempName)){
		return "Evil";
	} else {
		return "Good";
	}
	
}
function rollSpecialH(tempName){
	if (tempName == 'Evil'){
		return "250";
	} else {
		return "100";
	}
	
}
function roll(options){
	let tempArr = [];
	//console.log(options);
	options.forEach(function(choice,index){
		for(let i =0;i<choice[1];i++){
			tempArr.push(choice[0]);
		}
	});
	//console.log(tempArr);
	tempArr.sort(() => Math.random() - 0.5);
	return tempArr[0];
}
function timerClick(val){
	var d = new Date();
	if(timerClicks[val]) {
		console.log(val + " - " + (d.getTime() - timerClicks[val]));
		timerClicks[val] = "";
	} else {
		timerClicks[val] = d.getTime();
		console.log(val + " started");
	}
}