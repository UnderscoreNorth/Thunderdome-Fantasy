class Terrain {
	constructor(type,x,y){
		this.x = x;
		this.y = y;
		this.spreadOnce = false;
		this.riverSpawn = false;
		if(type == "rand"){
			this.type = roll([["🌳",100],["⛰️",5],["",250],["💧",5]]);
		}
		if(this.type == "💧" && roll([["yes",1],["no",5]]) == "yes"){
			this.riverSpawn = true;
			riverSpawns.push(this);
		}
	}
	draw(){
		let terrainDiv = $('#terrain_' + this.x + "_" + this.y);
		if(!terrainDiv.length){
			$('#terrain').append("<div id='terrain_" + this.x + "_" + this.y + "' class='terrain' style='transform:translate(" + (this.x / mapSize * $('#map').width() - 12.5) + "px," + (this.y / mapSize *  $('#map').height() - 12.5) + "px)'>" + this.type + "</div>");
			terrainDiv = $('#terrain_' + this.x + "_" + this.y);
			this.div = terrainDiv;
		}
		terrainDiv.text(this.type);
	}
	destroy(){
		this.div.remove();
		terrain[this.x] = arrayRemove(terrain[this.x],this);
	}
	spread(){
		if(this.type=="💧" && !this.spreadOnce){
			for(var i = this.x - 25;i <= this.x+25;i+=25){
				for(var j = this.y -25;j <= this.y+25;j+=25){
					let spreadTimes = 0;
					if(terrain[i]){
						if(terrain[i][j]){
							if(terrain[i][j].type != "💧" && terrain[i][j] != this){
								if(roll([["yes",1],["no",8+spreadTimes]])=="yes"){
									spreadTimes++;
									terrain[i][j].type = "💧";
									terrain[i][j].spreadOnce = false;
									terrain[i][j].draw();
								}
							}
						}
					}
					this.spreadOnce = true;
					
				}
			}
		}else if(this.type=="⛰️" && !this.spreadOnce){
			for(var i = this.x - 25;i <= this.x+25;i+=25){
				for(var j = this.y -25;j <= this.y+25;j+=25){
					let spreadTimes = 0;
					if(terrain[i]){
						if(terrain[i][j]){
							if(terrain[i][j].type != "⛰️" && terrain[i][j] != this){
								if(roll([["yes",1],["no",20+spreadTimes*10]])=="yes"){
									spreadTimes++;
									terrain[i][j].type = "⛰️";
									terrain[i][j].spreadOnce = false;
									terrain[i][j].draw();
								}
							}
						}
					}
					this.spreadOnce = true;
				}
			}
		}
	}
}