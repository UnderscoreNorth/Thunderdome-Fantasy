import { Action, ActionArg } from "../mechanics/actions";
import { roll } from "../utils";
import { Item } from "./items";

export type Wpn = {
  name: string;
  rangeBonus?: number;
  accBonus?: number;
  dmgBonus?: number;
  uses?: [number, number];
  value: number;
  type: "melee" | "range" | "magic";
  planValue?: number;
  action?: typeof Action;
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
        type: "range",
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
        type: "range",
        accBonus: 0.9,
      },
      5,
    ],
    [
      {
        name: "magic",
        rangeBonus: 2,
        dmgBonus: 0,
        uses: [999, 999],
        accBonus: 0.6,
        value: 5,
        type: "magic",
        planValue: 5,
        action: class PracticeMagic extends Action {
          constructor(arg: ActionArg) {
            super(arg);
            this.name = "Practice Magic";
          }
          perform() {
            this.player.stats.energy -= Math.random() * 20;
            this.player.stats.magicExp += Math.random() * 20;
            this.player.logMsg("practices magic");
            this.player.equip.weapon.rangeBonus += Math.random();
            if (this.player.equip.weapon.rangeBonus > 10)
              this.player.equip.weapon.rangeBonus = 10;
            this.player.equip.weapon.accBonus += 0.02;
          }
        },
      },
      1,
    ],
  ];
  return new Weapon(
    roll(weaponOdds.filter((i) => (i[0] as Wpn).value >= value))
  );
}
export class Weapon extends Item {
  type: "melee" | "range" | "magic";
  planValue: number;
  action?: typeof Action;
  constructor(a: Wpn) {
    super(a);
    this.type = a.type;
    this.planValue = a.planValue ?? 0;
    this.action = a.action;
  }
  planAction() {
    return this.planValue;
  }
}
