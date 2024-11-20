import { Char } from "./char";
import { weapon_data } from "../itemData";
import { log_message, roll, roll_range } from "../utils";

/*
"turnStart" start of turn
"death" upon death
"attack" attacking another player
"defend" attacked by another player
"dealDmg" dealing damage to another player
"win" killing another player
"lose" killed by another player
"newStatus" new status inflicted
"healDmg" healing damage
"opAware" seeing another player (op)
"surroundingCheck" checking surrondings
"opinionUpdate" updating opinions on players
"planAction" end of action planning phase
"doAction" start of action phase
"turnEnd" end of turn
"endMove" after moving to a location
"awareCheck"
"awareCheckOthers"
	
"aggroCheck" checking aggro against a player
"aggroCheckOthers" aggro effects from oP onto player
"opinionCheck"
"opinionCheckOthers"
*/
export class StatMod {
  name: string;
  display_name: string;
  sightBonus: number;
  visibilityB: number;
  rangeBonus: number;
  fightBonus: number;
  dmgReductionB: number;
  peaceBonus: number;
  aggroBonus: number;
  intimidationBonus: number;
  moveSpeedB: number;
  player: Char;
  constructor(name: string) {
    this.name = name;
    this.display_name = this.name[0].toUpperCase() + this.name.substring(1);

    this.sightBonus = 0;
    this.visibilityB = 0;

    this.rangeBonus = 0;
    this.fightBonus = 1;
    this.dmgReductionB = 1;

    this.peaceBonus = 0;
    this.aggroBonus = 0;
    this.intimidationBonus = 0;

    this.moveSpeedB = 1;
  }

  effect(state, data = {}) {}
  effect_calc(state, x, data = {}) {
    return x;
  }

  //calculating stat bonuses
  calc_bonuses() {
    this.player.sightRangeB += this.sightBonus;
    this.player.visibilityB += this.visibilityB;

    this.player.fightRangeB += this.rangeBonus;
    this.player.fightDmgB *= this.fightBonus;
    this.player.dmgReductionB *= this.dmgReductionB;

    this.player.peaceB += this.peaceBonus;
    this.player.aggroB += this.aggroBonus;
    this.player.intimidation += this.intimidationBonus;

    this.player.moveSpeedB *= this.moveSpeedB;
  }

  //calculating item odds
  item_odds(prob, item_type, data = {}) {}

  /*-----turn effects-----*/
  //start of turn
  turnStart(data = {}) {}
  //checking surrondings
  surroundingCheck(data = {}) {}
  //updating opinions on players
  opinionUpdate(data = {}) {}
  //end of action planning phase
  planAction(data = {}) {}
  //start of action phase, before performing
  //args: action
  doActionBefore(data = {}) {}
  //start of action phase
  //args: action
  doActionAfter(data = {}) {}
  //end of turn
  turnEnd(data = {}) {}
  //upon dying
  death(data = {}) {}

  //after moving to a location
  endMove() {}

  /*-----combat effects-----*/
  //attacking opponent, before damage calc
  //args: opponent, counter, dmg_type, fightMsg={}
  attack(data = {}) {}
  //attacked by opponent, before damage calc
  //args: opponent, counter, dmg_type, fightMsg={}
  defend(data = {}) {}
  //calculating outgoing damage from combat
  //args: opponent, counter, dmg_type, fightMsg
  dmgCalcOut(damage, data = {}) {
    return damage;
  }
  //calculating incoming damage from combat
  //args: opponent, counter, dmg_type, fightMsg
  dmgCalcIn(damage, data = {}) {
    return damage;
  }
  //dealing damage to opponent
  //args: opponent, damage, dmg_type, fightMsg={}
  dealDmg(data = {}) {}
  //killing another player
  //args: opponent
  win(data = {}) {}
  //killed by another player
  //args: opponent
  lose(data = {}) {}

  /*-----damage effects-----*/
  //taking damage
  //args: source
  /*???takeDmg(data = {}) {
    return damage;
  }*/
  //healing
  //args: source
  /*??? healDmg(data = {}) {
    return damage;
  }*/

  //new status effect inflicted
  //args: status_eff
  newStatus() {
    return true;
  }

  /*-----nearby player effects-----*/
  //oP seen by the player
  //args: oP
  opAware(data = {}) {}
  //oP in range of the player
  //args: oP
  opInRange(data = {}) {}

  //effects when checking awareness of oP
  //args: oP
  awareCheck(data = {}) {}
  //effects from oP when the player is checking awareness on them
  //args: tP
  awareCheckOthers(data = {}) {}

