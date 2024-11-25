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

    let distX = this.subTargetX - this.player.situation.x;
    let distY = this.subTargetY - this.player.situation.y;
    let dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
    let targetX = 0;
    let targetY = 0;
    let moved = Math.min(dist, moveDist);
    let remainingD = moveDist - dist;
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
      }
    } else {
      //target too far away
      let shiftX = (distX / dist) * moveDist;
      let shiftY = (distY / dist) * moveDist;
      //destination coords
      targetX = this.player.situation.x * 1 + shiftX;
      targetY = this.player.situation.y * 1 + shiftY;
    }
    this.player.moveToCoords(targetX, targetY);
    this.player.stats.energy -= Math.random() * 2 * this.speedModifier * moved;
    if (this.path.length && remainingD > 0) this.subMove(remainingD);
  }
  perform() {
    this.subMove(this.player.stats.moveSpeed);
    if (this.priority == 3) {
      this.player.logMsg("escaping fight");
    } else if (this.priority == 18) {
      this.player.logMsg("escaping fire");
    } else {
      switch (getTerrain(this.player.x(), this.player.y()).type) {
        case "water":
          this.player.logMsg("swimming");
          break;
        case "mtn":
          this.player.logMsg("hiking");
          break;
        default:
          this.player.logMsg("moving");
          break;
      }
    }
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
      this.player.logMsg("Lost sight of " + this.target.name);
      this.turns = 1;
      return;
    }
    this.targetX = this.target.x();
    this.targetY = this.target.y();
    this.createPath();
  }
  postPerform(): void {
    super.postPerform();
    if (this.player.situation.awareOf.includes(this.target))
      this.player.logMsg("following " + this.target.name);
  }
}
