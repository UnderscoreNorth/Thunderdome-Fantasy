import { game } from "../game";
import {
  Action,
  FightAction,
  FollowAction,
  LootAction,
  MoveAction,
  RestAction,
  SleepAction,
} from "../mechanics/actions";
import { TerrainType } from "../terrain";
import { DmgType } from "../types";
import {
  getD,
  getNearby,
  getNearByDiag,
  getTerrain,
  hypD,
  log_message,
  roll,
  roll_range,
  safeBoundsCheck,
  shuffle,
  updatePlayerDistTable,
} from "../utils";
import { Weapon } from "./weapon";

export class Char {
  controlled: boolean;
  name: string;
  img: string;
  group: string;
  id: any;
  log: string[];
  stats: {
    health: number;
    maxHealth: number;
    energy: number;
    maxEnergy: number;
    sightRange: number;
    intimidation: number;
    moveSpeed: number;
    kills: number;
    combatExp: number;
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
  };
  plannedAction?: Action;
  currentAction?: Action;
  lastAction?: Action;
  statusMessage: string;
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
      combatExp: 0,
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
    this.statusMessage = "";
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

  take_damage(dmg: number, source: Char, dmg_type: DmgType, fightMsg = {}) {
    /*this.apply_all_effects("takeDmg", {
      source: source,
      damage: dmg,
      dmg_type: dmg_type,
      fightMsg: fightMsg,
    });*/
    this.stats.health -= dmg;
  }

