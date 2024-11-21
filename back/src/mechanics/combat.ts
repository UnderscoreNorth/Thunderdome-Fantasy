import { Char } from "../entities/char";
import { getD } from "../utils";
import { Action, ActionArg } from "./actions";
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
export function fight_target(tP: Char, oP: Char) {
  let atk = launch_attack(tP, oP);
  tP.statusMessage = atk + oP.name;
  if (oP.stats.health <= 0) {
    tP.stats.kills++;
    tP.statusMessage = "kills " + oP.name;
    oP.statusMessage = "killed by " + tP.name;
    oP.die("killed by " + tP.name);
  } else {
    let atk = launch_attack(oP, tP);
    if (tP.stats.health <= 0) {
      oP.stats.kills++;
      oP.statusMessage = "kills " + tP.name;
      tP.statusMessage = "killed by " + oP.name + "'s counterattack";
      // pushMessage(oP, oP.name + " fights back and kills " + tP.name);
      tP.die("killed by " + oP.name + "'s counterattack");
    }
  }
}

function launch_attack(attacker: Char, defender: Char) {
  let dmgBonus = 0;
  let accBonus = 1;
  let rngBonus = 0;
  let xpBonus = 1;
  let defBonus = 1;
  if (attacker.equip.weapon) {
    dmgBonus = attacker.equip.weapon.dmgBonus;
    accBonus *= attacker.equip.weapon.accBonus;
    rngBonus = attacker.equip.weapon.rangeBonus;
    xpBonus = attacker.equip.weapon.xpBonus;
  }
  if (defender.equip.armor) {
    defBonus = defender.equip.armor.defBonus;
  }
  if (attacker.stats.combatRange + rngBonus >= getD(attacker, defender)) {
    if (attacker.equip.weapon) attacker.useWeapon();
    if (defender.equip.armor) defender.useArmor();
    if (Math.random() > 1 - accBonus) {
      let dmg =
        Math.pow(Math.random(), 1 / (attacker.stats.combatExp / 100 + 1)) *
        (10 + dmgBonus);
      defender.stats.health -= dmg * defBonus;
      attacker.stats.combatExp += (dmg * xpBonus) / 3;
      defender.stats.maxHealth += Math.round(Math.random());
      attacker.stats.energy -= Math.random() * 10 * xpBonus;
      return "attacks ";
    } else {
      return "misses ";
    }
  } else {
    return "is out of range of ";
  }
}
