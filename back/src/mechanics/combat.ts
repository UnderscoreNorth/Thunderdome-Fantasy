import { Char } from "../entities/char";
import { getD } from "../utils";

export function fight_target(tP: Char, oP: Char) {
  let atk = launch_attack(tP, oP);
  tP.statusMessage = atk + oP.name;
  if (oP.stats.health <= 0) {
    tP.stats.kills++;
    tP.statusMessage = "kills " + oP.name;
    oP.statusMessage = "killed by " + tP.name;
    oP.death = "killed by " + tP.name;
  } else {
    let atk = launch_attack(oP, tP);
    if (tP.stats.health <= 0) {
      oP.stats.kills++;
      oP.statusMessage = "kills " + tP.name;
      tP.statusMessage = "killed by " + oP.name + "'s counterattack";
      // pushMessage(oP, oP.name + " fights back and kills " + tP.name);
      tP.death = "killed by " + oP.name + "'s counterattack";
    }
  }
}

function launch_attack(attacker: Char, defender: Char) {
  let dmgBonus = 0;
  let accBonus = 1;
  let rngBonus = 0;
  let xpBonus = 1;
  if (attacker.equip.weapon) {
    dmgBonus = attacker.equip.weapon.dmgBonus;
    accBonus *= attacker.equip.weapon.accBonus;
    rngBonus = attacker.equip.weapon.rangeBonus;
    xpBonus = attacker.equip.weapon.xpBonus;
  }
  if (attacker.stats.combatRange + rngBonus >= getD(attacker, defender)) {
    if (attacker.equip.weapon) attacker.useWeapon();
    if (Math.random() > 1 - accBonus) {
      let dmg =
        Math.pow(Math.random(), 1 / (attacker.stats.combatExp / 100 + 1)) *
        (10 + dmgBonus);
      defender.stats.health -= dmg;
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
