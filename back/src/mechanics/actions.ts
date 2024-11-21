import { Char } from "../entities/char";
import { getWeapon } from "../entities/weapon";
import { game } from "../game";
import { Terrain, TerrainType } from "../terrain";
import { getD, getNearByDiag, getTerrain, hypD, roll_range } from "../utils";
import { fight_target } from "./combat";
export type ActionArg = {
  player: Char;
  priority: number;
  energyCost?: number;
  turns?: number;
  data?: object;
};

export class Action {
  name: string;
  player: Char;
  complete: boolean;
  turns: number;
  priority: number;
  energyCost: number;
  data: any;
  constructor(arg: ActionArg) {
    this.player = arg.player;
    this.complete = false;
    this.priority = arg.priority;
    this.turns = arg.turns ?? 1;
    this.energyCost = arg.energyCost ?? 0;
  }
  perform() {}
  postPerform() {
    this.turns--;
    if (this.turns <= 0) this.complete = true;
  }
}
export class RestAction extends Action {
  constructor(arg: ActionArg) {
    super(arg);
    this.name = "Rest";
  }
  perform() {
    this.player.stats.energy += Math.random() * 5 + 5;
    this.player.stats.health += Math.random() * 2;
    this.player.statusMessage = "rests";
  }
}
export class FightAction extends Action {
  target: Char;
  constructor(
    arg: ActionArg & {
      data: {
        target: Char;
      };
    }
  ) {
    super(arg);
    this.name = "Fight";
    this.target = arg.data.target;
  }
  perform(): void {
    if (this.target.stats.health <= 0) {
      this.player.statusMessage = "attacks the corpse of " + this.target.name;
      return;
    }
    let dist = getD(this.player, this.target);
    if (
      this.player.stats.combatRange +
        (this.player.equip?.weapon?.rangeBonus ?? 0) <
      dist
    ) {
      console.log(65, dist);
      this.player.statusMessage =
        "tries to fight " + this.target.name + " but they escape";
      return;
    }
    fight_target(this.player, this.target);
  }
}
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
    this.name = "Move";
    //get a coordinate to move to if not currently moving
    this.speedModifier = 1;
    if (this.priority == 2) this.speedModifier = 1.1;
    if (this.priority == 18) this.speedModifier = 1.5;
    if ("targetCoords" in arg.data) {
      this.targetX = arg.data["targetCoords"][0];
      this.targetY = arg.data["targetCoords"][1];
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
      this.maxAttempts = initTime * 100;
      this.path = tiles;
      let t = performance.now();

      let d = hypD(
        this.player.x() - this.targetX,
        this.player.y() - this.targetY
      );
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
        this.pathRedirects
      );
      if (this.path.length > 2) this.path.shift();
      if (this.path.length == 0)
        this.path = [game.map.array[this.player.x()][this.player.y()]];
      this.subTargetX = this.path[0].x;
      this.subTargetY = this.path[0].y;
      this.data = this.path.map((i) => [i.x, i.y]);
    }
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
    this.maxAttempts = initTime * 100;
    this.path = tiles;
    this.pathFind(
      this.player.x(),
      this.player.y(),
      this.targetX,
      this.targetY,
      []
    );
    if (this.path.length > 2) this.path.shift();
    if (this.path.length == 0)
      this.path = [game.map.array[this.player.x()][this.player.y()]];
    this.subTargetX = this.path[0].x;
    this.subTargetY = this.path[0].y;
    this.data = this.path.map((i) => [i.x, i.y]);
  }
  postPerform(): void {
    super.perform();
    if (this.player.situation.awareOf.includes(this.target))
      this.player.statusMessage = "following " + this.target.name;
  }
}
export class SleepAction extends Action {
  constructor(arg: ActionArg) {
    arg.turns = roll_range(24, 32);
    super(arg);
    this.name = "Sleep";
  }

  perform() {
    this.player.stats.health += Math.random() * 2;
    this.player.stats.energy += Math.random() * 5 + 5;
    //wake up
    if (this.turns > 1) {
      // log_message(this.player.name + " continues sleeping");
      this.player.statusMessage = "sleeping";
    } else {
      this.player.situation.lastSlept = 0;
      this.player.statusMessage = "woke up";
    }
  }
}
