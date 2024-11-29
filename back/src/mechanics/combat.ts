import { Char } from "../entities/char";
import { game } from "../game";
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
      this.player.logMsg("attacks the corpse of " + this.target.name);
      return;
    }
    let dist = game.map.getDistance(this.player.coord, this.target.coord);
    if (
      this.player.stats.combatRange +
        (this.player.equip?.weapon?.rangeBonus ?? 0) <
      dist
    ) {
      this.player.logMsg(
        "tries to fight " + this.target.name + " but they escape"
      );
      return;
    }
    fight_target(this.player, this.target);
  }
}
export function fight_target(tP: Char, oP: Char) {
  let atk = launch_attack(tP, oP);
  if (atk > 0) {
    tP.logMsg("hits " + oP.name + " for " + Math.round(atk * 10) / 10);
  } else if (atk == 0) {
    tP.logMsg("misses " + oP.name);
  } else {
    tP.logMsg("is out of range to attack " + oP.name);
  }
  if (oP.stats.health <= 0) {
    tP.stats.kills++;
    tP.logMsg("kills " + oP.name);
    oP.logMsg("killed by " + tP.name);
    oP.die("killed by " + tP.name);
  } else {
    if (oP.currentAction && Math.random() > oP.currentAction.interuptChance) {
      oP.currentAction = undefined;
    }
    let atk = launch_attack(oP, tP);
    if (atk > 0) {
      oP.logMsg("hits " + tP.name + " back for " + Math.round(atk * 10) / 10);
    } else if (atk == 0) {
      oP.logMsg("misses a counter on " + tP.name);
    } else {
      oP.logMsg("is out of range to counterattack " + tP.name);
    }
    if (tP.stats.health <= 0) {
      oP.stats.kills++;
      oP.logMsg("kills " + tP.name);
      tP.logMsg("killed by " + oP.name + "'s counterattack");
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
  if (attacker.equip.weapon && attacker.equip.weapon.uses > 0) {
    dmgBonus = attacker.equip.weapon.dmgBonus;
    accBonus *= attacker.equip.weapon.accBonus;
    rngBonus = attacker.equip.weapon.rangeBonus;
    xpBonus = attacker.equip.weapon.xpBonus;
  }
  if (defender.equip.armor && defender.equip.armor.uses > 0) {
    defBonus = defender.equip.armor.defBonus;
  }
  if (
    attacker.stats.combatRange + rngBonus >=
    game.map.getDistance(attacker.coord, defender.coord)
  ) {
    let combatType = "melee";
    if (attacker.equip.weapon && attacker.equip.weapon.uses > 0) {
      combatType = attacker.equip.weapon.type;
      attacker.useWeapon();
    }
    if (defender.equip.armor && defender.equip.armor.uses > 0)
      defender.useArmor();

    if (Math.random() > 1 - accBonus) {
      let dmg =
        Math.pow(
          Math.random(),
          1 / (attacker.stats[combatType + "Exp"] / 100 + 1)
        ) *
        (10 + dmgBonus);
      defender.stats.health -= dmg * defBonus;
      attacker.stats[combatType + "Exp"] += (dmg * xpBonus) / 3;
      defender.stats.maxHealth += Math.round(Math.random());
      attacker.stats.energy -= Math.random() * 10 * xpBonus;
      return dmg * defBonus;
    } else {
      return 0;
    }
  } else {
    return -1;
  }
}
