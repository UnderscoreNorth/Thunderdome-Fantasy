import { game } from "../game";
import { Action, ActionArg } from "../mechanics/actions";
import { planAction } from "../mechanics/planAction";
import {
  getD,
  getNearByDiag,
  getTerrain,
  roll,
  updatePlayerDistTable,
} from "../utils";
import { Armor } from "./armor";
import { Weapon } from "./weapon";

export class Char {
  controlled: boolean;
  name: string;
  img: string;
  group: string;
  id: any;
  log: Array<[string, string]>;
  stats: {
    health: number;
    maxHealth: number;
    energy: number;
    maxEnergy: number;
    sightRange: number;
    intimidation: number;
    moveSpeed: number;
    kills: number;
    meleeExp: number;
    rangeExp: number;
    magicExp: number;
    survivalExp: number;
    combatRange: number;
  };
  situation: {
    x: number;
    y: number;
    visibility: number;
    awareOf: Char[];
    inRangeOf: Char[];
    vision: Set<string>;
    seen: Set<string>;
    been: Set<string>;
    dir: number;
    lastSlept: number;
  };
  social: {
    moral: "Chaotic" | "Neutral" | "Lawful";
    personality: "Good" | "Neutral" | "Evil";
    peaceB: number;
    aggroB: number;
  };
  coin: {
    value: number;
  };
  equip: {
    weapon?: Weapon;
    armor?: Armor;
  };
  plannedAction?: Action;
  currentAction?: Action;
  lastAction?: Action;
  death: string;
  dead: boolean;
  constructor(
    name: string,
    group: string,
    img: string,
    x: number,
    y: number,
    moral: "Chaotic" | "Neutral" | "Lawful",
    personality: "Good" | "Neutral" | "Evil",
    id: number
  ) {
    this.controlled = false;
    //_______________general data_______________
    this.name = name;
    this.group = group;
    this.img = img;
    this.id = id;
    this.log = [];
    //stats
    this.stats = {
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      sightRange: 5,
      intimidation: 0,
      kills: 0,
      meleeExp: 0,
      magicExp: 0,
      rangeExp: 0,
      survivalExp: 0,
      moveSpeed: 0.95 + Math.random() * 0.1,
      combatRange: 2,
    };
    if (personality == "Evil") {
      this.stats.intimidation += 20;
    }
    this.situation = {
      x,
      y,
      awareOf: [],
      inRangeOf: [],
      visibility: 100,
      vision: new Set(),
      seen: new Set(),
      been: new Set(),
      dir: Math.random() * 360,
      lastSlept: 0,
    };
    this.social = {
      moral,
      personality,
      peaceB: 50,
      aggroB: 50,
    };
    this.equip = {};
    this.death = "";
    this.dead = false;
    this.visionCheck(this.x(), this.y());
  }
  //other players

  awareOfPlayer(oP: Char) {
    if (this.situation.awareOf.indexOf(oP) >= 0) return true;
    return false;
  }
  inRangeOfPlayer(oP: Char) {
    if (this.situation.inRangeOf.indexOf(oP) >= 0) return true;
    return false;
  }
  //get all the players within a certain distance
  nearbyPlayers(dist: number) {
    return game.playerDistTable[this.id]
      .filter((x) => x.d <= dist)
      .map((x) => x.c);
  }
  //action planning
  setPlannedAction(
    action: typeof Action,
    priority: number,
    data = {},
    force = false
  ) {
    if (
      (this.plannedAction && priority > this.plannedAction.priority) ||
      !this.plannedAction
    ) {
      this.plannedAction = new action({ player: this, priority, data });
    }
  }
  turnStart() {
    if (this.dead) return;
    if (getTerrain(this.x(), this.y())) {
      this.situation.vision = new Set();
      this.visionCheck(this.x(), this.y());
    }
    this.lastAction = this?.currentAction;
    if (this.currentAction && this.currentAction.complete) {
      this.currentAction = undefined;
    }
  }
  planAction() {
    if (this.dead) return;
    planAction(this);
  }

