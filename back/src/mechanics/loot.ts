import { getArmor } from "../entities/armor";
import { getWeapon } from "../entities/weapon";
import { TerrainType } from "../terrain";
import { roll } from "../utils";
import { Action } from "./actions";

export class LootAction extends Action {
  tile: TerrainType;
  constructor(
    arg: Action & {
      data: {
        target: TerrainType;
      };
    }
  ) {
    super(arg);
    this.name = "loot";
    this.tile = arg.data.target;
  }
  perform(): void {
    console.log("looting");
    if (this.tile.loot) {
      this.tile.loot--;
      let choices = [];
      if (this.player.equip.weapon == undefined) {
        choices.push(["weapon", 1]);
      }
      if (this.player.equip.armor == undefined) {
        choices.push(["armor", 1]);
      }
      if (roll(choices) == "weapon") {
        this.player.equip.weapon = getWeapon(this.tile.value);
        this.player.equip.weapon.owner = this.player;
        this.player.statusMessage = "equips " + this.player.equip.weapon.name;
      } else {
        this.player.equip.armor = getArmor(this.tile.value);
        this.player.equip.armor.owner = this.player;
        this.player.statusMessage =
          "equips " + this.player.equip.armor.name + " armor";
      }
    } else {
      this.player.statusMessage = "found nothing in " + this.tile.icon;
    }
  }
}
