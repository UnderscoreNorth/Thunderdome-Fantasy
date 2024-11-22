import { Char } from "../entities/char";
import { game } from "../game";
import { TerrainType } from "../terrain";
import { getD, getNearByDiag, getTerrain, hypD } from "../utils";
import { Action, ActionArg } from "./actions";

export class MoveAction extends Action {
  targetX: number;
  targetY: number;
  path: TerrainType[];
  subTargetX: number;
  subTargetY: number;
  pathAttempts: number;
  pathRedirects: number;
  maxAttempts: number;
  speedModifier: number;
  constructor(
    arg: ActionArg & {
      data: {
        targetCoords?: [number, number];
      };
    }
  ) {
    arg.turns = 999;
    super(arg);
    this.interuptChance = 0.9;
    this.name = "Move";
    //get a coordinate to move to if not currently moving
    this.speedModifier = 1;
    if (this.priority == 2) this.speedModifier = 1.1;
    if (this.priority > 2) this.speedModifier = 1.5;
    if ("targetCoords" in arg.data) {
      this.targetX = arg.data["targetCoords"][0];
      this.targetY = arg.data["targetCoords"][1];
      this.createPath();
    }
  }
  createPath() {
    this.pathAttempts = 0;
    this.pathRedirects = 0;
    let tiles = game.map.getTilesBetween(
      this.player.x(),
      this.player.y(),
      this.targetX,
      this.targetY
    );
    tiles.unshift(game.map.array[this.player.x()][this.player.y()]);
    let initTime = game.map.getTime(tiles);
    this.maxAttempts = initTime * 500;
    this.path = tiles;
    let t = performance.now();
    this.pathFind(
      this.player.x(),
      this.player.y(),
      this.targetX,
      this.targetY,
      []
    );
    console.log(
      "Pathfinding: ",
      this.player.name,
      "Redirects: ",
      this.pathRedirects,
      "Distance: ",
      Math.round(
        hypD(this.player.x() - this.targetX, this.player.y() - this.targetY)
      ),
      "Time: ",
      Math.round(performance.now() - t)
    );
    if (this.path.length > 2) this.path.shift();
    if (this.path.length == 0)
      this.path = [game.map.array[this.player.x()][this.player.y()]];
    this.subTargetX = this.path[0].x;
    this.subTargetY = this.path[0].y;
    this.data = this.path.map((i) => [i.x, i.y]);
  }
  pathFind(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    prevTiles: TerrainType[]
  ) {
    if (prevTiles.map((i) => `${i.x},${i.y}`).includes(`${startX},${startY}`))
      return;
    prevTiles.push(game.map.array[startX][startY]);
    let initTile = prevTiles[0];
    let time = game.map.getTime(prevTiles);
    if (time >= game.map.getTime(this.path)) return;
    let targetD = hypD(targetX - startX, targetY - startY);
    let initialD = hypD(targetX - initTile.x, targetY - initTile.y);
    if (targetD - (initialD + 5) > 0) return;
    //Prevent zigzagging
    let nearBy = getNearByDiag(startX, startY).filter(([x, y]) => {
      return prevTiles.filter((j) => {
        return j.x == x && j.y == y;
      }).length;
    }).length;
    if (nearBy > 1) return;
    this.pathAttempts++;
    if (this.pathAttempts > this.maxAttempts) return;
    if (startX == targetX && startY == targetY) {
      this.path = prevTiles;
      this.pathAttempts = 0;
      this.pathRedirects++;
    } else {
      let arr: Array<[number, number, number]> = [];
      //Prioritize the closest directions
      for (const [x, y] of getNearByDiag(startX, startY)) {
        if (game.map.array?.[x]?.[y] == undefined) continue;
        let d =
          hypD(x - targetX, y - targetY) *
          (1 / game.map.array[x][y].moveSpeedB);
        arr.push([x, y, d]);
      }
      arr.sort((a, b) => a[2] - b[2]);
      for (const [x, y] of arr) {
        this.pathFind(x, y, targetX, targetY, [...prevTiles]);
      }
    }
  }
  subMove(d: number) {
    let terrainB =
      getTerrain(
        Math.round(this.player.situation.x),
        Math.round(this.player.situation.y)
      ).moveSpeedB * this.speedModifier;
    let moveDist = d * terrainB;

    // log_message(this.name+' moves')
    //Calculating distance from target
    let distX = this.subTargetX - this.player.situation.x;
    let distY = this.subTargetY - this.player.situation.y;
    let dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
    let targetX = 0;
    let targetY = 0;
    // log_message(moveDist)
    //move towards target location
    if (dist <= moveDist) {
      //target within reach
      targetX = this.subTargetX;
      targetY = this.subTargetY;
      this.path.shift();
      this.data = this.path.map((i) => [i.x, i.y]);
      if (this.path.length == 0) {
        this.turns = 1;
      } else {
        this.subTargetX = this.path[0].x;
        this.subTargetY = this.path[0].y;
        let remainingD = (moveDist - d) / terrainB;
        if (remainingD > 0) this.subMove(remainingD);
      }
    } else {
      //target too far away
      let shiftX = (distX / dist) * moveDist;
      let shiftY = (distY / dist) * moveDist;
      //destination coords
      targetX = this.player.situation.x * 1 + shiftX;
      targetY = this.player.situation.y * 1 + shiftY;
      if (
        targetX > game.diameter ||
        targetY > game.diameter ||
        targetX < 0 ||
        targetY < 0
      ) {
        console.log(
          this.player.situation.x,
          this.player.situation.y,
          dist,
          moveDist,
          targetX,
          targetY,
          shiftX,
          shiftY,
          distX,
          distY
        );
      }
    }

    this.player.moveToCoords(targetX, targetY);
    //this.player.stats.energy -= Math.floor(Math.random() * 5 + 2);
    switch (getTerrain(Math.round(targetX), Math.round(targetY)).type) {
      case "water":
        this.player.statusMessage = "swimming";
        break;
      case "mtn":
        this.player.statusMessage = "hiking";
        break;
      default:
        this.player.statusMessage = "moving";
        break;
    }
    if (this.priority == 3) this.player.statusMessage = "escaping fight";
    if (this.priority == 18) this.player.statusMessage = "escaping fire";
    this.player.stats.energy -= Math.random() * 2 * this.speedModifier;
    // this.player.apply_all_effects("move");
  }
  perform() {
    this.subMove(this.player.stats.moveSpeed);
  }
}

export class FollowAction extends MoveAction {
  target: Char;
  constructor(
    arg: ActionArg & {
      data: {
        target: Char;
      };
    }
  ) {
    super(arg);
    if ("target" in arg.data) {
      this.target = arg.data.target;
      this.findPlayer();
    }
  }
  perform(): void {
    this.findPlayer();
    if (
      getD(this.target, this.player) <
      this.player.stats.combatRange +
        (this.player.equip?.weapon?.rangeBonus ?? 0)
    ) {
      this.turns = 1;
      return;
    }
    super.perform();
  }
  findPlayer() {
    if (!this.player.situation.awareOf.includes(this.target)) {
      this.player.statusMessage = "Lost sight of " + this.target.name;
      this.turns = 1;
      return;
    }
    this.targetX = this.target.x();
    this.targetY = this.target.y();
    this.createPath();
  }
  postPerform(): void {
    super.perform();
    if (this.player.situation.awareOf.includes(this.target))
      this.player.statusMessage = "following " + this.target.name;
  }
}
