import { roll } from "../utils";
import { Item } from "./items";

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
export class Weapon extends Item {
  constructor(a: Wpn) {
    super(a);
    if (a.type == "melee") {
      this.xpBonus = 1.3;
    } else if (a.type == "ranged") {
      this.xpBonus = 0.5;
    }
  }
}