  /*-----player calc effects-----*/
  //effects when calculating opinion score of oP
  //args: oP
  opinionCalc(score, data = {}) {
    return score;
  }
  //effects from oP when the player is calculating opinion score on them
  //args: tP
  opinionCalcOthers(score, data = {}) {
    return score;
  }

  //effects when calculating aggro score of oP
  //args: oP, follow_type
  followCalc(score, data = {}) {
    return score;
  }
  //effects from oP when the player is calculating aggro score on them
  //args: tP, follow_type
  followCalcOthers(score, data = {}) {
    return score;
  }

  //effects when calculating aggro score of oP
  //args: oP
  aggroCalc(score, data = {}) {
    return score;
  }
  //effects from oP when the player is calculating aggro score on them
  //args: tP
  aggroCalcOthers(score, data = {}) {
    return score;
  }

  //effects when calculating danger levels on oP
  //args: coords
  playerDangerCalc(score, data = {}) {
    return score;
  }
  //effects from oP when the player is calculating danger levels on them
  //args: tP, coords
  playerDangerCalcOther(score, data = {}) {
    return score;
  }

  //effects when calculating area danger levels
  //args: coords
  dangerCalc(score, data = {}) {
    return score;
  }

  //effects when calculating alliance score of oP
  //args: oP
  allyCalc(score, data = {}) {
    return score;
  }
  //effects from oP when the player is calculating alliance score on them
  //args: tP
  allyCalcOthers(score, data = {}) {
    return score;
  }

  /*-----alliance effects-----*/
  //calculating opinions between alliance member
  allianceUnityUpdate(score, data = {}) {
    return score;
  }
  //calculating opinions between alliance member
  //args:opponent
  allianceOpinionCalc(score, data = {}) {
    return score;
  }
  //alliance disbanded
  allianceDisband(data = {}) {}
  //leaving alliance
  allianceLeave(data = {}) {}
  //calculating whether to leave alliance
  //positive number reduces chances
  allianceLeaveCalc(x, data = {}) {
    return x;
  }

  //showing in the extra info panel
  show_info() {}
}

/*
	this.name = name;
	this.icon = "⚫";
	
	this.sightBonus = 0;
	this.visibilityB = 0;
	
	this.rangeBonus = 0;
	this.fightBonus = 1;
	this.dmgReductionB = 1;
	
	this.peaceBonus=0
	this.aggroBonus=0		
	this.intimidationBonus=0;
	
	this.moveSpeedB = 1;
	
	this.uses = 0;
	this.dmg_type = "";

*/

//pass in number or Array
//if its an array return random number in that range
function processDataNum(num: number | number[]) {
  if (typeof num == "object") {
    return roll_range(num[0], num[1]);
  }
  return num;
}

function setItemIcon(icon: string) {
  return '<img class="item_img" src="' + icon + '"></img>';
}

function get_random_item(tP, item_type) {
  let odds = [];
  if (item_type == "wep") {
    odds = get_weapon_odds(tP);
    log_message(odds);
    return create_weapon(roll(odds));
  }
  if (item_type == "off") {
    odds = get_offhand_odds(tP);
    log_message(odds);
    return create_offhand(roll(odds));
  }
  if (item_type == "food") {
    odds = get_food_odds(tP);
    log_message(odds);
    return create_food(roll(odds));
  }
  return "";
}

export function create_weapon(weapon_name: string, player?: Char) {
  if (weapon_name in weapon_data) {
    if ("class" in weapon_data[weapon_name]) {
      return new weapon_data[weapon_name]["class"]();
    } else {
      return new Weapon(weapon_name);
    }
  }
  return weapon_name;
}

export function create_offhand(offhand_name: string, player?: Char) {
  if (offhand_name in offhand_data) {
    if ("class" in offhand_data[offhand_name]) {
      return new offhand_data[offhand_name]["class"]();
    } else {
      return new Offhand(offhand_name);
    }
  }
  if (offhand_name == "food") {
    let foodOdds = [];
    if (player) foodOdds = get_food_odds(tP);
    else foodOdds = defaultFoodOdds.slice();
    log_message(foodOdds);
    let food_name = roll(foodOdds);
    return create_food(food_name);
  }
  return offhand_name;
}

export function create_food(food_name, player = "") {
  if (food_name in food_data) {
    if ("class" in food_data[food_name]) {
      return new food_data[food_name]["class"]();
    } else {
      return new Food(food_name);
    }
  }
  return food_name;
}
