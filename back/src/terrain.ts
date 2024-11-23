import { Char } from "./entities/char";
import { game } from "./game";
import { MoveAction } from "./mechanics/move";
import {
  changeDirection,
  directions,
  fromXY,
  getNearby,
  getNearByDiag,
  getTerrain,
  hypD,
  roll,
  roll_range,
  shuffle,
} from "./utils";

export class TerrainType {
  public type: string;
  public icon: string;
  public danger: number;
  public fightRangeB: number;
  public moveSpeedB: number;
  public sightB: number;
  public elevation: number;
  public groupID: string;
  public glow: boolean;
  public x: number;
  public y: number;
  public value: number;
  public loot: number;
  constructor(elevation: number, x: number, y: number) {
    this.elevation = elevation;
    this.x = x;
    this.y = y;
    this.value = 0;
    this.loot = 0;
  }
  changeElevation(x: number) {
    if (this.elevation < 7) this.elevation += x * 1;
  }
  terrainCheck(char: Char) {
    if (this.icon == "🔥") {
      char.stats.health -= Math.random() * 5;
      if (char.stats.health <= 0) char.die("perished in the flame");
      if (char.currentAction && char.currentAction.priority < 18) {
        let cX = game.map.centerX;
        let cY = game.map.centerY;
        let d = hypD(char.x() - cX, char.y() - cY);
        let land = game.map.land.map((i) => i[0] + "," + i[1]);
        let i = Math.min(Math.ceil(d), roll_range(4, game.maxPathFind));
        let found = false;
        do {
          let tiles = game.map.getRing(char.x(), char.y(), i);
          tiles.sort((a, b) => {
            return hypD(a[0] - cX, a[1] - cY) - hypD(b[0] - cX, b[1] - cY);
          });
          for (let tile of tiles) {
            if (land.includes(tile.join(","))) {
              if (!found) {
                found = true;
                char.currentAction = new MoveAction({
                  player: char,
                  priority: 18,
                  data: {
                    targetCoords: [tile[0], tile[1]],
                  },
                });
              }
            }
          }
          i++;
        } while (i <= d && !found);
      }
    }
    if (this.elevation == -3) {
      if (Math.random() > 0.99) {
        char.die("drowned");
      }
    }
  }
}
export class TerrainWater extends TerrainType {
  constructor(elevation: number, x: number, y: number) {
    super(elevation, x, y);
    this.danger = 1;
    this.type = "water";
    this.icon = "";
    this.fightRangeB = 0;
    this.moveSpeedB = 0.3;
    this.sightB = 0.75;
  }
}
export class TerrainUnseen extends TerrainType {
  constructor(elevation: number, x: number, y: number) {
    super(elevation, x, y);
    this.danger = 0;
    this.type = "unseen";
    this.icon = "";
    this.fightRangeB = 0;
    this.moveSpeedB = 0;
    this.sightB = 0;
  }
}
export class TerrainForest extends TerrainType {
  constructor(elevation: number, x: number, y: number) {
    super(elevation, x, y);
    this.danger = 0;
    this.type = "tree";
    this.icon = "🌳";
    this.fightRangeB = 1;
    this.moveSpeedB = 0.9;
    this.sightB = 0.5;
  }
}
export class TerrainSand extends TerrainType {
  constructor(elevation: number, x: number, y: number) {
    super(elevation, x, y);
    this.danger = 0;
    this.type = "sand";
    this.fightRangeB = 1;
    this.moveSpeedB = 0.9;
    this.sightB = 0.5;
    this.icon = "";
  }
}
export class TerrainPlains extends TerrainType {
  constructor(elevation: number, x: number, y: number) {
    super(elevation, x, y);
    this.danger = 0;
    this.type = "plain";
    this.icon = "";
    this.fightRangeB = 1;
    this.moveSpeedB = 1;
    this.sightB = 1;
  }
}
export class TerrainMountain extends TerrainType {
  constructor(elevation: number, x: number, y: number) {
    super(elevation, x, y);
    this.danger = 1;
    this.type = "mtn";
    this.icon = "";
    this.fightRangeB = 1;
    this.moveSpeedB = 0.4;
    this.sightB = 2;
  }
}
export class Terrain {
  array: Array<Array<TerrainType>>;
  seen: Array<Array<boolean>>;
  land: Array<[number, number]>;
  lifted: Array<string>;
  diameter: number;
  centerX: number;
  centerY: number;
  islands: Record<string, Array<string>>;
  lakes: Record<string, Array<string>>;
  ocean: Array<string>;
  constructor(diameter: number) {
    this.array = [];
    this.seen = [];
    this.diameter = diameter;
    this.land = [];
    this.islands = {};
    this.lakes = {};
    this.ocean = [];
    //Init gen
    let landXArr = [];
    let landYArr = [];

    for (let x = 0; x < diameter; x++) {
      let row: Array<TerrainType> = [];
      for (let y = 0; y < diameter; y++) {
        row[y] = new TerrainWater(-3, x, y);
      }
      this.array[x] = row;
      this.seen.push(new Array(diameter).fill(false));
    }
    //First land
    let numLand = 0;
    let attempt = 0;
    let minLand = roll_range(3, 5);
    do {
      console.log(`Terrain Generation Island: ${attempt}`);
      attempt++;
      numLand = 0;
      let startX = roll_range(5, diameter - 5);
      let startY = roll_range(5, diameter - 5);
      let startingLimit = roll_range(8, 10) / 10;
      //Land Lift
      for (let i = 0; i < 3; i++) {
        this.lifted = [];

        this.raiseGround(
          startX,
          startY,
          startingLimit - Math.pow(i * 0.05, 2),
          0.5,
          -1,
          2
        );
      }
      //Mountains
      if (Math.random() > 0.05) {
        let rangeLength = roll_range(3, this.diameter / 2);
        if (rangeLength <= 5) {
          let mountainHeight = roll_range(5, 7);
          this.lifted = [];
          this.array[startX][startY].elevation = mountainHeight;
          this.raiseNearby(startX, startY, 10);
        } else {
          let dir = roll_range(0, 7);
          let j = 0;
          do {
            this.lifted = [];
            j++;
            startX += directions[dir][0];
            startY += directions[dir][1];
            let edgeDistance = this.getEdgeDistance(startX, startY);
            if (edgeDistance <= 5) break;
            if (!this.array?.[startX]?.[startY]) break;
            let mountainHeight = roll_range(3, 5);
            this.array[startX][startY].elevation = mountainHeight - 1;
            this.raiseGround(
              startX,
              startY,
              1,
              roll_range(2, 4) / 10,
              -1,
              mountainHeight
            );
            dir = changeDirection(
              dir,
              roll([
                [-1, 1],
                [0, 3],
                [1, 1],
              ])
            );
          } while (j < rangeLength);
        }
      }

      //Cleaning up some of the lonely water tiles
      for (let x = 0; x < diameter; x++) {
        for (let y = 0; y < diameter; y++) {
          if (this.array[x][y].elevation < 0) {
            let clean = [
              getNearby(x, y)
                .map((i) => {
                  if (this.array?.[i[0]]?.[i[1]]?.elevation >= 0) return false;
                  return true;
                })
                .filter((x) => x).length == 0,
              Math.random() > 0.5,
            ];
            if (clean[0] && clean[1]) {
              this.array[x][y] = new TerrainPlains(0, x, y);
            }
          }
        }
      }
      landXArr = [];
      landYArr = [];
      this.land = [];
      for (let x = 0; x < diameter; x++) {
        for (let y = 0; y < diameter; y++) {
          if (
            this.array[x][y].elevation >= 0 &&
            this.array[x][y].elevation <= 2
          ) {
            this.array[x][y] = new TerrainPlains(
              this.array[x][y].elevation,
              x,
              y
            );
          } else if (this.array[x][y].elevation > 2) {
            this.array[x][y] = new TerrainMountain(
              this.array[x][y].elevation,
              x,
              y
            );
          }
          if (this.array[x][y].elevation >= 0) {
            this.land.push([x, y]);
            numLand++;
            landXArr.push(x);
            landYArr.push(y);
          }
        }
      }
      console.log(
        "Land %: " +
          Math.round((numLand / (Math.pow(this.diameter, 2) / minLand)) * 100)
      );
    } while (
      numLand < (this.diameter * this.diameter) / minLand &&
      attempt < 1000
    );

    //Determining Islands
    let change = false;
    do {
      change = false;
      for (let x = 0; x < diameter; x++) {
        for (let y = 0; y < diameter; y++) {
          let tile = this.array[x][y];
          if (tile.elevation >= 0) {
            let nearby = getNearby(x, y);
            let found = false;
            for (const [x2, y2] of nearby) {
              let nearbyTile = this.array?.[x2]?.[y2];
              if (
                nearbyTile !== undefined &&
                nearbyTile.elevation >= 0 &&
                !found &&
                nearbyTile.groupID !== undefined &&
                nearbyTile.groupID !== tile.groupID
              ) {
                let oldGroupID = tile.groupID;
                if (oldGroupID == undefined) {
                  tile.groupID = nearbyTile.groupID;
                } else {
                  for (let x3 = 0; x3 < diameter; x3++) {
                    for (let y3 = 0; y3 < diameter; y3++) {
                      if (this.array[x3][y3].groupID == oldGroupID) {
                        this.array[x3][y3].groupID = nearbyTile.groupID;
                      }
                    }
                  }
                }

                found = true;
                change = true;
              }
              if (!found && tile.groupID == undefined)
                tile.groupID = `${x},${y}`;
            }
          }
        }
      }
    } while (change);
    for (let x = 0; x < diameter; x++) {
      for (let y = 0; y < diameter; y++) {
        let tile = this.array[x][y];
        if (tile.groupID) {
          if (this.islands[tile.groupID] == undefined)
            this.islands[tile.groupID] = [];
          this.islands[tile.groupID].push(`${x},${y}`);
        }
      }
    }
    //Grouping smaller islands
    change = false;
    do {
      change = false;
      for (let name in this.islands) {
        let tiles = this.islands[name];
        if (tiles.length < 50) {
          let newName = name;
          for (let xy of tiles) {
            let [x, y] = fromXY(xy);
            let nearBy = this.getRing(x, y, 2);
            nearBy = nearBy.concat(this.getRing(x, y, 3));
            for (const [x2, y2] of nearBy) {
              let oTile = this.array[x2][y2];
              if (oTile && oTile.elevation >= 0 && oTile.groupID !== name) {
                newName = oTile.groupID;
              }
            }
          }
          if (newName !== name) {
            change = true;
            for (let xy of tiles) {
              let [x, y] = fromXY(xy);
              this.array[x][y].groupID = newName;
              this.islands[newName].push(xy);
            }
            delete this.islands[name];
          }
        }
      }
    } while (change);

    let prefix = [
      "Horai",
      "Macross",
      "Chasm",
      "Kuril",
      "Nanpo",
      "Ryukyu",
      "Shikoku",
      "Honshu",
      "Uguu",
      "Kanto",
      "Kyuushuu",
      "Okinawa",
      "Cinnabar",
      "Greed",
      "Aincrad",
      "The Lost",
      `Roshi's `,
      "Zevil",
      "Boin",
      "Taiga",
      "Ami",
      "Minori",
    ];
    shuffle(prefix);
    for (let name in this.islands) {
      let tiles = this.islands[name];
      let newName = "";
      if (tiles.length > 50) {
        do {
          if (prefix.length) {
            newName = prefix[0];
            prefix.shift();
          } else {
            newName = name;
          }
        } while (this.islands[newName] !== undefined);
      } else {
        newName = "--" + name;
      }
      for (const xy of tiles) {
        let [x, y] = fromXY(xy);
        this.array[x][y].groupID = newName;
      }
      this.islands[newName] = tiles;
      delete this.islands[name];
    }
    console.log("Number of islands: " + Object.values(this.islands).length);
    //Determining Lakes
    change = false;
    do {
      change = false;
      for (let x = 0; x < diameter; x++) {
        for (let y = 0; y < diameter; y++) {
          let tile = this.array[x][y];
          if (tile.elevation < 0) {
            let nearby = [
              [x - 1, y],
              [x - 1, y + 1],
              [x, y + 1],
            ];
            let found = false;
            for (const [x2, y2] of nearby) {
              let nearbyTile = this.array?.[x2]?.[y2];
              if (
                nearbyTile !== undefined &&
                nearbyTile.elevation < 0 &&
                !found &&
                nearbyTile.groupID !== undefined &&
                nearbyTile.groupID !== tile.groupID
              ) {
                let oldGroupID = tile.groupID;
                if (oldGroupID == undefined) {
                  tile.groupID = nearbyTile.groupID;
                } else {
                  for (let x3 = 0; x3 < diameter; x3++) {
                    for (let y3 = 0; y3 < diameter; y3++) {
                      if (this.array[x3][y3].groupID == oldGroupID) {
                        this.array[x3][y3].groupID = nearbyTile.groupID;
                      }
                    }
                  }
                }

                found = true;
                change = true;
              }
              if (!found && tile.groupID == undefined)
                tile.groupID = `${x},${y}`;
            }
          }
        }
      }
    } while (change);
    for (let x = 0; x < diameter; x++) {
      for (let y = 0; y < diameter; y++) {
        let tile = this.array[x][y];
        if (tile.groupID) {
          if (this.lakes[tile.groupID] == undefined)
            this.lakes[tile.groupID] = [];
          this.lakes[tile.groupID].push(`${x},${y}`);
        }
      }
    }

    this.ocean = Object.values(this.lakes).sort(
      (a, b) => b.length - a.length
    )[0];
    this.centerX = Math.round(diameter / 2);
    this.centerY = Math.round(diameter / 2);
    //Beaches
    let numBeaches = roll_range(7, 15);
    this.lifted = [];
    shuffle(this.land);
    for (let n in this.land) {
      let [x, y] = this.land[n];
      let nearOcean = getNearByDiag(x, y).filter(([x2, y2]) => {
        let xy = `${x2},${y2}`;
        if (this.array?.[x2]?.[y2] !== undefined && this.ocean.includes(xy))
          return true;
        return false;
      }).length;
      if (nearOcean && this.array[x][y].elevation == 0) {
        numBeaches--;
        this.spreadBeach(x, y, 0.99, "beach");
        if (numBeaches == 0) break;
      }
    }
    numBeaches = roll_range(35, 50);
    this.lifted = [];
    shuffle(this.land);
    for (let n in this.land) {
      let [x, y] = this.land[n];
      let nearOcean = getNearByDiag(x, y).filter(([x2, y2]) => {
        let xy = `${x2},${y2}`;
        if (this.array?.[x2]?.[y2] !== undefined && this.ocean.includes(xy))
          return true;
        return false;
      }).length;
      if (nearOcean && this.array[x][y].elevation == 0) {
        numBeaches--;
        this.spreadBeach(x, y, 0.99, "land");
        if (numBeaches == 0) break;
      }
    }
    console.log("Beaches generated");
    for (let [x, y] of this.land) {
      if (this.array[x][y].elevation == 0) {
        this.array[x][y].elevation = 0.5;
      } else if (this.array[x][y].elevation == 0.5) {
        this.array[x][y].elevation = 0;
      }
    }
    //Forests
    let minForests = roll_range(minLand * 3, minLand * 5);
    attempt = 0;
    do {
      attempt++;
      console.log("Forest " + attempt);
      let [x, y] = this.getRandomLandPoint();
      this.lifted = [];
      this.spreadTree(x, y, roll_range(5, 10) / 10, -1);
    } while (attempt < minForests);
    console.log("Forests generated");
    //Locations
    this.populateLocations(
      "cave",
      [3, 5],
      3,
      Math.ceil(Math.pow(this.diameter, 2) / 100),
      1,
      [0, 2],
      (x, y) => {
        let tile = this.array[x][y];
        return (
          this.getRing(x, y, 1).filter(
            ([x2, y2]) => this.array[x2][y2].elevation < tile.elevation
          ).length > 0
        );
      }
    );
    this.populateLocations(
      "hut",
      [0, 2],
      10,
      Math.ceil(Math.pow(this.diameter, 2) / 50),
      1,
      [1, 2]
    );
    this.populateLocations("tower", [4, 7], 5, 5, 2, [1, 1]);
    for (let x = 0; x < this.diameter; x++) {
      for (let y = 0; y < this.diameter; y++) {
        let tile = this.array[x][y];
        if (!["🔥", "🌳"].includes(tile.icon)) tile.glow = true;
      }
    }
    console.log("Locations generated");
    let d = 1;
    while (
      this.array[this.centerX][this.centerY].elevation < 0 &&
      d < this.diameter
    ) {
      for (const [x2, y2] of this.getRing(this.centerX, this.centerY, d)) {
        if (this.array[x2][y2].elevation >= 0) {
          this.centerX = x2;
          this.centerY = y2;
        }
      }
      d++;
    }
    this.array[this.centerX][this.centerY].icon = "center";
    console.log(
      `Center: [${this.centerX},${this.centerY}]`,
      this.array[this.centerX][this.centerY]
    );
  }
  getEdgeDistance(x: number, y: number) {
    return (
      this.diameter / 2 -
      Math.max(Math.abs(this.diameter / 2 - x), Math.abs(this.diameter / 2 - y))
    );
  }
  populateLocations(
    type: string,
    elevations: number[],
    min: number,
    max: number,
    value: number,
    loot: [number, number],
    condition?: (x: number, y: number) => boolean
  ) {
    let tiles: Array<TerrainType> = [];
    for (let x = 0; x < this.diameter; x++) {
      for (let y = 0; y < this.diameter; y++) {
        let tile = this.array[x][y];
        if (
          tile.elevation >= elevations[0] &&
          tile.elevation <= elevations[0]
        ) {
          if (condition !== undefined && !condition(x, y)) continue;
          tiles.push(tile);
        }
      }
    }
    shuffle(tiles);
    for (let i = 0; i < roll_range(min, max); i++) {
      if (tiles[i]) {
        tiles[i].icon = type;
        tiles[i].value = value;
        tiles[i].loot = roll_range(loot[0], loot[1]);
      }
    }
  }
  raiseGround(
    x: number,
    y: number,
    spread: number,
    decay: number,
    direction: number,
    limit: number
  ) {
    if (x == 0 || y == 0 || x == this.diameter - 1 || y == this.diameter - 1)
      return;
    if (this.array[x][y].elevation >= limit) return;
    let edgeDistance = this.getEdgeDistance(x, y);
    this.array[x][y].changeElevation(1);
    this.lifted.push(`${x},${y}`);
    for (let i in getNearby(x, y)) {
      const [x2, y2] = getNearby(x, y)[i];
      let chance = Math.random();
      if (parseInt(i) == direction) chance += 0.2;
      if (
        spread > chance &&
        !this.lifted.includes(`${x2},${y2}`) &&
        this.array?.[x2]?.[y2] &&
        this.array[x2][y2].elevation < limit
      ) {
        spread *= Math.random() * decay + 0.72;
        if (edgeDistance <= 3) {
          spread *= (3 - edgeDistance) / 3;
        }
        if (spread > 1) spread = 1;
        this.raiseGround(x2, y2, spread, decay, parseInt(i), limit);
      } else {
      }
    }
  }
  raiseNearby(x: number, y: number, limit: number) {
    limit--;
    if (
      x == 0 ||
      y == 0 ||
      x == this.diameter - 1 ||
      y == this.diameter - 1 ||
      limit == 0
    )
      return;
    let xy = `${x},${y}`;
    if (this.lifted.includes(xy)) return;
    this.lifted.push(xy);
    let tile = this.array[x][y];
    for (let [x2, y2] of getNearby(x, y)) {
      let otherTile = this.array?.[x2]?.[y2];
      if (otherTile !== undefined) {
        if (otherTile.elevation < tile.elevation) {
          otherTile.elevation = roll_range(tile.elevation - 1, tile.elevation);
          this.raiseNearby(x2, y2, limit);
        }
      }
    }
  }
  spreadBeach(x: number, y: number, spread: number, type: "beach" | "land") {
    if (x == 0 || y == 0 || x == this.diameter - 1 || y == this.diameter - 1)
      return;
    if (this.array[x][y].elevation !== 0) return;
    this.array[x][y] =
      type == "beach"
        ? new TerrainSand(0.5, x, y)
        : new TerrainPlains(0.5, x, y);
    this.lifted.push(`${x},${y}`);
    for (let i in getNearByDiag(x, y)) {
      const [x2, y2] = getNearByDiag(x, y)[i];
      let chance = Math.random();
      let nearByOcean = getNearByDiag(x2, y2).filter(([x3, y3]) => {
        let xy = `${x3},${y3}`;
        if (this.array?.[x3]?.[y3] !== undefined && this.ocean.includes(xy))
          return true;
        return false;
      }).length;
      chance += 0.1 * nearByOcean;
      spread += 0.1 * nearByOcean;
      if (
        spread > chance &&
        !this.lifted.includes(`${x2},${y2}`) &&
        this.array?.[x2]?.[y2]
      ) {
        spread -= 0.33;
        if (spread > 1) spread = 1;
        this.spreadBeach(x2, y2, spread, type);
      } else {
      }
    }
  }
  spreadTree(x: number, y: number, spread: number, direction: number) {
    if (x == 0 || y == 0 || x == this.diameter - 1 || y == this.diameter - 1)
      return;
    if (this.array[x][y].type !== "plain") return;
    this.array[x][y] = new TerrainForest(this.array[x][y].elevation, x, y);
    this.lifted.push(`${x},${y}`);
    for (let i in getNearby(x, y)) {
      const [x2, y2] = getNearby(x, y)[i];
      let chance = Math.random();
      if (parseInt(i) == direction) chance += 0.2;
      if (
        spread > chance &&
        !this.lifted.includes(`${x2},${y2}`) &&
        this.array?.[x2]?.[y2]
      ) {
        spread *= Math.random() * 0.5 + 0.72;
        if (spread > 1) spread = 1;
        this.spreadTree(x2, y2, spread, parseInt(i));
      } else {
      }
    }
  }

