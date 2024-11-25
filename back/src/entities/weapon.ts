import { Action, ActionArg } from "../mechanics/actions";
import { roll } from "../utils";
import { Char } from "./char";
import { Item, Titem } from "./items";

export type Wpn = Titem & {
  type: "melee" | "range" | "magic";
};
export function getWeapon(value: number) {
  let weaponOdds: Array<[Wpn, number]> = [
    [
      {
        name: "sword",
        dmgBonus: 7.5,
        uses: [999, 999],
        value: 1,
        type: "melee",
      },
      30,
    ],
    [
      {
        name: "spear",
        dmgBonus: 4,
        rangeBonus: 0.75,
        uses: [999, 999],
        value: 1,
        type: "melee",
      },
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
        name: "bow",
        rangeBonus: 2.5,
        dmgBonus: 0,
        uses: [5, 5],
        value: 1,
        accBonus: 0.7,
        type: "range",
        planValue: (i: Item) => {
          let chance = 5;
          if (i.uses < 10) chance += Math.pow(10 - i.uses, 2) / 2;
          return 5;
        },
        action: class PracticeMagic extends Action {
          constructor(arg: ActionArg) {
            super(arg);
            this.name = "fletches arrows";
          }
          perform() {
            this.player.stats.energy -= Math.random() * 2;
            this.player.logMsg("fletches arrows");
            this.player.equip.weapon.uses++;
          }
        },
        destroyOnEmpty: false,
      },
      30,
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
        planValue: (i: Item) => 5,
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

  constructor(a: Wpn) {
    super(a);
    this.type = a.type;
  }
}
