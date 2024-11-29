import { Char } from "../entities/char";
import { game } from "../game";
import { Cube, TerrainType } from "../terrain";
import { fromCube } from "../utils";
import { Action, ActionArg } from "./actions";

export class MoveAction extends Action {
  targetCood: Cube;
  path: TerrainType[];
  subTargetCood: Cube;
  pathAttempts: number;
  pathRedirects: number;
  maxAttempts: number;
  speedModifier: number;
  remainingCost: number;
  constructor(
    arg: ActionArg & {
      data: {
        targetCoords?: Cube;
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
      this.targetCood = arg.data["targetCoords"];
      this.createPath();
    }
  }
  createPath() {
    this.pathAttempts = 0;
    this.pathRedirects = 0;
    let tiles = game.map.getTilesBetween(this.player.coord, this.targetCood);
    tiles.unshift(game.map.tiles[fromCube(this.player.coord)]);
    let initTime = game.map.getMovementCost(tiles);
    console.log(initTime);
    this.maxAttempts = tiles.length * 500;
    this.path = tiles;
    let t = performance.now();
    this.pathFind(this.player.coord, this.targetCood, []);
    console.log(
      "Pathfinding: ",
      this.player.name,
      "Redirects: ",
      this.pathRedirects,
      "Distance: ",
      game.map.getDistance(this.player.coord, this.targetCood),
      "Time: ",
      game.map.getMovementCost(this.path)
    );
    if (this.path.length > 2) this.path.shift();
    if (this.path.length == 0) {
      throw "y";
      this.path = [game.map.tiles[fromCube(this.player.coord)]];
      this.turns = 1;
    }
    this.subTargetCood = this.path[0];
    this.remainingCost = game.map.getMovementCost([
      game.map.tiles[fromCube(this.player.coord)],
      this.path[0],
    ]);
    this.data = this.path.map((i) => fromCube(i));
  }
  pathFind(startCood: Cube, targetCood: Cube, prevTiles: TerrainType[]) {
    //console.log(this.maxAttempts, this.pathAttempts);
    let qsr = fromCube(startCood);
    if (prevTiles.map((i) => fromCube(i)).includes(qsr)) return;
    prevTiles.push(game.map.tiles[qsr]);
    let time = game.map.getMovementCost(prevTiles);
    if (time >= game.map.getMovementCost(this.path)) {
      return;
    }
    //if (time >= 999) return;
    let initTile = prevTiles[0];
    let targetD = game.map.getDistance(startCood, targetCood);
    let initialD = game.map.getDistance(initTile, targetCood);
    //if (targetD - (initialD + 10) > 0) return;
    //Prevent zigzagging
    let nearBy = game.map
      .getRing(startCood.q, startCood.s, startCood.r, 1)
      .filter(
        (i) => prevTiles.filter((j) => fromCube(j) == fromCube(i)).length
      ).length;
    if (nearBy > 1) {
      //console.log("nearBy");
      //return;
    }
    this.pathAttempts++;
    if (this.pathAttempts > this.maxAttempts) return;
    if (qsr == fromCube(targetCood)) {
      this.path = prevTiles;
      this.pathAttempts = 0;
      this.pathRedirects++;
    } else {
      let arr: Array<{ coord: Cube; c: number }> = [];
      //Prioritize the closest directions
      for (const tile of game.map.getRing(
        startCood.q,
        startCood.s,
        startCood.r,
        1
      )) {
        arr.push({
          coord: tile,
          c: game.map.getDistance(tile, targetCood),
        });
      }
      arr.sort((a, b) => a.c - b.c);
      //console.log(arr);
      for (const { coord } of arr) {
        this.pathFind(coord, targetCood, [...prevTiles]);
      }
    }
  }
  subMove() {
    let qsr = fromCube(this.subTargetCood);
    let moveCost = Math.min(
      game.map.getMovementCost([
        game.map.tiles[fromCube(this.player.coord)],
        game.map.tiles[qsr],
      ]),
      this.player.situation.movePoints
    );

    this.remainingCost -= moveCost;
    this.player.situation.movePoints -= moveCost;
    this.player.stats.energy -= Math.random() * moveCost;
    if (this.remainingCost > 0) return;
    this.player.moveToCoords(
      this.subTargetCood.q,
      this.subTargetCood.s,
      this.subTargetCood.r
    );
    this.player.been();
    this.path.shift();
    this.data = this.path.map((i) => fromCube(i));
    if (this.path.length == 0) {
      this.turns = 1;
      return;
    } else {
      this.subTargetCood = this.path[0];
      this.remainingCost = game.map.getMovementCost([
        game.map.tiles[fromCube(this.player.coord)],
        this.path[0],
      ]);
      this.subMove();
    }
  }
  perform() {
    this.subMove();
    if (this.priority == 3) {
      this.player.logMsg("escaping fight");
    } else if (this.priority == 18) {
      this.player.logMsg("escaping fire");
    } else {
      switch (game.map.tiles[fromCube(this.player.coord)].type) {
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
      game.map.getDistance(this.target.coord, this.player.coord) <
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
    this.targetCood = this.target.coord;
    this.createPath();
  }
  postPerform(): void {
    super.postPerform();
    if (this.player.situation.awareOf.includes(this.target))
      this.player.logMsg("following " + this.target.name);
  }
}
