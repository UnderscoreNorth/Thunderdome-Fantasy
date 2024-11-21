<script lang="ts">
	import { onMount } from 'svelte';
	import { type TerrainType, selectedCharID, game, view, selectedIsland } from './classes';
	import { iconSvg } from './icon';
	export let unit: number;
	let h: number;
	function getBackground(cell: TerrainType) {
		let hue = 0;
		let light = cell.elevation * 10 + 10;
		let saturation = 80;
		if (cell.type == 'water') {
			light = (cell.elevation + 3) * 10 + 10;
			hue = 222;
		} else if (cell.type == 'sand') {
			hue = 53;
			light = 45;
			saturation = 50;
		} else if (cell.type == 'plain' || cell.type == 'tree') {
			saturation = (3 - cell.elevation) * 10 + 10;
			light = (2 - cell.elevation) * 7.5 + 20;
			hue = 112;
		} else if (cell.type == 'mtn') {
			light = (cell.elevation + 1) * 10 + 10;
			hue = 0;
			saturation = 0;
		} else if (cell.type == 'unseen') {
			light = 50;
		}
		light += ((cell.x + cell.y) % 3) * 0.5;
		if ($selectedCharID !== undefined) {
			let char = $game.chars.filter((x) => x.id == $selectedCharID)[0];
			if (char == undefined) {
				$selectedCharID = undefined;
			} else {
				let xy = `${cell.x},${cell.y}`;
				if (char.situation.vision.includes(xy)) {
					saturation *= 1.1;
					light += 5;
				} else if (char.situation.seen.includes(xy)) {
					light -= 10;
				} else {
					light = 3;
				}
			}
		}
		return `hsl(${hue},${saturation}%,${light}%)`;
	}
	function getColor(cell: TerrainType) {
		let hue = 0;
		let light = 40;
		let saturation = 100;
		if (cell.icon == '🌳') {
			hue = 112;
			light = 35;
		} else if (cell.icon == '🔥') {
			hue = 0;
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
		if ($selectedCharID !== undefined) {
			let char = $game.chars.filter((x) => x.id == $selectedCharID)[0];
			if (char == undefined) {
				$selectedCharID = undefined;
			} else {
				let xy = `${cell.x},${cell.y}`;
				if (char.situation.vision.includes(xy)) {
				} else if (char.situation.seen.includes(xy)) {
					light -= 10;
				} else {
					light = 3;
				}
			}
		}
		return `hsl(${hue},${saturation}%,${light}%)`;
	}
	let canvas: HTMLCanvasElement;
	onMount(() => {
		canvas = document.getElementById('canvas') as HTMLCanvasElement;
		draw();
		game.subscribe(() => {
			draw();
		});
		selectedCharID.subscribe(() => {
			draw();
		});
		view.subscribe(() => {
			draw();
		});
		selectedIsland.subscribe(() => {
			draw();
		});
	});
	function draw() {
		let u = (10000 / unit) * $view.zoom;
		let offSet = 10000 - 10000 / $view.zoom;
		let xO = offSet * ($view.x / 100);
		let yO = offSet * ($view.y / 100);
		if (canvas.getContext) {
			let ctx = canvas.getContext('2d');
			if (!ctx) return;
			ctx.clearRect(0, 0, 1000, 1000);
			ctx.shadowColor = 'white';
			ctx.shadowBlur = 0;
			for (let row of $game.map) {
				for (let cell of row) {
					ctx.setTransform(1, 0, 0, 1, 0, 0);
					ctx.fillStyle = getBackground(cell);
					ctx.fillRect(cell.x * u - xO, cell.y * u - yO, u, u);
				}
			}
			if ($selectedIsland !== undefined) {
				for (const xy of $game.islands[$selectedIsland]) {
					let [x, y] = xy.split(',').map((i) => parseInt(i)) as [number, number];
					ctx.setTransform(1, 0, 0, 1, 0, 0);
					ctx.fillStyle = 'rgba(255,255,255,0.2)';
					ctx.fillRect(x * u - xO, y * u - yO, u, u);
				}
			}
			if ($selectedCharID !== undefined) {
				let char = $game.chars.filter((x) => x.id == $selectedCharID)[0];
				if (char !== undefined && char.path !== undefined) {
					for (const [x, y] of char.path) {
						ctx.setTransform(1, 0, 0, 1, 0, 0);
						ctx.strokeStyle = 'red';
						ctx.lineWidth = 10;
						ctx.strokeRect(x * u, y * u, u, u);
					}
				}
			}
			for (let row of $game.map) {
				for (let cell of row) {
					if (!cell.icon || iconSvg[cell.icon] == undefined) continue;
					let svg = iconSvg[cell.icon];
					let scale = svg?.scale ?? 1;
					let x = (cell.x - (scale - 1) / 2) * u;
					let y = (cell.y - (scale - 1)) * u;
					ctx.setTransform(1, 0, 0, 1, 0, 0);
					ctx.fillStyle = getColor(cell);
					ctx.translate(x, y);
					ctx.scale((u / 512) * scale, (u / 512) * scale);
					let p = new Path2D(svg.path);
					if (cell.glow) {
						ctx.shadowBlur = 10;
					} else {
						ctx.shadowBlur = 0;
					}
					ctx.fill(p);
				}
			}
			ctx.shadowBlur = 0;
		}
	}
	function scroll(e: WheelEvent) {
		let zoom = $view.zoom;
		let dir = e.deltaY > 0 ? 1 : -1;
		zoom -= e.deltaY / 1000;
		console.log(e.deltaY);
		if (zoom < 1) zoom = 1;
		if (zoom > 2) zoom = 2;
		let x = $view.x - (Math.ceil((e.offsetX / h) * 3) - 2) * 10 * dir;
		let y = $view.y - (Math.ceil((e.offsetY / h) * 3) - 2) * 10 * dir;
		if (x < 0) x = 0;
		if (x > 100) x = 100;
		if (y < 0) y = 0;
		if (y > 100) y = 100;
		/*view.set({
			x,
			y,
			zoom
		});*/
	}
</script>

<div bind:clientHeight={h} on:wheel={scroll}>
	<canvas id="canvas" height="10000" width="10000"> </canvas>
</div>

<style>
	canvas {
		height: 100vh;
		aspect-ratio: 1;
	}
	:global(mapicon.glow svg) {
		position: relative;
		filter: drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.8));
		z-index: 1;
	}
	div {
		position: relative;
		height: 100vh;
	}
</style>
