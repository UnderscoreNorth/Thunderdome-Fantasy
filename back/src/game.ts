import { Char } from "./entities/char";
import { Terrain, TerrainType, TerrainUnseen } from "./terrain";
import { hypD, shuffle } from "./utils";

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
} = {
  chars: [],
  map: new Terrain(20),
  diameter: 20,
  playerDistTable: [],
  baseFightChance: 50,
  basePeaceChance: 50,
  hour: 8,
  day: 1,
  minute: 0,
  radius: 20,
  ready: false,
  timeLength: 17280,
  elapsedTime: 0,
  maxPathFind: 15,
  msg: "",
};
export function generateGame(diameter: number) {
  game.ready = false;
  game.chars = [];
  game.diameter = diameter;
  game.radius = diameter;
  game.map = new Terrain(diameter);
  game.msg = "";
  for (let i = 0; i < 70; i++) {
    let [x, y] = game.map.getRandomLandPoint();
    game.chars.push(
      new Char(
        i.toString(),
        i % 2 == 0 ? "Even Gang" : "Odd Gang",
        "https://cdn.myanimelist.net/images/characters/4/54606.jpg",
        x,
        y,
        "Neutral",
        "Neutral",
        game.chars.length
      )
    );
    console.log("Loading Character: " + i);
  }
  game.ready = true;
}

export function turn() {
  if (!game.ready) return;
  if (game.chars.filter((i) => !i.dead).length <= 1) return;
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
  game.minute += 15;
  if (game.minute == 60) {
    game.minute = 0;
    game.hour += 1;
  }
  if (game.hour == 24) {
    game.hour = 0;
    game.day++;
  }
  game.elapsedTime = game.minute + game.hour * 60 + game.day * 60 * 25;
  game.radius =
    Math.pow((game.timeLength - game.elapsedTime) / game.timeLength, 0.75) *
    game.diameter *
    1.5;
  console.log(game.radius);
  for (let i = game.map.land.length - 1; i >= 0; i--) {
    if (
      hypD(
        game.map.centerX - game.map.land[i][0],
        game.map.centerY - game.map.land[i][1]
      ) > game.radius
    ) {
      game.map.land.splice(i, 1);
    }
  }
  log("Land Reduce");
  let landString = game.map.land.map((x) => x[0] + "," + x[1]);
  for (let x in game.map.array) {
    for (let y in game.map.array) {
      if (
        !landString.includes(x + "," + y) &&
        game.map.array[x][y].elevation >= 0
      ) {
        if (Math.random() > 0.9) game.map.array[x][y].icon = "🔥";
      }
    }
  }
  log("Burn Tiles");
  console.log(timeArr);
  game.ready = true;
  if (game.chars.filter((i) => !i.dead).length <= 1) {
    game.msg = "Game has finished, restarting in 15 minutes";
    setTimeout(() => {
      generateGame(200);
    }, 900000);
  }
  setTimeout(() => {
    turn();
  }, 1000);
  function log(name: string) {
    let time = Math.round(performance.now() - p);
    timeArr[name] = time;
    p = performance.now();
  }
}
export async function toJson() {
  while (!game.ready) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  let map = JSON.parse(JSON.stringify(game.map.array)) as Array<
    Array<TerrainType>
  >;
  /*for (let x = 0; x < game.diameter; x++) {
    for (let y = 0; y < game.diameter; y++) {
      if (!game.map.seen[x][y]) map[x][y] = new TerrainUnseen(0);
    }
  }*/
  return {
    time: {
      minute: game.minute,
      hour: game.hour,
      day: game.day,
    },
    map,
    center: { x: game.map.centerX, y: game.map.centerY },
    diameter: game.diameter,
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
          statusMessage: x.statusMessage,
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
          },
          log: x.log,
          death: x.death,
          path: x?.currentAction?.data,
        };
      }),
  };
}