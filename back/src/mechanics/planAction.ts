import { Char } from "../entities/char";
import { game } from "../game";
import { TerrainType } from "../terrain";
import { fromXY, getTerrain, roll } from "../utils";
import { RestAction, SleepAction } from "./actions";
import { FightAction } from "./combat";
import { LootAction } from "./loot";
import { FollowAction, MoveAction } from "./move";

export function planAction(char: Char) {
  if (char.stats.energy <= 0) {
    // char.setPlannedAction("rest", 20);
    char.setPlannedAction(RestAction, 20);
  }
  const goals: Array<
    [
      {
        goal: TerrainType | Char;
        type:
          | "fight"
          | "loot"
          | "escape"
          | "move"
          | "moveToLoot"
          | "sleep"
          | "follow"
          | "rest"
          | "weaponAction";
      },
      number
    ]
  > = [];
  //move
  if (!char.currentAction) {
    goals.push([{ type: "move", goal: char }, 10]);
    goals.push([
      { type: "rest", goal: char },
      15 * (1 - char.stats.energy / char.stats.maxEnergy),
    ]);
    for (const oChar of char.situation.awareOf) {
      if (!char.situation.inRangeOf.includes(oChar))
        goals.push([
          { goal: oChar, type: "follow" },
          Math.round((200 - oChar.stats.health) / 10) * (game.day / 2),
        ]);
    }
    if (char.equip.weapon && char.equip.weapon.action) {
      goals.push([
        {
          goal: char,
          type: "weaponAction",
        },
        char.equip.weapon.planAction(),
      ]);
    }
  }
  if (char.currentAction?.priority < 2) {
    for (let xy of Array.from(char.situation.vision)) {
      let [x, y] = fromXY(xy);
      let isGoal = false;
      let value = game.map.array[x][y].value;
      let loot = game.map.array[x][y].loot;
      if (
        loot &&
        value &&
        (char.equip.weapon == undefined || char.equip.armor == undefined)
      ) {
        isGoal = true;
      }
      if (isGoal)
        goals.push([
          {
            goal: getTerrain(x, y),
            type: "moveToLoot",
          },
          Math.pow(value + 1, 2) * 10,
        ]);
    }
  }
  if (char.currentAction?.priority < 3) {
    if (
      getTerrain(char.x(), char.y()).loot &&
      (char.equip.weapon == undefined || char.equip.armor == undefined)
    ) {
      goals.push([{ goal: getTerrain(char.x(), char.y()), type: "loot" }, 50]);
    }
    for (const oChar of char.situation.inRangeOf) {
      goals.push([
        { goal: oChar, type: "fight" },
        Math.round((200 - oChar.stats.health) / 10) * (game.day / 2),
      ]);
      goals.push([
        { goal: oChar, type: "escape" },
        Math.round(
          oChar.stats.health /
            char.stats.health /
            (char.stats.health / char.stats.maxHealth) /
            10
        ),
      ]);
    }
  }
  if (
    (((game.hour >= 22 || game.hour < 5) &&
      char.lastAction instanceof SleepAction == false) ||
      char.situation.lastSlept > 24 * 4) &&
    getTerrain(char.x(), char.y()).elevation >= 0
  ) {
    goals.push([
      { type: "sleep", goal: char },
      Math.pow(char.situation.lastSlept / 4 - 16, 2) * 10,
    ]);
  }
  //choose new action
  let goal = roll(goals);
  if (goal) {
    if (goal.type == "fight") {
      char.setPlannedAction(FightAction, 3, {
        target: goal.goal,
      });
    } else if (goal.type == "loot") {
      char.setPlannedAction(LootAction, 3, {
        target: goal.goal,
      });
    } else if (goal.type == "escape") {
      char.setPlannedAction(MoveAction, 3, {
        targetCoords: game.map.getRandomLandPoint(char),
      });
    } else if (goal.type == "sleep") {
      char.setPlannedAction(SleepAction, 3);
    } else if (goal.type == "move") {
      char.setPlannedAction(MoveAction, 1, {
        targetCoords: game.map.getRandomLandPoint(char),
      });
    } else if (goal.type == "moveToLoot") {
      char.setPlannedAction(MoveAction, 2, {
        targetCoords: [goal.goal.x, goal.goal.y],
      });
    } else if (goal.type == "follow") {
      char.setPlannedAction(FollowAction, 2, {
        target: goal.goal,
      });
    } else if (goal.type == "rest") {
      char.setPlannedAction(RestAction, 3);
    } else if (
      goal.type == "weaponAction" &&
      char.equip?.weapon?.action !== undefined
    ) {
      char.setPlannedAction(char.equip.weapon.action, 3);
    }
  }
}
