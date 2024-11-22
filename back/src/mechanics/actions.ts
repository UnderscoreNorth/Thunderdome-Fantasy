import { Char } from "../entities/char";
import { roll_range } from "../utils";
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
  interuptChance: number;
  constructor(arg: ActionArg) {
    this.player = arg.player;
    this.complete = false;
    this.priority = arg.priority;
    this.turns = arg.turns ?? 1;
    this.energyCost = arg.energyCost ?? 0;
    this.interuptChance = 1;
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
    this.player.stats.energy += Math.random() * 1;
    if (this.player.stats.energy < 0) this.player.stats.energy = 0.1;
    this.player.stats.energy =
      Math.sqrt(this.player.stats.energy / this.player.stats.maxEnergy) *
      this.player.stats.maxEnergy;
    this.player.stats.health += Math.random() * 2;
    this.player.statusMessage = "rests";
  }
}

export class SleepAction extends RestAction {
  constructor(arg: ActionArg) {
    arg.turns = roll_range(24, 32);
    super(arg);
    this.interuptChance = 0;
    this.name = "Sleep";
  }

  perform() {
    super.perform();
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
