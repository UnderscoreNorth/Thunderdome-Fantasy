import {
  existsSync,
  lstatSync,
  mkdir,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { Char } from "./entities/char";
import { Terrain, TerrainType, TerrainUnseen } from "./terrain";
import { getTerrain, hypD, shuffle } from "./utils";
import path from "path";
export const newGameData: {
  diameter: number;
  chars: Array<{ name: string; img: string; group: string }>;
  timeLength: number;
  islandNames: string[];
} = {
  diameter: 20,
  chars: [],
  timeLength: 17280,
  islandNames: [],
};
export const game: {
  chars: Array<Char>;
  map: Terrain;
  diameter: number;
  playerDistTable: Array<Array<{ d: number; c: Char }>>;
  baseFightChance: number;
  basePeaceChance: number;
  hour: number;
  day: number;
  minute: number;
  ready: boolean;
  timeLength: number;
  elapsedTime: number;
  maxPathFind: number;
  radius: number;
  msg: string;
  complete: boolean;
  toBurn: Array<TerrainType>;
  name: string;
  newGame: boolean;
  burned: string[];
} = {
  chars: [],
  map: new Terrain(20, []),
  diameter: 20,
  playerDistTable: [],
  baseFightChance: 50,
  basePeaceChance: 50,
  hour: 8,
  day: 1,
  minute: 0,
  radius: 20,
  ready: true,
  timeLength: 17280,
  elapsedTime: 0,
  maxPathFind: 15,
  msg: "",
  complete: false,
  toBurn: [],
  name: "",
  newGame: false,
  burned: [],
};
export function generateGame() {
  game.ready = false;
  game.complete = false;
  game.chars = [];
  game.diameter = newGameData.diameter;
  game.radius = newGameData.diameter;
  game.map = new Terrain(newGameData.diameter, newGameData.islandNames);
  game.timeLength = newGameData.timeLength;
  game.msg = "";
  game.toBurn = [];
  game.day = 1;
  game.hour = 8;
  game.minute = 0;
  game.burned = [];
  game.name = new Date().getTime().toString();
  if (!existsSync("./games/" + game.name)) mkdirSync("./games/" + game.name);
  writeFileSync(
    `./games/${game.name}/map.json`,
    JSON.stringify({
      name: game.name,
      map: game.map.array,
      islands: game.map.islands,
      center: { x: game.map.centerX, y: game.map.centerY },
      diameter: game.diameter,
    })
  );
  for (let char of newGameData.chars) {
    if (typeof char !== "object") continue;
    let [x, y] = game.map.getRandomLandPoint();
    game.chars.push(
      new Char(
        char.name,
        char.group.length ? char.group : game.chars.length.toString(),
        char.img,
        x,
        y,
        "Neutral",
        "Neutral",
        game.chars.length
      )
    );
  }
  game.ready = true;
}

export async function turn() {
  if (!game.ready) return;
  if (game.newGame) {
    game.ready = false;
    game.newGame = false;
    generateGame();
    game.ready = true;
    return;
  }
  let remainingGroups = new Set(
    game.chars.filter((i) => !i.dead).map((i) => i.group)
  ).size;
  console.log("Remaining groups: ", remainingGroups);
  if (remainingGroups <= 1) {
    if (!game.complete) {
      game.complete = true;
      game.msg = "Game has finished, restarting in 15 minutes";
      writeFileSync(
        `./games/${game.name}/${game.day
          .toString()
          .padStart(2, "0")}-${game.hour
          .toString()
          .padStart(2, "0")}-${game.minute.toString().padStart(2, "0")}.json`,
        JSON.stringify(toJson())
      );
      setTimeout(() => {
        generateGame();
      }, 900000);
    }
    return;
  }
  let timeArr: Record<string, number> = {};
  let p = performance.now();
  game.ready = false;
  shuffle(game.chars);
  for (const char of game.chars) {
    char.turnStart();
  }
  log("Turn Start");
  for (const char of game.chars) {
    char.planAction();
  }
  log("Plan Action");
  for (const char of game.chars) {
    char.doAction();
  }
  log("Do Action");
  for (const char of game.chars) {
    char.turnEnd();
  }
  log("Turn End");
  game.elapsedTime = game.minute + game.hour * 60 + game.day * 60 * 24;
  game.radius = Math.max(
    2,
    Math.pow((game.timeLength - game.elapsedTime) / game.timeLength, 0.75) *
      game.diameter *
      0.8
  );
  for (let i = game.map.land.length - 1; i >= 0; i--) {
    let x = game.map.land[i][0];
    let y = game.map.land[i][1];
    if (hypD(game.map.centerX - x, game.map.centerY - y) > game.radius) {
      game.map.land.splice(i, 1);
      game.toBurn.push(getTerrain(x, y));
    }
  }
  for (let i = game.toBurn.length - 1; i >= 0; i--) {
    if (Math.random() > 0.9) {
      game.toBurn[i].icon = "🔥";
      game.toBurn[i].value = 0;
      game.toBurn[i].glow = false;
      game.burned.push(`${game.toBurn[i].x},${game.toBurn[i].y}`);
      game.toBurn.splice(i, 1);
    }
  }
  log("Land Reduce");
  console.log(timeArr);
  writeFileSync(
    `./games/${game.name}/${game.day.toString().padStart(2, "0")}-${game.hour
      .toString()
      .padStart(2, "0")}-${game.minute.toString().padStart(2, "0")}.json`,
    JSON.stringify(toJson())
  );
  game.minute += 15;
  if (game.minute == 60) {
    game.minute = 0;
    game.hour += 1;
  }
  if (game.hour == 24) {
    game.hour = 0;
    game.day++;
  }
  game.ready = true;

  function log(name: string) {
    let time = Math.round(performance.now() - p);
    timeArr[name] = time;
    p = performance.now();
  }
}
export function toJson() {
  return {
    name: game.name,
    burned: game.burned,
    time: {
      minute: game.minute,
      hour: game.hour,
      day: game.day,
    },
    msg: game.msg,
    chars: game.chars
      .sort((a, b) => {
        if (a.group == b.group) {
          return a.name > b.name ? 1 : -1;
        }
        return a.group > b.group ? 1 : -1;
      })
      .map((x) => {
        return {
          name: x.name,
          group: x.group,
          id: x.id,
          img: x.img,
          stats: x.stats,
          situation: {
            x: x.situation.x,
            y: x.situation.y,
            seen: Array.from(x.situation.seen),
            been: Array.from(x.situation.been),
            vision: Array.from(x.situation.vision),
            inRangeOf: x.situation.inRangeOf.map((i) => i.name),
            awareOf: x.situation.awareOf.map((i) => i.name),
          },
          equip: {
            weapon: x.equip?.weapon
              ? Object.assign(x.equip.weapon, {
                  owner: x.name,
                })
              : undefined,
            armor: x.equip?.armor
              ? Object.assign(x.equip.armor, {
                  owner: x.name,
                })
              : undefined,
          },
          log: x.log,
          death: x.death,
          path: x?.currentAction?.data,
        };
      }),
  };
}
export function retrieveJson(id: string) {
  if (game.name == "") return {};
  if (existsSync("./games/" + game.name)) {
    let data = {};
    if (id !== game.name) {
      data = Object.assign(
        data,
        JSON.parse(readFileSync(`./games/${game.name}/map.json`, "utf8"))
      );
    }
    data = Object.assign(
      data,
      JSON.parse(
        readFileSync(
          `./games/${game.name}/${
            readdirSync(`./games/${game.name}`)
              .filter((f) =>
                lstatSync(path.join(`./games/${game.name}`, f)).isFile()
              )
              .map((file) => ({
                file,
                mtime: lstatSync(path.join(`./games/${game.name}`, file)).mtime,
              }))
              .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0].file
          }`,
          "utf8"
        )
      )
    );
    return data;
  } else {
    return {};
  }
}
export function newGame(data: any) {
  newGameData.chars = data.chars;
  newGameData.diameter = data.diameter;
  newGameData.timeLength = data.days * 24 * 60;
  newGameData.islandNames = data.islandNames;
  game.newGame = true;
  turn();
}
