import { type Game, type TerrainType, type View } from './classes';
import { iconSvg } from './icon';
import { fromCube } from './utils';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D | null;
let $game: Game;
let $view: View;
let $selectedCharID: number;
let $selectedIsland: string;
let diff = 0;

self.onmessage = function (e) {
	if (e.data.type == 'init') {
		canvas = e.data.canvas;
		ctx = canvas.getContext('2d');
		return;
	} else if (e.data.type == 'draw') {
		$game = e.data.$game;
		$view = e.data.$view;
		$selectedCharID = e.data.$selectedCharID;
		$selectedIsland = e.data.$selectedIsland;
		draw();
		setTimeout(() => {
			postMessage('ready');
		}, 1);
	}
};

function getBackground(cell: TerrainType) {
	let hue = 0;
	let light = cell.elevation * 10 + 10;
	let saturation = 80;
	const half = $game.diameter;
	const d = 1 - (Math.abs(cell.s - half) - half * 0.2) / (half * 0.8);
	if (cell.type == 'water') {
		light = (cell.elevation + 3) * 10 + 10;
		hue = 222;
	} else if (cell.type == 'sand') {
		hue = 53;
		light = 45;
		saturation = 50;
		/*if (Math.abs(cell.s - half) > half * 0.6) {
                saturation = Math.min(saturation, Math.pow(d, 2) * saturation);
                light += Math.pow(1 - d, 2) * (5 - cell.elevation) * 10;
            }*/
	} else if (cell.type == 'plain' || cell.type == 'tree') {
		saturation = (3 - cell.elevation) * 10 + 10;
		light = (2 - cell.elevation) * 7.5 + 20;

		if (Math.abs(cell.s - half) > half * 0.2) {
			//saturation = Math.min(saturation, Math.pow(d, 2) * saturation);
			//light += Math.pow(1 - d, 2) * (5 - cell.elevation) * 10;
		}
		hue = 112;
	} else if (cell.type == 'mtn') {
		light = (cell.elevation + 1) * 10 + 10;
		hue = 0;
		saturation = 0;
	} else if (cell.type == 'unseen') {
		light = 50;
	}
	light += ((cell.s + cell.r) % 3) * 0.5;
	if ($selectedCharID !== undefined) {
		const char = $game.chars.filter((x) => x.id == $selectedCharID)[0];
		if (char == undefined) {
			//$selectedCharID = undefined;
		} else {
			if (char.situation.vision.includes(fromCube(cell))) {
				saturation *= 1.1;
				light += 5;
			} else if (char.situation.seen.includes(fromCube(cell))) {
				light -= 10;
			} else {
				light = 3;
			}
		}
	} else {
		light *= diff;
	}
	if (light < 3) light = 3;
	/*if (cell.elevation >= 0 && cell.groupID) {
            hue = Object.keys($game.islands).indexOf(cell.groupID) * 20;
            saturation = 50;
            light = 50;
        }*/
	return `hsl(${hue},${saturation}%,${light}%)`;
}
function getColor(cell: TerrainType) {
	let hue = 0;
	let light = 40;
	let saturation = 100;
	const alpha = 1;
	if (cell.icon == '🌳') {
		hue = 110 + ((cell.s + cell.r) % 3) * 12;
		saturation = 100 - ((cell.s + cell.r) % 3) * 12;
		light = 35 - ((cell.s + cell.r) % 3) * 2;
		const half = $game.diameter / 2;
		const d = 1 - (Math.abs(cell.s - half) - half * 0.6) / (half * 0.4);
		if (Math.abs(cell.s - half) > half * 0.6) {
			//saturation = Math.min(saturation, 10 + Math.pow(d, 2) * (saturation - 10));
			//light += Math.pow((Math.abs(cell.y - half) - half * 0.7) / (half * 0.3), 1) * 40;
		}
	} else if (cell.icon == '🔥') {
		hue = Math.random() * 25;
	} else if (cell.icon == 'cave') {
		saturation = 0;
		light = 20;
	} else if (cell.icon == 'tower') {
		hue = 226;
		saturation = 70;
		light = 60;
	} else if (cell.icon == 'hut') {
		hue = 29;
		light = 40;
	}
	light += ((cell.s + cell.r) % 3) * 0.5;
	if ($selectedCharID !== undefined) {
		const char = $game.chars.filter((x) => x.id == $selectedCharID)[0];
		if (char == undefined) {
			//$selectedCharID = undefined;
		} else {
			if (char.situation.vision.includes(fromCube(cell))) {
			} else if (char.situation.seen.includes(fromCube(cell))) {
				light -= 10;
			} else {
				light = 3;
			}
		}
	} else {
		light *= diff;
	}
	if (light < 3) light = 3;
	return `hsla(${hue},${saturation}%,${light}%,${alpha})`;
}

