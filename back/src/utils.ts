import { Char } from "./entities/char";
import { game } from "./game";
import { TerrainType } from "./terrain";

export function roll<T>(options: Array<[T, number]>): T {
  let total_weight = 0;
  // log_message(options);
  options.forEach(function (choice, index) {
    if (choice[1] > 0) {
      total_weight = total_weight + Math.round(choice[1]);
    }
  });
  let roll_choice = roll_range(1, total_weight);
  // log_message(roll_choice)
  for (let i = 0; i < options.length; i++) {
    let choice = options[i];
    if (choice[1] >= roll_choice) {
      // log_message('returning ' + choice[0])
      return choice[0];
    } else {
      roll_choice = roll_choice - choice[1];
    }
  }
}
export function roll_range(min: number, max: number) {
  return Math.floor(Math.random() * (max + 1 - min)) + min;
}
export const directions = [
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 1],
  [-1, 0],
  [-1, 1],
];
export function changeDirection(dir: number, angle: number) {
  dir = dir + angle;
  if (dir > 7) dir -= 8;
  if (dir < 0) dir += 8;
  return dir;
}
export function arrayRemove(arr: Array<any>, value: any) {
  return arr.filter(function (ele) {
    return ele != value;
  });
}

export function hypD(x: number, y: number, hyp = true) {
  if (hyp) {
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  } else {
    return Math.sqrt(Math.pow(x, 2) - Math.pow(y, 2));
  }
}
export function getTerrain(x: number, y: number) {
  return game.map.array?.[x]?.[y];
}
export function log_message(str: any, msg_level = 0) {}
export function updatePlayerDistTable() {
  let playerDistTable = game.playerDistTable;
  playerDistTable.length = 0;
  for (const p1 of game.chars) {
    if (!playerDistTable[p1.id]) playerDistTable[p1.id] = [];
    for (const p2 of game.chars) {
      if (!playerDistTable[p2.id]) playerDistTable[p2.id] = [];
      let dist = 0;
      if (p1 != p2) {
        let x1 = p1.situation.x;
        let y1 = p1.situation.y;
        let x2 = p2.situation.x;
        let y2 = p2.situation.y;
        dist = hypD(x2 - x1, y2 - y1);
      }
      playerDistTable[p1.id][p2.id] = { d: dist, c: p2 };
      playerDistTable[p2.id][p1.id] = { d: dist, c: p1 };
    }
  }
}
export function safeBoundsCheck(x: number, y: number) {
  if (isNaN(x) || isNaN(y)) {
    return false;
  }
  let boundX = Math.abs(x - game.diameter / 2);
  let boundY = Math.abs(y - game.diameter / 2);
  let dist = hypD(boundX, boundY);
  //if(dist>safeSize){
  //	return false
  //}
  return true;

  /*
	valid = true
	let safeSize = mapSize/2 -dangerSize;
	let boundX = Math.abs(x-mapSize/2);
	let boundY = Math.abs(y-mapSize/2);
	let limit = Math.sqrt(Math.abs(Math.pow(safeSize,2) - Math.pow(boundX,2)));
	if(boundY > limit){
		valid = false;
	}
	return valid
	*/
}
//calculate the angle between e1 and e2
//e1 and e2 need to have an x and y variable
export function entityAngle(e1: Char, e2: Char, radians = false) {
  return calcAngle(
    e1.situation.x,
    e1.situation.y,
    e2.situation.x,
    e2.situation.y,
    radians
  );
}

//calculates the angle of point1 to point2
export function calcAngle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  radians = false
) {
  let angle = Math.atan((y2 - y1) / (x2 - x1));
  if (x1 > x2) angle += Math.PI;
  if (!radians) return angle * (180 / Math.PI);
  else return angle;
}
export function getNearby(x: number, y: number) {
  return [
    [x - 1, y],
    [x, y - 1],
    [x + 1, y],
    [x, y + 1],
  ];
}
export function getNearByDiag(x: number, y: number) {
  return [
    [x, y + 1],
    [x + 1, y + 1],
    [x + 1, y],
    [x + 1, y - 1],
    [x, y - 1],
    [x - 1, y - 1],
    [x - 1, y],
    [x - 1, y + 1],
  ];
}
export function shuffle(array: Array<any>) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}
export function getD(o1: Char | TerrainType, o2: Char | TerrainType) {
  let x1 = o1 instanceof Char ? o1.situation.x : o1.x;
  let x2 = o2 instanceof Char ? o2.situation.x : o2.x;
  let y1 = o1 instanceof Char ? o1.situation.y : o1.y;
  let y2 = o2 instanceof Char ? o2.situation.y : o2.y;
  return hypD(x1 - x2, y1 - y2);
}
export function fromXY(xy: string) {
  return xy.split(",").map((i) => parseInt(i)) as [number, number];
}
