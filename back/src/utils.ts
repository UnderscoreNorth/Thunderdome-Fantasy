import { Cube, TerrainType } from "./terrain";

export function roll<T>(options: Array<[T, number]>): T {
  let total_weight = 0;
  // log_message(options);
  options.forEach(function (choice, index) {
    if (choice[1] > 0) {
      total_weight = total_weight + Math.round(choice[1]);
    }
  });
  let roll_choice = roll_range(1, total_weight);
  // log_message(roll_choice)
  for (let i = 0; i < options.length; i++) {
    let choice = options[i];
    if (choice[1] >= roll_choice) {
      // log_message('returning ' + choice[0])
      return choice[0];
    } else {
      roll_choice = roll_choice - choice[1];
    }
  }
}
export function roll_range(min: number, max: number) {
  return Math.floor(Math.random() * (max + 1 - min)) + min;
}
export const directions = [
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 1],
  [-1, 0],
  [-1, 1],
];
export function changeDirection(dir: number, angle: number) {
  dir = dir + angle;
  if (dir > 5) dir -= 6;
  if (dir < 0) dir += 6;
  return dir;
}

export function shuffle(array: Array<any>) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

export function fromCube(c: Cube | TerrainType) {
  return `${c.q},${c.s},${c.r}`;
}
export function toCube(qsr: string): Cube {
  let split = qsr.split(",").map((i) => parseInt(i));
  let sum = split.reduce((a, b) => a + b, 0);
  if (sum !== 0) throw `${qsr} needs to sum to zero`;
  if (split.length !== 3) throw `${qsr} must be 3 components`;
  return {
    q: split[0],
    s: split[1],
    r: split[2],
  };
}
export function direction(cood: Cube, dir: number) {
  if (dir == 0) {
    cood.s++;
    cood.r--;
  } else if (dir == 1) {
    cood.q++;
    cood.r--;
  } else if (dir == 2) {
    cood.q++;
    cood.s--;
  } else if (dir == 3) {
    cood.r++;
    cood.s--;
  } else if (dir == 4) {
    cood.q--;
    cood.r++;
  } else {
    cood.q--;
    cood.s++;
  }
  return cood;
}