function draw() {
	if (!$game?.name) return;
	if (!ctx) return;
	if (!$game.time) return;

	const time = $game.time.hour * 60 + $game.time.minute;
	diff = 1 - Math.pow(Math.abs(time - 840) / 720, 4);
	if (diff < 0.6) diff = 0.6;
	canvas.width = $view.renderSize;
	canvas.height = $view.renderSize;
	const u = $view.renderSize / (($game.diameter * 6) / 2);
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.fillStyle = $selectedCharID !== undefined ? 'rgb(2,5,14)' : 'rgb(5,17,46)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	//ctx.scale($view.zoom, $view.zoom);
	//ctx.translate(x, y);
	ctx.shadowColor = 'white';
	ctx.shadowBlur = 0;
	//ctx.setTransform($view.zoom, 0, 0, $view.zoom, $view.x + $view.xDiff, $view.y + $view.yDiff);
	for (const cell of Object.values($game.map).sort((a, b) => {
		return a.r - b.r;
	})) {
		let elevation = cell.elevation / 1.5;
		if (elevation < 0) {
			elevation = 0;
		} else {
			elevation += 0.5;
		}
		let x = u * ((3 * cell.q) / 2) + $view.renderSize / 2;
		let y =
			u * ((Math.sqrt(3) * cell.q) / 2 + Math.sqrt(3) * cell.r - elevation) * 0.75 +
			$view.renderSize / 2;
		ctx.fillStyle = getBackground(cell);
		ctx.setTransform(1, 0, 0, 1, x, y);
		//ctx.fillRect(0, 0, u + 1, u + 1);
		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			let offset = 0;
			if (i > 0 && i <= 3 && elevation > 0) offset = elevation;
			ctx.lineTo(
				u * Math.cos((i * 2 * Math.PI) / 6),
				u * (Math.sin((i * 2 * Math.PI) / 6) + offset) * 0.75
			);
			if (i == 0)
				ctx.lineTo(
					u * Math.cos((i * 2 * Math.PI) / 6),
					u * (Math.sin(i * 2 * Math.PI) / 6 + elevation) * 0.75
				);
			if (i == 3)
				ctx.lineTo(u * Math.cos((i * 2 * Math.PI) / 6), u * (Math.sin(i * 2 * Math.PI) / 6) * 0.75);
		}
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = 'rgba(0,0,0,0.1)';
		ctx.fill();
		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			ctx.lineTo(u * Math.cos((i * 2 * Math.PI) / 6), u * Math.sin((i * 2 * Math.PI) / 6) * 0.75);
		}
		ctx.closePath();
		ctx.fillStyle = 'rgba(255,255,255,0.1)';
		ctx.fill();
		if ($selectedCharID !== undefined) {
			const char = $game.chars.filter((x) => x.id == $selectedCharID)[0];
			//console.log(fromCube(cell), char.situation.been);
			if (fromCube(char.coord) == fromCube(cell)) {
				ctx.strokeStyle = 'red';
				ctx.stroke();
			} else if (char.path?.includes(fromCube(cell))) {
				ctx.strokeStyle = 'gold';
				ctx.stroke();
			} else if (char.situation.been.includes(fromCube(cell))) {
				ctx.strokeStyle = `rgba(100,0,100,${char.situation.been.indexOf(fromCube(cell)) / char.situation.been.length})`;
				ctx.stroke();
			}
		}

		if (!cell.icon || iconSvg[cell.icon] == undefined) continue;

		const svg = iconSvg[cell.icon];
		const scale = svg?.scale ?? 1;
		x = u * ((3 * cell.q) / 2 - scale / 2) + $view.renderSize / 2;
		y =
			u * ((Math.sqrt(3) * cell.q) / 2 + Math.sqrt(3) * cell.r - elevation - scale) * 0.75 +
			$view.renderSize / 2;
		ctx.fillStyle = getColor(cell);
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		//ctx.scale($view.zoom, $view.zoom);
		//ctx.translate($view.x + $view.xDiff, $view.y + $view.yDiff);
		ctx.translate(x, y);
		ctx.scale((u / 512) * scale, (u / 512) * scale);
		const p = new Path2D(svg.path);
		/*if (cell.glow) {
					ctx.shadowBlur = 10;
				} else {
					ctx.shadowBlur = 0;
				}*/
		ctx.fill(p);
	}

	if ($selectedIsland !== undefined) {
		for (const qsr of $game.islands[$selectedIsland]) {
			const cell = $game.map[qsr];

			let elevation = cell.elevation;
			if (elevation < 0) {
				elevation = 0;
			} else {
				elevation += 0.5;
			}
			const x = u * ((3 * cell.q) / 2) + $view.renderSize / 2;
			const y =
				u * ((Math.sqrt(3) * cell.q) / 2 + Math.sqrt(3) * cell.r - elevation) * 0.75 +
				$view.renderSize / 2;
			ctx.fillStyle = 'rgba(255,255,255,0.2)';
			ctx.setTransform(1, 0, 0, 1, x, y);
			//ctx.fillRect(0, 0, u + 1, u + 1);
			ctx.beginPath();
			for (let i = 0; i < 6; i++) {
				ctx.lineTo(u * Math.cos((i * 2 * Math.PI) / 6), u * Math.sin((i * 2 * Math.PI) / 6) * 0.75);
			}
			ctx.closePath();
			ctx.fill();
		}
	}
}
