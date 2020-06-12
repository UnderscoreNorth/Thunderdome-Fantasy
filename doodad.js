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
		}
	}
	draw(){
		let doodDiv = $('#doodad_' + this.id);
		if(!doodDiv.length){
			$('#doodads').append("<div id='doodad_" + this.id + "' class='bomb' style='transform:translate(" + (this.x / 1000 * $('#map').width() - iconSize/2) + "px," + (this.y / 1000 *  $('#map').height() - iconSize/2) + "px)'>💣</div>");
			doodDiv = $('#doodad_' + this.id);
			this.div = doodDiv;
		}
	}
	blowUp(){
		let tD = this;
		players.forEach(function(oP,index){
			let dist = hypD(oP.x - tD.x,oP.y - tD.y);
			if(dist <= tD.range){
				damage(tD,oP);
			}
		});
		this.div.remove();
		doodads = arrayRemove(doodads,this);
	}
}