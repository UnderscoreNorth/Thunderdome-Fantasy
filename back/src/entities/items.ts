import { roll_range } from "../utils";
import { Char } from "./char";
export type Titem = {
  name: string;
  rangeBonus?: number;
  accBonus?: number;
  dmgBonus?: number;
  uses?: [number, number];
  value: number;
  defBonus?: number;
};
export class Item {
  name: string;
  rangeBonus: number;
  dmgBonus: number;
  uses: number;
  value: number;
  accBonus: number;
  owner: Char;
  xpBonus: number;
  defBonus: number;
  constructor(a: Titem) {
    this.name = a.name;
    this.rangeBonus = a.rangeBonus ?? 0;
    this.dmgBonus = a.dmgBonus ?? 0;
    this.uses = a.uses ? roll_range(a.uses[0], a.uses[1]) : 1;
    this.value = a.value;
    this.accBonus = a.accBonus ?? 1;
    this.defBonus = a.defBonus ?? 1;
    this.xpBonus = 1;
  }
  use() {
    this.uses--;
  }
}
