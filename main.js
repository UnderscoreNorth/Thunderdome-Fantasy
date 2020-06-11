var players = [];
var doodads = [];
var interval = 1000;
var initDone = false;
var playing = false;
var day = 0;
var hour = 8;
var iconSize = 24;
var moralNum = {"Chaotic":0,"Neutral":0,"Lawful":0};
var personalityNum = {"Evil":0,"Neutral":0,"Good":0};
var fallOffCliffNum = 3; //Max num who can fall off a cliff

var charlist = [
	["Saki","https://cdn.myanimelist.net/images/characters/7/75506.jpg"],
	["Nodoka","https://cdn.myanimelist.net/images/characters/12/75583.jpg"],
	["Shizuno","https://cdn.myanimelist.net/images/characters/5/144823.jpg"],
	["Kanbaru","https://cdn.myanimelist.net/images/characters/10/134447.jpg"],
	["Momoka","https://cdn.myanimelist.net/images/characters/16/252415.jpg"],
	["Lemon Karaage","https://cdn.myanimelist.net/images/characters/2/255173.jpg"],
	["Hinata","https://cdn.myanimelist.net/images/characters/10/353090.jpg"],
	["Shirase","https://cdn.myanimelist.net/images/characters/8/350550.jpg"],
	["Shannon","https://cdn.myanimelist.net/images/characters/16/92402.jpg"],
	["Pacifica","https://cdn.myanimelist.net/images/characters/10/36693.jpg"],
	["Zephiris","https://cdn.myanimelist.net/images/characters/3/37746.jpg"],
	["Cz","https://rei.animecharactersdatabase.com/uploads/chars/5688-572477661.jpg"],
	["Sadao","https://cdn.myanimelist.net/images/characters/3/183237.jpg"],
	["Emi","https://cdn.myanimelist.net/images/characters/8/205261.jpg"],
	["Rin","https://cdn.myanimelist.net/images/characters/4/71822.jpg"],
	["Kuro","https://cdn.myanimelist.net/images/characters/7/52605.jpg"],
	["Kubota","https://cdn.myanimelist.net/images/characters/9/302453.jpg"],
	["Sakamoto","https://cdn.myanimelist.net/images/characters/4/392038.jpg"],
	["Shaga","https://cdn.myanimelist.net/images/characters/9/138959.jpg"],
	["Sen","https://cdn.myanimelist.net/images/characters/2/147149.jpg"],
	["Kaiji","https://cdn.myanimelist.net/images/characters/13/29010.jpg"],
	["Andou","https://cdn.myanimelist.net/images/characters/12/384749.jpg"],
	["Ishida","https://cdn.myanimelist.net/images/characters/2/117574.jpg"],
	["Sahara","https://cdn.myanimelist.net/images/characters/2/114781.jpg"],
	["Parn","https://cdn.myanimelist.net/images/characters/5/61730.jpg"],
	["Deedlit","https://cdn.myanimelist.net/images/characters/11/297644.jpg"],
	["Kanta","https://cdn.myanimelist.net/images/characters/4/89376.jpg"],
	["Taiko","https://cdn.myanimelist.net/images/characters/8/89555.jpg"],
	["Sakaki","https://cdn.myanimelist.net/images/characters/14/56155.jpg"],
	["Kagura","https://cdn.myanimelist.net/images/characters/4/48177.jpg"],
	["Chiyo","https://cdn.myanimelist.net/images/characters/13/35084.jpg"],
	["Osaka","https://cdn.myanimelist.net/images/characters/3/27890.jpg"],
	["Vash","https://cdn.myanimelist.net/images/characters/10/89607.jpg"],
	["Wolfwood","https://cdn.myanimelist.net/images/characters/2/89610.jpg"],
	["Milly","https://cdn.myanimelist.net/images/characters/14/73336.jpg"],
	["Meryl","https://cdn.myanimelist.net/images/characters/2/73335.jpg"],
	["Sxou","https://s4.anilist.co/file/anilistcdn/character/large/127642-oWpjZoKWIxon.jpg"],
	["10guy","https://s4.anilist.co/file/anilistcdn/character/large/b130729-yPvO39UcW1LN.jpg"],
	["Lin Setsu A","https://s4.anilist.co/file/anilistcdn/character/large/b127308-8ZcdJnsXHXUD.jpg"],
	["Coldsteel","https://s4.anilist.co/file/anilistcdn/character/large/b130726-P2CbG6jpTAbE.jpg"],
	["Yukito","https://cdn.myanimelist.net/images/characters/12/128621.jpg"],
	["Misuzu","https://cdn.myanimelist.net/images/characters/12/121658.jpg"],
	["Shuuji","https://cdn.myanimelist.net/images/characters/4/62115.jpg"],
	["Chise","https://cdn.myanimelist.net/images/characters/4/161041.jpg"],
	["Chrno","https://cdn.myanimelist.net/images/characters/15/92362.jpg"],
	["Rosette","https://cdn.myanimelist.net/images/characters/15/92357.jpg"],
	["Aion","https://cdn.myanimelist.net/images/characters/4/113080.jpg"],
	["Azmaria","https://cdn.myanimelist.net/images/characters/12/33364.jpg"]
];
$( document ).ready(function(){
	Init();
	$(window).resize(function(){
		
	});
	$('#map').width($('#map').height());
	$('#side').width($('body').width() - ($('#map').width() + 100));
	players.forEach(function(chara,index){
		chara.draw();
	});
});
function Init(){
	$('#map').width($('#map').height());
	$('#side').width($('body').width() - ($('#map').width() + 200));
	for(var i = 0;i<48;i++){
		let x = 0;
		let y = 0;
		do {
			x = Math.floor(Math.random() * 1000);
			y = Math.floor(Math.random() * 1000);
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
	initDone = true;
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
		players.sort(() => Math.random() - 0.5);
		players.forEach(chara => chara.plannedAction = "");
		players.forEach(chara => chara.finishedAction = false);
		players.forEach(chara => chara.planAction());
	}
}
function action(){
	let numReady = 0;
	players.forEach(function(chara,index){
		if(chara.plannedAction)
			numReady++;
	});
	if(numReady == players.length){
		players.forEach(chara => chara.doAction());
		hour++;
		if(hour == 24){
			hour = 0;
			day++;
		}
		$('#day').text("Day " + day + " Hour " + hour);
	}
}
function MapResize(){
	
}
function boundsCheck(x,y){
	x = Math.abs(x-500);
	y = Math.abs(y-500);
	let limit = Math.sqrt(Math.pow(500,2) - Math.pow(x,2));
	if(y > limit){
		return false;
	} else {
		return true;
	}
}
function updateTable(){
	players.forEach(function(chara,index){
		$("#tbl_" + chara.id + " .energyBar").css("width",(chara.energy/100)*100 + "%");
		$("#tbl_" + chara.id + " .healthBar").css("width",(chara.health/100)*100 + "%");
		$("#char_" + chara.id + " .healthBar").css("width",(chara.health/100)*100 + "%");
		$("#tbl_" + chara.id + " .status").text(chara.lastAction);
		$("#tbl_" + chara.id + " .kills").text(chara.kills);
		if(chara.weapon){
			$("#tbl_" + chara.id + " .weapon").text(chara.weapon.name);
		} else {
			$("#tbl_" + chara.id + " .weapon").text("");
		}
	});
	$('#nums').text('Moral: C ' + moralNum.Chaotic + " N " + moralNum.Neutral + " L " + moralNum.Lawful + " Personality: G " + personalityNum.Good + " N " + personalityNum.Neutral + " E " + personalityNum.Evil);
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
