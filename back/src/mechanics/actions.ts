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
