class Doodad {
	constructor(name,x,y,owner){
		this.name = name;
		this.x = x;
		this.y = y;
		this.owner = owner;
		this.id = doodadsNum;
		doodadsNum++;
		switch(this.name){
			case "💣":
				this.range = 100;
				this.dmg = 100;
				this.triggerRange = 24;
				break;
			case "🕳":
				this.range = 24;
				this.dmg = Math.floor(Math.random() * 50);
				this.triggerRange = 24;
				break;
		}
	}
	draw(){
		let doodDiv = $('#doodad_' + this.id);
		if(!doodDiv.length){
			$('#doodads').append("<div id='doodad_" + this.id + "' class='bomb' style='transform:translate(" + (this.x / 1000 * $('#map').width() - iconSize/2) + "px," + (this.y / 1000 *  $('#map').height() - iconSize/2) + "px)'>" + this.name + "</div>");
			doodDiv = $('#doodad_' + this.id);
			this.div = doodDiv;
		}
	}
	trigger(){
		let tD = this;
		players.forEach(function(oP,index){
			let dist = hypD(oP.x - tD.x,oP.y - tD.y);
			if(dist <= tD.range){
				damage(tD,oP);
				if(oP.health > 0 && tD.name == "🕳"){
					oP.lastAction = "trapped";
					oP.currentAction.name = "trapped";
				}
			}
		});
		this.div.remove();
		doodads = arrayRemove(doodads,this);
	}
}