  getRandomLandPoint(char?: Char): [number, number] {
    let [x, y] = [1, 1];
    if (char) {
      let tiles = this.islands[this.array?.[char.x()]?.[char.y()]?.groupID];
      if (tiles !== undefined) {
        let options: Array<[any, number]> = [["leave", 20]];
        for (let xy of tiles) {
          let [x2, y2] = fromXY(xy);
          if (Math.abs(char.x() - x2) > game.maxPathFind) continue;
          if (Math.abs(char.y() - y2) > game.maxPathFind) continue;
          if (!char.situation.been.has(xy)) options.push([xy, 1]);
        }
        let res = roll(options);
        if (res !== "leave") {
          return res.split(",") as [number, number];
        }
      }

      let cX = game.map.centerX;
      let cY = game.map.centerY;
      let d = hypD(char.x() - cX, char.y() - cY);
      let land = game.map.land.map((i) => i[0] + "," + i[1]);
      let i = Math.min(Math.ceil(d), 4);
      let found = false;
      do {
        let tiles = game.map.getRing(char.x(), char.y(), i);
        tiles.sort((a, b) => {
          return hypD(a[0] - cX, a[1] - cY) - hypD(b[0] - cX, b[1] - cY);
        });
        for (let tile of tiles) {
          if (land.includes(tile.join(","))) {
            found = true;
            [x, y] = tile;
          }
        }
        i++;
      } while (i <= d && !found);
      return [x, y];
    } else {
      let x = this.centerX;
      let y = this.centerY;
      let attempts = 0;
      let islandSize = 0;
      let [newX, newY] = [x, y];
      do {
        [newX, newY] = this.land.sort(() => Math.random() - 0.5)[0];
        islandSize = this.islands[this.array[newX][newY].groupID]?.length ?? 0;
        attempts++;
      } while (
        islandSize < 50 &&
        attempts < 10 &&
        hypD(newX - x, newY - newY) <= (game?.radius ?? this.diameter)
      );
      if (islandSize > 50) [x, y] = [newX, newY];
      return [x, y];
    }
  }
  countWaterTilesInPath(x1: number, y1: number, x2: number, y2: number) {
    return this.getTilesBetween(x1, y1, x2, y2).filter((x) => x.type == "water")
      .length;
  }
  canSee(x1: number, y1: number, x2: number, y2: number) {
    let elevation = this.array[x1][y1].elevation;
    let targetElevation = this.array[x2][y2].elevation;
    if (elevation < 0) elevation = -1;
    if (targetElevation < 0) targetElevation = -1;
    let tiles = this.getTilesBetween(x1, y1, x2, y2);
    let d = hypD(x1 - x2, y1 - y2);
    if (elevation >= targetElevation) {
      elevation += 1;
      let filteredTiles = tiles.filter((x, i) => {
        let e = x.elevation;
        if (x.icon == "🌳") e += 0.5;
        if (e < 0) e = -1;
        e += i * (0.2 / (elevation - x.elevation));
        if (e > elevation || e > targetElevation + 1) return true;
        return false;
      });
      return !filteredTiles.length && d <= (elevation - targetElevation) * 5;
    } else {
      let filteredTiles = tiles.filter((x) => {
        let e = x.elevation;
        if (e < 0) e = -1;
        return e >= targetElevation;
      });
      if (filteredTiles.length == 1)
        return (
          d / (Math.abs(elevation - targetElevation) + 1) <=
          3 + targetElevation * 2
        );
      return false;
    }
  }
  getTime(tiles: TerrainType[]) {
    let arr = tiles.map((i) => {
      return {
        speed: 1 / Math.pow(i.moveSpeedB, 2),
        x: i.x,
        y: i.y,
      };
    });
    for (let i = 1; i <= arr.length - 1; i++) {
      let d = hypD(arr[i].x - arr[i - 1].x, arr[i].y - arr[i - 1].y);
      arr[i - 1].speed *= d;
    }
    return arr.map((x) => x.speed).reduce((a, b) => a + b, 0);
  }
  getTilesBetween(x1: number, y1: number, x2: number, y2: number) {
    let xDiff = x2 - x1;
    let yDiff = y2 - y1;
    let d = Math.ceil(hypD(xDiff, yDiff));
    let added: Set<string> = new Set();
    let tiles: Array<TerrainType> = [];
    for (let i = 1; i <= d; i += 0.5) {
      let x = Math.round(x1 + (xDiff * i) / d);
      let y = Math.round(y1 + (yDiff * i) / d);
      let xy = `${x},${y}`;
      if (!added.has(xy)) {
        added.add(xy);
        tiles.push(this.array[x][y]);
      }
    }
    return tiles;
  }
  getRing(x: number, y: number, d: number) {
    let arr: Array<[number, number]> = [];
    for (let i = x - d; i <= x + d; i++) {
      if (this.array?.[i]?.[y + d]) arr.push([i, y + d]);
    }
    for (let i = y + d - 1; i > y - d; i--) {
      if (this.array?.[x + d]?.[i]) arr.push([x + d, i]);
    }
    for (let i = x - d; i <= x + d; i++) {
      if (this.array?.[i]?.[y - d]) arr.push([i, y - d]);
    }
    for (let i = y + d - 1; i > y - d; i--) {
      if (this.array?.[x - d]?.[i]) arr.push([x - d, i]);
    }
    return arr;
  }
}
