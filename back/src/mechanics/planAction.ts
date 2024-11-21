import { Char } from "../entities/char";
import { game } from "../game";
import { TerrainType } from "../terrain";
import { fromXY, getTerrain, roll } from "../utils";
import {
  FightAction,
  FollowAction,
  MoveAction,
  RestAction,
  SleepAction,
} from "./actions";
import { LootAction } from "./loot";

export function planAction(char: Char) {
  if (char.stats.energy <= 0) {
    // char.setPlannedAction("rest", 20);
    char.setPlannedAction(RestAction, 20);
  }
  let options = [];
  //move
  options.push(["move", 100]);
  if (
    (((game.hour >= 22 || game.hour < 5) &&
      char.lastAction instanceof SleepAction == false) ||
      char.situation.lastSlept > 24 * 4) &&
    getTerrain(char.x(), char.y()).elevation >= 0
  ) {
    options.push([
      "sleep",
      100 * Math.pow(char.situation.lastSlept / 4 - 16, 2),
    ]);
  }
  //choose new action
  let action_option = roll(options);
  if (action_option == "sleep") {
    char.setPlannedAction(SleepAction, 3);
  } else {
    let goals: Array<
      [
        {
          goal: TerrainType | Char;
          type: "fight" | "loot";
        },
        number
      ]
    > = [];
    if (
      getTerrain(char.x(), char.y()).loot &&
      (char.equip.weapon == undefined || char.equip.armor == undefined)
    ) {
      goals.push([{ goal: getTerrain(char.x(), char.y()), type: "loot" }, 500]);
    }
    for (const oChar of char.situation.inRangeOf) {
      goals.push([
        { goal: oChar, type: "fight" },
        Math.round(200 - oChar.stats.health),
      ]);
    }
    if (
      (!char.currentAction || char.currentAction.priority < 3) &&
      goals.length
    ) {
      let goal = roll(goals);
      if (goal.type == "fight") {
        char.setPlannedAction(FightAction, 3, {
          target: goal.goal,
        });
      } else {
        char.setPlannedAction(LootAction, 3, {
          target: goal.goal,
        });
      }
    } else if (!char.currentAction || char.currentAction.priority < 2) {
      let goals: Array<
        [
          {
            goal: TerrainType | Char;
            type: "move" | "follow";
          },
          number
        ]
      > = [];
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
              type: "move",
            },
            value * 10,
          ]);
      }
      for (const oChar of char.situation.awareOf) {
        if (!char.situation.inRangeOf.includes(oChar))
          goals.push([{ goal: oChar, type: "follow" }, 2]);
      }

      if (goals.length) {
        let goal = roll(goals);
        if (goal.goal instanceof TerrainType) {
          char.setPlannedAction(MoveAction, 2, {
            targetCoords: [goal.goal.x, goal.goal.y],
          });
        } else {
          char.setPlannedAction(FollowAction, 2, {
            target: goal.goal,
          });
        }
      }
    }

    if (!char.currentAction) {
      let [x, y] = [0, 0];
      let attempt = 0;
      let numWaterTiles = 0;
      do {
        attempt++;
        [x, y] = game.map.getRandomLandPoint();
        numWaterTiles = game.map.countWaterTilesInPath(
          char.x(),
          char.y(),
          x,
          y
        );
      } while (attempt < 10 && numWaterTiles > 3);
      char.setPlannedAction(MoveAction, 1, {
        targetCoords: game.map.getRandomLandPoint(this),
      });
    }
  }
}
