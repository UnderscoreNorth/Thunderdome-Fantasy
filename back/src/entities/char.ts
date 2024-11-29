import { game } from "../game";
import { Action, ActionArg } from "../mechanics/actions";
import { planAction } from "../mechanics/planAction";
import { fromCube } from "../utils";
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
    visibility: number;
    awareOf: Char[];
    inRangeOf: Char[];
    vision: Set<string>;
    seen: Set<string>;
    been: string[];
    dir: number;
    lastSlept: number;
    movePoints: number;
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
  coord: {
    q: number;
    s: number;
    r: number;
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
    q: number,
    s: number,
    r: number,
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
      awareOf: [],
      inRangeOf: [],
      visibility: 100,
      vision: new Set(),
      seen: new Set(),
      been: [],
      dir: Math.random() * 360,
      lastSlept: 0,
      movePoints: 0,
    };
    this.social = {
      moral,
      personality,
      peaceB: 50,
      aggroB: 50,
    };
    this.coord = { q, s, r };
    this.equip = {};
    this.death = "";
    this.dead = false;
    this.visionCheck();
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
  been() {
    if (this.situation.been.length) {
      let lastBeen = this.situation.been[this.situation.been.length - 1];
      if (lastBeen == fromCube(this.coord)) return;
    }
    this.situation.been.push(fromCube(this.coord));
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
    this.situation.movePoints = 2;
    if (game.map.tiles[fromCube(this.coord)]) {
      this.situation.vision = new Set();
      this.visionCheck();
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
    if (game.map.tiles[fromCube(this.coord)]) {
      this.situation.vision = new Set();
      this.visionCheck();
    }
    this.been();
    game.map.tiles[fromCube(this.coord)]?.terrainCheck(this);
    this.limitCheck();
    if (this.currentAction) this.currentAction.postPerform();
  }
  visionCheck() {
    let seen = false;
    let d = 0;
    this.situation.awareOf = [];
    this.situation.inRangeOf = [];
    do {
      seen = false;
      for (const tile of game.map.getRing(
        this.coord.q,
        this.coord.s,
        this.coord.r,
        d
      )) {
        if (game.map.canSee(game.map.tiles[fromCube(this.coord)], tile)) {
          for (const char of game.chars.filter((i) => !i.dead)) {
            if (
              char !== this &&
              char.coord.q == tile.q &&
              char.coord.s == tile.s &&
              char.coord.r == tile.r
            ) {
              if (this.group !== char.group) {
                this.situation.awareOf.push(char);
                if (
                  game.map.getDistance(this.coord, char.coord) <=
                  this.stats.combatRange +
                    (this.equip?.weapon?.uses
                      ? this.equip?.weapon?.rangeBonus ?? 0
                      : 0)
                ) {
                  this.situation.inRangeOf.push(char);
                }
              }
            }
          }
          this.situation.vision.add(fromCube(tile));
          this.situation.seen.add(fromCube(tile));
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

  /* explore() {
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
      if (
        this.situation.been
          .map((i) =>
            i
              .split(",")
              .map((j) => Math.round(parseInt(j)))
              .join(",")
          )
          .includes(xy)
      )
        priority /= 2;
      priorities.push([xy, priority]);
    }
    if (priorities.length == 0) console.log(nearby);
    let res = roll(priorities)
      .split(",")
      .map((x) => parseInt(x)) as [number, number];
    return res;
  }
    */
  //move to given coords
  moveToCoords(q: number, s: number, r: number) {
    this.coord = { q, s, r };
  }

  //check if player is supposed to die
  limitCheck() {
    if (isNaN(this.stats.health) || isNaN(this.stats.energy)) {
      this.die("glitched to death");
      return;
    }
    if (Object.values(this.coord).reduce((a, b) => a + b, 0) !== 0) {
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
    this.stats.health = 0;
    if (this.dead) return;
    this.death = death ?? this.name + " died of unknown causes";
    this.dead = true;
  }
}
