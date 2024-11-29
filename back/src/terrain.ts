import { Char } from "./entities/char";
import { game } from "./game";
import { MoveAction } from "./mechanics/move";
import {
  changeDirection,
  direction,
  fromCube,
  roll,
  roll_range,
  shuffle,
  toCube,
} from "./utils";

export type Cube = {
  q: number;
  s: number;
  r: number;
};

export class TerrainType {
  public type: string;
  public icon: string;
  public moveCost: number;
  public elevation: number;
  public groupID: string;
  public glow: boolean;
  public q: number;
  public s: number;
  public r: number;
  public value: number;
  public loot: number;
  constructor(elevation: number, q: number, s: number, r: number) {
    this.elevation = elevation;
    this.q = q;
    this.s = s;
    this.r = r;
    if (q + s + r !== 0) {
      console.trace("yeah");
      throw `${q} ${s} ${r} is not a valid coord`;
    }
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
        /*let cX = game.map.centerX;
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
        } while (i <= d && !found);*/
        char.currentAction = new MoveAction({
          player: char,
          priority: 18,
          data: {
            targetCoords: game.map.getRandomLandPoint(),
          },
        });
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
  constructor(elevation: number, q: number, s: number, r: number) {
    super(elevation, q, s, r);
    this.type = "water";
    this.icon = "";
    this.moveCost = 5;
  }
}
export class TerrainForest extends TerrainType {
  constructor(elevation: number, q: number, s: number, r: number) {
    super(elevation, q, s, r);
    this.type = "tree";
    this.icon = "🌳";
    this.moveCost = 1.1;
  }
}
export class TerrainSand extends TerrainType {
  constructor(elevation: number, q: number, s: number, r: number) {
    super(elevation, q, s, r);
    this.type = "sand";
    this.moveCost = 1.1;
    this.icon = "";
  }
}
export class TerrainPlains extends TerrainType {
  constructor(elevation: number, q: number, s: number, r: number) {
    super(elevation, q, s, r);
    this.type = "plain";
    this.icon = "";
    this.moveCost = 1;
  }
}
export class TerrainMountain extends TerrainType {
  constructor(elevation: number, q: number, s: number, r: number) {
    super(elevation, q, s, r);
    this.type = "mtn";
    this.icon = "";
    this.moveCost = 3;
  }
}
export class Terrain {
  tiles: Record<string, TerrainType>;
  land: Array<Cube>;
  water: Array<Cube>;
  lifted: Array<string>;
  diameter: number;
  center: {
    q: number;
    s: number;
    r: number;
  };
  islands: Record<string, Array<string>>;
  lakes: Record<string, Array<string>>;
  ocean: Array<string>;
  constructor(diameter: number, islandNames: string[]) {
    this.tiles = {};
    this.diameter = diameter;
    this.land = [];
    this.water = [];
    this.islands = {};
    this.lakes = {};
    this.ocean = [];
    this.center = { q: 0, s: 0, r: 0 };
    //Init gen
    for (let q = -diameter; q <= diameter; q++) {
      for (let s = -diameter; s <= diameter; s++) {
        if (q + s > diameter || q + s < -diameter) continue;
        this.tiles[fromCube({ q, s, r: -q - s })] = new TerrainWater(
          -3,
          q,
          s,
          -q - s
        );
      }
    }
    //First land
    let numLand = 0;
    let attempt = 0;
    let minLand = roll_range(3, 5);

    do {
      console.log(`Terrain Generation Island: ${attempt}`);
      attempt++;
      numLand = 0;
      let q = roll_range(-diameter + 10, diameter - 10);
      let s = roll_range(
        -(Math.abs(diameter) - Math.abs(q)),
        Math.abs(diameter) - Math.abs(q)
      );
      let r = -q - s;
      let cood = { q, s, r };
      let startingLimit = roll_range(8, 10) / 10;
      //Land Lift
      for (let i = -3; i < 3; i++) {
        this.lifted = [];

        this.raiseGround(
          cood,
          startingLimit - Math.pow(i * 0.05, 2),
          0.5,
          -1,
          2
        );
      }
      //Mountains
      if (Math.random() > 0.66) {
        let rangeLength = roll_range(3, this.diameter);
        if (rangeLength <= 5) {
          let mountainHeight = roll_range(5, 7);
          this.lifted = [];
          this.tiles[fromCube(cood)].elevation = mountainHeight;
          this.raiseNearby(cood, 5);
        } else {
          let dir = roll_range(0, 5);
          let j = 0;
          do {
            this.lifted = [];
            j++;
            cood = direction(cood, dir);
            let edgeDistance = this.getDistance(cood, this.center);
            if (edgeDistance > this.diameter) break;
            let mountainHeight = roll_range(3, 5);
            this.tiles[fromCube(cood)].elevation = mountainHeight - 1;
            this.raiseGround(
              cood,
              1,
              roll_range(0, 4) / 10,
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
      for (let qsr in this.tiles) {
        const tile = this.tiles[qsr];
        let nearbyLand = this.getRing(tile.q, tile.s, tile.r, 1).filter(
          (i) => i.elevation - 1 == tile.elevation
        ).length;
        if (nearbyLand == 6 && Math.random() > 0.1) {
          this.tiles[qsr].elevation++;
        }
      }
      this.land = [];
      this.water = [];
      for (let qsr in this.tiles) {
        const tile = this.tiles[qsr];
        if (tile.elevation >= 0) {
          if (tile.elevation <= 2) {
            this.tiles[qsr] = new TerrainPlains(
              tile.elevation,
              tile.q,
              tile.s,
              tile.r
            );
          } else {
            this.tiles[qsr] = new TerrainMountain(
              tile.elevation,
              tile.q,
              tile.s,
              tile.r
            );
          }
          this.land.push(toCube(qsr));
          numLand++;
        } else {
          this.water.push(toCube(qsr));
        }
      }
      console.log(
        "Land %: " +
          Math.round(
            (numLand /
              ((3 * Math.pow(this.diameter, 2) - 3 * this.diameter + 1) /
                minLand)) *
              100
          )
      );
    } while (
      numLand <
        (3 * Math.pow(this.diameter, 2) - 3 * this.diameter + 1) / minLand &&
      attempt < 1000
    );
    //Determining Islands
    let change = false;
    console.log("Num of land tiles ", Object.values(this.land).length);
    let ungrouped = [...this.land].map((i) => fromCube(i));
    shuffle(ungrouped);
    do {
      let qrs = ungrouped[0];
      const tile = this.tiles[qrs];
      tile.groupID = qrs;
      ungrouped.splice(ungrouped.indexOf(qrs), 1);
      let d = 1;
      let found = false;
      do {
        found = false;
        for (const neighbor of this.getRing(tile.q, tile.s, tile.r, d)) {
          const neighborGroup = this.getRing(
            neighbor.q,
            neighbor.s,
            neighbor.r,
            1
          ).filter((i) => i.groupID == qrs).length;
          if (
            neighbor.elevation >= 0 &&
            neighbor.groupID == undefined &&
            neighborGroup > 0
          ) {
            neighbor.groupID = qrs;
            found = true;
            ungrouped.splice(ungrouped.indexOf(fromCube(neighbor)), 1);
          }
        }
        d++;
      } while (found);
      do {
        found = false;
        for (let i = 1; i < d; i++) {
          for (const neighbor of this.getRing(tile.q, tile.s, tile.r, i)) {
            const neighborGroup = this.getRing(
              neighbor.q,
              neighbor.s,
              neighbor.r,
              1
            ).filter((i) => i.groupID == qrs).length;
            if (
              neighbor.elevation >= 0 &&
              neighbor.groupID == undefined &&
              neighborGroup > 0
            ) {
              found = true;
              neighbor.groupID = qrs;
              ungrouped.splice(ungrouped.indexOf(fromCube(neighbor)), 1);
            }
          }
        }
      } while (found);
    } while (ungrouped.length);
    for (let qsr in this.tiles) {
      const tile = this.tiles[qsr];
      if (tile.groupID && tile.elevation >= 0) {
        if (this.islands[tile.groupID] == undefined)
          this.islands[tile.groupID] = [];
        this.islands[tile.groupID].push(qsr);
      }
    }
    //Grouping smaller islands
    /*change = false;
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
    } while (change);*/
    shuffle(islandNames);
    let islands: Array<{ s: number; name: string }> = [];
    for (let name in this.islands) {
      let tiles = this.islands[name];
      islands.push({ s: tiles.length, name });
    }
    islands.sort((a, b) => {
      return b.s - a.s;
    });
    for (let i = 0; i < islands.length; i++) {
      let island = islands[i];
      let newName = "";
      if (islandNames.length && island.s >= 50) {
        newName = islandNames.splice(0, 1)[0];
      } else {
        newName = "--" + island.name;
      }
      this.islands[newName] = this.islands[island.name];
      for (const qsr of this.islands[newName]) {
        this.tiles[qsr].groupID = newName;
      }
      delete this.islands[island.name];
    }
    console.log(
      "Number of islands: " + Object.values(this.islands).map((i) => i.length)
    );
    //Determining Lakes
    ungrouped = [...this.water].map((i) => fromCube(i));
    do {
      let qrs = ungrouped[0];
      const tile = this.tiles[qrs];
      tile.groupID = qrs;
      ungrouped.splice(ungrouped.indexOf(qrs), 1);
      let d = 1;
      let found = false;
      do {
        found = false;
        for (const neighbor of this.getRing(tile.q, tile.s, tile.r, d)) {
          const neighborGroup = this.getRing(
            neighbor.q,
            neighbor.s,
            neighbor.r,
            1
          ).filter((i) => i.groupID == qrs).length;
          if (
            neighbor.elevation < 0 &&
            neighbor.groupID == undefined &&
            neighborGroup
          ) {
            neighbor.groupID = qrs;
            found = true;
            ungrouped.splice(ungrouped.indexOf(fromCube(neighbor)), 1);
          }
        }
        d++;
      } while (found);
    } while (ungrouped.length);
    for (let qsr in this.tiles) {
      const tile = this.tiles[qsr];
      if (tile.groupID && tile.elevation < 0) {
        if (this.lakes[tile.groupID] == undefined)
          this.lakes[tile.groupID] = [];
        this.lakes[tile.groupID].push(qsr);
      }
    }

    this.ocean = Object.values(this.lakes).sort(
      (a, b) => b.length - a.length
    )[0];
    console.log("Ocean size:", Object.keys(this.ocean).length);
    let found = false;
    let d = 0;
    do {
      const tiles = this.getRing(0, 0, 0, d);
      for (const tile of tiles) {
        if (tile.elevation >= 0) {
          found = true;
          this.center = { q: tile.q, s: tile.s, r: tile.r };
        }
      }
      d++;
    } while (!found);
    //Beaches
    let numBeaches = roll_range(7, 15);
    this.lifted = [];
    shuffle(this.land);
    for (let cood of this.land) {
      let tile = this.tiles[fromCube(cood)];
      let nearOcean = this.getRing(cood.q, cood.s, cood.r, 1).filter((i) =>
        this.ocean.includes(fromCube(i))
      ).length;
      if (nearOcean && tile.elevation == 0) {
        numBeaches--;
        this.spreadBeach(tile, 0.99, "beach");
        if (numBeaches == 0) break;
      }
    }
    numBeaches = roll_range(35, 50);
    this.lifted = [];
    shuffle(this.land);
    for (let cood of this.land) {
      let tile = this.tiles[fromCube(cood)];
      let nearOcean = this.getRing(cood.q, cood.s, cood.r, 1).filter((i) =>
        this.ocean.includes(fromCube(i))
      ).length;
      if (nearOcean && tile.elevation == 0) {
        numBeaches--;
        this.spreadBeach(tile, 0.99, "land");
        if (numBeaches == 0) break;
      }
    }
    console.log("Beaches generated");
    for (let cood of this.land) {
      const tile = this.tiles[fromCube(cood)];
      if (tile.elevation == 0) {
        tile.elevation = 0.5;
      } else if (tile.elevation == 0.5) {
        tile.elevation = 0;
      }
    }
    //Forests
    let minForests = roll_range(minLand * 3, minLand * 5);
    attempt = 0;
    do {
      attempt++;
      console.log("Forest " + attempt);
      let cood = this.getRandomLandPoint();
      this.lifted = [];
      this.spreadTree(cood, roll_range(5, 10) / 10, -1);
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
      (tile) => {
        return (
          this.getRing(tile.q, tile.s, tile.r, 1).filter(
            (oTile) => oTile.elevation < tile.elevation
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
    console.log("Locations generated");
    this.tiles[fromCube(this.center)].icon = "center";
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
    condition?: (cood: TerrainType) => boolean
  ) {
    let tiles: Array<TerrainType> = [];
    for (let qsr in this.tiles) {
      const tile = this.tiles[qsr];
      if (tile.elevation >= elevations[0] && tile.elevation <= elevations[0]) {
        if (condition !== undefined && !condition(tile)) continue;
        tiles.push(tile);
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
    cood: Cube,
    spread: number,
    decay: number,
    direction: number,
    limit: number
  ) {
    if (this.tiles[fromCube(cood)].elevation >= limit) return;
    let edgeDistance = this.getDistance(cood, this.center);
    this.tiles[fromCube(cood)].changeElevation(1);
    this.lifted.push(fromCube(cood));
    const tiles = this.getRing(cood.q, cood.s, cood.r, 1, true);
    for (let i in tiles) {
      const tile = tiles[i];
      let chance = Math.random();
      if (parseInt(i) == direction) chance += 0.2;
      if (
        spread > chance &&
        !this.lifted.includes(fromCube(tile)) &&
        tile.elevation < limit
      ) {
        spread *= Math.random() * decay + 0.7;
        if (edgeDistance > this.diameter) {
          spread *= (edgeDistance - this.diameter) / 3;
        }
        if (spread > 1) spread = 1;
        this.raiseGround(tile, spread, decay, parseInt(i), limit);
      }
    }
  }
  raiseNearby(cood: Cube, limit: number) {
    limit--;
    if (limit == 0) return;
    if (this.lifted.includes(fromCube(cood))) return;
    this.lifted.push(fromCube(cood));
    let tile = this.tiles[fromCube(cood)];
    for (const oTile of this.getRing(cood.q, cood.s, cood.r, 1)) {
      if (oTile.elevation < tile.elevation) {
        oTile.elevation = roll_range(tile.elevation - 1, tile.elevation);
        this.raiseNearby(oTile, limit);
      }
    }
  }
  spreadBeach(cood: Cube, spread: number, type: "beach" | "land") {
    if (this.tiles[fromCube(cood)].elevation !== 0) return;
    let group = this.tiles[fromCube(cood)].groupID;
    this.tiles[fromCube(cood)] =
      type == "beach"
        ? new TerrainSand(0.5, cood.q, cood.s, cood.r)
        : new TerrainPlains(0.5, cood.q, cood.s, cood.r);
    this.tiles[fromCube(cood)].groupID = group;
    this.lifted.push(fromCube(cood));
    for (let tile of this.getRing(cood.q, cood.s, cood.r, 1)) {
      let chance = Math.random();
      let nearByOcean = this.getRing(tile.q, tile.s, tile.r, 1).filter(
        (oTile) => {
          if (this.ocean.includes(fromCube(oTile))) return true;
          return false;
        }
      ).length;
      //chance += 0.1 * nearByOcean;
      spread += 0.2 * nearByOcean;
      if (spread > chance && !this.lifted.includes(fromCube(tile))) {
        spread -= 0.33;
        if (spread > 1) spread = 1;
        this.spreadBeach(tile, spread, type);
      } else {
      }
    }
  }
  spreadTree(cood: Cube, spread: number, direction: number) {
    if (this.tiles[fromCube(cood)].type !== "plain") return;
    let group = this.tiles[fromCube(cood)].groupID;
    this.tiles[fromCube(cood)] = new TerrainForest(
      this.tiles[fromCube(cood)].elevation,
      cood.q,
      cood.s,
      cood.r
    );
    this.tiles[fromCube(cood)].groupID = group;
    this.lifted.push(fromCube(cood));
    const tiles = this.getRing(cood.q, cood.s, cood.r, 1);
    for (let i in tiles) {
      const tile = tiles[i];
      let chance = Math.random();
      if (parseInt(i) == direction) chance += 0.2;
      if (spread > chance && !this.lifted.includes(fromCube(tile))) {
        spread *= Math.random() * 0.5 + 0.7;
        if (spread > 1) spread = 1;
        this.spreadTree(tile, spread, parseInt(i));
      } else {
      }
    }
  }

  getRandomLandPoint(char?: Char): Cube {
    let q = 0;
    let s = 0;
    let r = 0;
    if (char) {
      /*let tiles = this.islands[this.array?.[char.x()]?.[char.y()]?.groupID];
      if (tiles !== undefined) {
        let options: Array<[any, number]> = [["leave", 20]];
        for (let xy of tiles) {
          let [x2, y2] = fromXY(xy);
          if (Math.abs(char.x() - x2) > game.maxPathFind) continue;
          if (Math.abs(char.y() - y2) > game.maxPathFind) continue;
          if (
            !char.situation.been
              .map((i) =>
                i
                  .split(",")
                  .map((j) => Math.round(parseInt(j)))
                  .join(",")
              )
              .includes(xy)
          )
            options.push([xy, 1]);
        }
        let res = roll(options);
        if (res !== "leave") {
          return res.split(",") as [number, number];
        }
      }*/

      let d = this.getDistance(char.coord, this.center);
      let land = game.map.land.map((i) => fromCube(i));

      let found = false;
      let i = roll_range(
        Math.min(Math.ceil(d), 4),
        Math.min(Math.ceil(d), 4) + 4
      );
      do {
        let tiles = game.map.getRing(
          char.coord.q,
          char.coord.s,
          char.coord.r,
          i
        );
        tiles.sort((a, b) => {
          return (
            this.getDistance(a, this.center) - this.getDistance(b, this.center)
          );
        });
        for (let tile of tiles) {
          if (land.includes(fromCube(tile))) {
            found = true;
            //console.log(tile.elevation);
            q = tile.q;
            s = tile.s;
            r = tile.r;
          }
        }
        i++;
      } while (!found);
      return { q, s, r };
    } else {
      let attempts = 0;
      let islandSize = 0;
      let cood = this.center;
      do {
        let tile = this.land.sort(() => Math.random() - 0.5)[0];
        cood = {
          q: tile.q,
          r: tile.r,
          s: tile.s,
        };
        islandSize =
          this.islands[this.tiles[fromCube(cood)].groupID]?.length ?? 0;
        attempts++;
      } while (
        islandSize < 50 &&
        attempts < 10 &&
        this.getDistance(cood, this.center) <= (game?.radius ?? this.diameter)
      );
      if (islandSize > 50) return cood;
      return this.center;
    }
  }
  canSee(from: TerrainType, to: TerrainType) {
    let elevation = this.tiles[fromCube(from)].elevation;
    let targetElevation = this.tiles[fromCube(to)].elevation;
    if (elevation < 0) elevation = -1;
    if (targetElevation < 0) targetElevation = -1;
    let tiles = this.getTilesBetween(from, to);
    let d = this.getDistance(from, to);
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

  getMovementCost(tiles: TerrainType[]) {
    let t = [...tiles];
    let c = 0;
    for (let i = 1; i <= t.length - 1; i++) {
      c += t[i - 1].moveCost + Math.abs(t[i].elevation - t[i - 1].elevation);
      //if (t[i].moveCost > 6) t[i].moveCost = 999;
    }
    return c;
    t.splice(0, 1);
    return t.map((x) => x.moveCost).reduce((a, b) => a + b, 0);
  }
  getDistance(
    from: { q: number; s: number; r: number },
    to: { q: number; s: number; r: number }
  ) {
    return (
      (Math.abs(from.q - to.q) +
        Math.abs(from.s - to.s) +
        Math.abs(from.r - to.r)) /
      2
    );
  }
  getTilesBetween(
    from: { q: number; s: number; r: number },
    to: { q: number; s: number; r: number }
  ) {
    let qDiff = from.q - to.q;
    let sDiff = from.s - to.s;
    let rDiff = from.r - to.r;
    let tiles: Array<TerrainType> = [];
    let d = this.getDistance(from, to);
    for (let i = 1; i <= d; i += 0.1) {
      let q = Math.round(from.q - (qDiff * i) / d);
      let s = Math.round(from.s - (sDiff * i) / d);
      let r = -q - s;
      let tile = this.addTile(q, s, r);
      if (!tiles.includes(tile)) tiles.push(tile);
    }
    return tiles;
  }
  getRing(
    q: number,
    s: number,
    r: number,
    distance: number,
    ignoreLimit = false
  ): TerrainType[] {
    let arr: TerrainType[] = [];
    for (let d of [distance, distance * -1]) {
      for (let i = 0; Math.abs(i) <= Math.abs(d); i += d / Math.abs(d)) {
        let tile = this.addTile(q + d, s - i, r + i - d);
        if (!arr.includes(tile)) arr.push(tile);
        tile = this.addTile(q + d - i, s + i, r - d);
        if (!arr.includes(tile)) arr.push(tile);
        tile = this.addTile(q - i, s + d, r - d + i);
        if (!arr.includes(tile)) arr.push(tile);
      }
    }
    for (let i = arr.length - 1; i >= 0; i--) {
      if (
        Math.abs(arr[i].q) > this.diameter ||
        Math.abs(arr[i].s) > this.diameter * 1.2 ||
        Math.abs(arr[i].r) > this.diameter * 1.2
      ) {
        delete this.tiles[fromCube(arr[i])];
        arr.splice(i, 1);
      }
    }
    return arr;
  }
  addTile(q: number, s: number, r: number) {
    if (this.tiles[fromCube({ q, s, r })] == undefined)
      this.tiles[fromCube({ q, s, r })] = new TerrainWater(-3, q, s, r);
    return this.tiles[fromCube({ q, s, r })];
  }
}