  heal_damage(dmg: number, source: Char, dmg_type: DmgType, fightMsg = {}) {
    /*this.apply_all_effects("healDmg", {
      source: source,
      damage: dmg,
      dmg_type: dmg_type,
      fightMsg: fightMsg,
    });*/
    this.stats.health += dmg;
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

  //check for aware and in range players
  /*checkSurroundingPlayers() {
    this.calc_bonuses();

    //action check update
    if (this.lastActionState == "sleeping") {
      this.unaware = true;
      this.incapacitated = true;
    }

    let tP = this;
    this.awareOf = [];
    if (!this.unaware) {
      players.forEach(function (oP) {
        if (oP == tP) return;
        let aware = awareOfCheck(tP, oP);
        if (aware) {
          //apply effects from those in sight
          oP.apply_all_effects("opAware", { opponent: tP });
          tP.awareOf.push(oP);
        }
      });
    }
    this.inRangeOf = [];
    if (!this.incapacitated) {
      this.inRangeOf = this.nearbyPlayers(tP.fightRange + tP.fightRangeB);
      this.inRangeOf.forEach(function (oP) {
        oP.apply_all_effects("opInRange", { opponent: tP });
      });
    }

    this.opinionUpdate();
    this.danger_score = this.get_danger_level();

    this.follow_target = "";
    this.fight_target = "";
    this.steal_target = "";
    this.ally_target = "";
    if (this.awareOf.length > 0) {
      this.follow_target = this.choose_follow_target();
      this.fight_target = this.choose_fight_target();
      this.steal_target = this.choose_steal_target();
      this.ally_target = this.choose_alliance_target();
    }

    this.apply_all_effects("surroundingCheck");
  }*/

  turnStart() {
    if (this.dead) return;
    if (getTerrain(this.x(), this.y())) {
      this.situation.vision = new Set();
      this.visionCheck(this.x(), this.y());
    }
    this.statusMessage = "";
    this.lastAction = this?.currentAction;
    if (this.currentAction && this.currentAction.complete) {
      this.currentAction = undefined;
    }
  }
  planAction() {
    if (this.dead) return;
    if (this.stats.energy <= 0) {
      // this.setPlannedAction("rest", 20);
      this.setPlannedAction(RestAction, 20);
      log_message("rest");
    }
    let options = [];
    //move
    options.push(["move", 100]);
    if (
      (((game.hour >= 22 || game.hour < 5) &&
        this.lastAction instanceof SleepAction == false) ||
        this.situation.lastSlept > 24 * 4) &&
      getTerrain(this.x(), this.y()).elevation >= 0
    ) {
      options.push([
        "sleep",
        100 * Math.pow(this.situation.lastSlept / 4 - 16, 2),
      ]);
    }
    //choose new action
    let action_option = roll(options);
    if (action_option == "sleep") {
      this.setPlannedAction(SleepAction, 3);
    } else {
      let goals: Array<
        [
          {
            goal: TerrainType | Char;
            type: "fight" | "loot";
          },
          number
        ]
      > = [];
      if (
        getTerrain(this.x(), this.y()).loot &&
        this.equip.weapon == undefined
      ) {
        console.log("At loot site");
        goals.push([
          { goal: getTerrain(this.x(), this.y()), type: "loot" },
          500,
        ]);
      }
      for (const char of this.situation.inRangeOf) {
        goals.push([
          { goal: char, type: "fight" },
          Math.round(200 - char.stats.health),
        ]);
      }
      if (
        (!this.currentAction || this.currentAction.priority < 3) &&
        goals.length
      ) {
        let goal = roll(goals);
        if (goal.type == "fight") {
          this.setPlannedAction(FightAction, 3, {
            target: goal.goal,
          });
        } else {
          this.setPlannedAction(LootAction, 3, {
            target: goal.goal,
          });
        }
      } else if (!this.currentAction || this.currentAction.priority < 2) {
        let goals: Array<
          [
            {
              goal: TerrainType | Char;
              type: "move" | "follow";
            },
            number
          ]
        > = [];
        for (let xy of Array.from(this.situation.vision)) {
          let [x, y] = xy.split(",").map((i) => parseInt(i));
          let isGoal = false;
          let value = game.map.array[x][y].value;
          if (
            value &&
            !this.situation.been.has(xy) &&
            this.equip.weapon == undefined
          ) {
            isGoal = true;
          }
          if (isGoal)
            goals.push([
              {
                goal: getTerrain(x, y),
                type: "move",
              },
              value * 10,
            ]);
        }
        for (const char of this.situation.awareOf) {
          if (!this.situation.inRangeOf.includes(char))
            goals.push([{ goal: char, type: "follow" }, 2]);
        }

        if (goals.length) {
          let goal = roll(goals);
          if (goal.goal instanceof TerrainType) {
            this.setPlannedAction(MoveAction, 2, {
              targetCoords: [goal.goal.x, goal.goal.y],
            });
          } else {
            this.setPlannedAction(FollowAction, 2, {
              target: goal.goal,
            });
          }
        }
      }

      if (!this.currentAction) {
        let [x, y] = [0, 0];
        let attempt = 0;
        let numWaterTiles = 0;
        do {
          attempt++;
          [x, y] = game.map.getRandomLandPoint();
          numWaterTiles = game.map.countWaterTilesInPath(
            this.x(),
            this.y(),
            x,
            y
          );
        } while (attempt < 10 && numWaterTiles > 3);
        this.setPlannedAction(MoveAction, 1, {
          targetCoords: game.map.getRandomLandPoint(this),
        });
      }
    }
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
    if (this.stats.health > 0) {
      this.currentAction.perform();
    }
  }
  useWeapon() {
    if (this.equip.weapon) {
      this.equip.weapon.use();
      if (this.equip.weapon.uses == 0) this.equip.weapon = undefined;
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
    if (this.statusMessage == "") {
      this.statusMessage = "does nothing";
    } else {
      this.log.push(
        `Day ${game.day.toString().padStart(2, " ")} ${game.hour
          .toString()
          .padStart(2, "0")}:${game.minute.toString().padStart(2, "0")} - ${
          this.statusMessage
        }`
      );
    }
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
              this.situation.awareOf.push(char);
              if (
                getD(this, char) <=
                this.stats.combatRange + (this.equip?.weapon?.rangeBonus ?? 0)
              ) {
                this.situation.inRangeOf.push(char);
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
  /*visionCheck(x: number, y: number, dir: number, prev: number, limit: number) {
    if (!getTerrain(x, y)) return;
    let xy = `${x},${y}`;
    this.situation.seen.add(xy);
    this.situation.vision.add(xy);
    let curr = getTerrain(x, y).elevation;
    if (curr < 0) curr = -1;
    //if (getTerrain(x, y).type == "tree") curr += 0.5;
    if (curr > prev) {
      return;
    } else if (curr == prev) {
      limit--;
      if (limit == 0) return;
    } else if (curr < prev) {
      limit++;
    }
    for (let [x2, y2] of getNearby(x, y)) {
      this.visionCheck(x2, y2, -1, curr, limit);
    }
  }*/

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
      this.death = this.name + " glitched to death";
      this.die();
      return;
    }
    if (isNaN(this.situation.x) || isNaN(this.situation.y)) {
      this.death = this.name + " glitched out of reality";
      this.die();
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
  die() {
    if (!this.death) {
      // this.death = this.name + " died of unknown causes";
      this.death = "Cast in the name of God, Ye Guilty";
    }
    this.dead = true;
  }
}
