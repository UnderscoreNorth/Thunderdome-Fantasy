import { roll } from "../utils";
import { Item } from "./items";
export type Tarmor = {
  name: string;
  uses?: [number, number];
  value: number;
  defBonus: number;
};
export function getArmor(value: number) {
  let armorOdds: Array<[Tarmor, number]> = [
    [{ name: "cloth", defBonus: 0.9, uses: [5, 20], value: 1 }, 40],
    [{ name: "leather", defBonus: 0.7, uses: [5, 20], value: 2 }, 25],
    [{ name: "plate", defBonus: 0.5, uses: [5, 20], value: 3 }, 10],
  ];
  for (const weapon of armorOdds) {
    weapon[1] = Math.pow(weapon[1] - 100 * (value - 1), 2);
  }
  return new Armor(roll(armorOdds));
}
export class Armor extends Item {
  constructor(a: Tarmor) {
    super(a);
  }
}