  //perform action
  //called by action in main
  doAction() {
    if (this.dead) return;
    // this.finishedAction = false;
    if (
      !this.currentAction ||
      (this.plannedAction &&
        this.currentAction.priority < this.plannedAction.priority)
    ) {
      this.currentAction = this.plannedAction;
      this.plannedAction = undefined;
    }
    //perform planned action
    if (this.stats.health > 0 && this.currentAction) {
      this.currentAction.perform();
    }
  }
  useWeapon() {
    if (this.equip.weapon) {
      this.equip.weapon.use();
      if (this.equip.weapon.uses == 0 && this.equip.weapon?.destroyOnEmpty) {
        if (this.equip.weapon.type == "melee") {
          this.logMsg("broke their " + this.equip.weapon.name);
        } else {
          this.logMsg("ran out of ammo for " + this.equip.weapon.name);
        }
        this.equip.weapon = undefined;
      }
    }
  }
  useArmor() {
    if (this.equip.armor) {
      this.equip.armor.use();
      if (this.equip.armor.uses == 0 && this.equip.armor?.destroyOnEmpty) {
        this.logMsg("broke their " + this.equip.armor.name + " armor");
        this.equip.armor = undefined;
      }
    }
  }
  turnEnd() {
    if (this.dead) return;
    this.situation.lastSlept++;
    if (getTerrain(this.x(), this.y())) {
      this.situation.vision = new Set();
      this.visionCheck(this.x(), this.y());
    }
    this.situation.been.add(`${this.x()},${this.y()}`);
    getTerrain(this.x(), this.y())?.terrainCheck(this);
    this.limitCheck();
    if (this.currentAction) this.currentAction.postPerform();
  }
  x() {
    return Math.round(this.situation.x);
  }
  y() {
    return Math.round(this.situation.y);
  }
  visionCheck(x: number, y: number) {
    let seen = false;
    let d = 1;
    this.situation.awareOf = [];
    this.situation.inRangeOf = [];
    do {
      seen = false;
      for (const [x2, y2] of game.map.getRing(x, y, d)) {
        if (game.map.canSee(x, y, x2, y2)) {
          for (const char of game.chars.filter((i) => !i.dead)) {
            if (char !== this && char.x() == x2 && char.y() == y2) {
              if (this.group !== char.group) {
                this.situation.awareOf.push(char);
                if (
                  getD(this, char) <=
                  this.stats.combatRange + (this.equip?.weapon?.rangeBonus ?? 0)
                ) {
                  this.situation.inRangeOf.push(char);
                }
              }
            }
          }
          let xy = `${x2},${y2}`;
          this.situation.vision.add(xy);
          this.situation.seen.add(xy);
          seen = true;
        }
      }
      d++;
    } while (d <= game.maxPathFind * 1.5);
  }
  logMsg(str: string) {
    this.log.push([
      `${game.day.toString().padStart(2, " ")} ${game.hour
        .toString()
        .padStart(2, "0")}:${game.minute.toString().padStart(2, "0")}`,
      str,
    ]);
  }

  explore() {
    let priorities: Array<[string, number]> = [];
    let nearby = getNearByDiag(this.x(), this.y());
    let dir = Math.floor(this.situation.dir / 45);
    for (const i in nearby) {
      let [x, y] = nearby[i];
      let xy = `${x},${y}`;
      let tile = getTerrain(x, y);
      if (!tile) continue;
      let priority = 0;
      if (tile.elevation <= 0) {
        priority += 1;
      } else if (tile.type == "mtn") {
        priority += 10;
      } else {
        priority += 50;
      }
      if (parseInt(i) == dir) {
        priority *= 5;
      } else if (
        (parseInt(i) == 0 && dir == 7) ||
        (parseInt(i) == 7 && dir == 0) ||
        Math.abs(parseInt(i) - dir) == 1
      ) {
        priority *= 2;
      }
      if (this.situation.been.has(xy)) priority /= 2;
      priorities.push([xy, priority]);
    }
    if (priorities.length == 0) console.log(nearby);
    let res = roll(priorities)
      .split(",")
      .map((x) => parseInt(x)) as [number, number];
    return res;
  }
  //move to given coords
  moveToCoords(targetX: number, targetY: number) {
    this.situation.x = targetX;
    this.situation.y = targetY;
    updatePlayerDistTable();
  }

  //check if player is supposed to die
  limitCheck() {
    if (isNaN(this.stats.health) || isNaN(this.stats.energy)) {
      this.die("glitched to death");
      return;
    }
    if (isNaN(this.situation.x) || isNaN(this.situation.y)) {
      this.die("glitched out of reality");
      return;
    }

    if (this.stats.energy <= 0) {
      this.stats.energy = 0;
    }
    if (this.stats.energy > this.stats.maxEnergy)
      this.stats.energy = this.stats.maxEnergy;

    if (this.stats.health > this.stats.maxHealth) {
      this.stats.health = this.stats.maxHealth;
    }

    if (this.stats.health <= 0) {
      this.stats.health = 0;
      this.die();
      //this.apply_all_effects("death");
    }
    //if(this.stats.energy < 25)
    //console.log(this.name + " low on energy");
  }

  //action on death
  die(death?: string) {
    if (this.dead) return;
    this.death = death ?? this.name + " died of unknown causes";
    this.dead = true;
  }
}
