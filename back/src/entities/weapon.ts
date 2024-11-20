import { roll, roll_range } from "../utils";
import { Char } from "./char";

export type Wpn = {
  name: string;
  rangeBonus?: number;
  accBonus?: number;
  dmgBonus?: number;
  uses?: [number, number];
  value: number;
  type: "melee" | "ranged";
};
export function getWeapon(value: number) {
  let weaponOdds: Array<[Wpn, number]> = [
    [
      { name: "sword", dmgBonus: 7.5, uses: [2, 50], value: 1, type: "melee" },
      30,
    ],
    [
      {
        name: "pistol",
        rangeBonus: 2,
        dmgBonus: 3,
        uses: [12, 12],
        value: 1,
        accBonus: 0.7,
        type: "ranged",
      },
      20,
    ],
    [
      {
        name: "sniper",
        rangeBonus: 10,
        uses: [5, 5],
        value: 2,
        dmgBonus: 15,
        type: "ranged",
        accBonus: 0.9,
      },
      1,
    ],
  ];
  for (const weapon of weaponOdds) {
    weapon[1] = Math.pow(weapon[1] - 100 * (value - 1), 2);
  }
  return new Weapon(roll(weaponOdds));
}
export class Weapon {
  name: string;
  rangeBonus: number;
  dmgBonus: number;
  uses: number;
  value: number;
  accBonus: number;
  owner: Char;
  xpBonus: number;
  constructor(a: Wpn) {
    this.name = a.name;
    this.rangeBonus = a.rangeBonus ?? 0;
    this.dmgBonus = a.dmgBonus ?? 0;
    this.uses = a.uses ? roll_range(a.uses[0], a.uses[1]) : 1;
    this.value = a.value;
    this.accBonus = a.accBonus ?? 1;
    this.xpBonus = 1;
    if (a.type == "melee") {
      this.xpBonus = 1.3;
    } else if (a.type == "ranged") {
      this.xpBonus = 0.5;
    }
  }
  use() {
    this.uses--;
  }
}
