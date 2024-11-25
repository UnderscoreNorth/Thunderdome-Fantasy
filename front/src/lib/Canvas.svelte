<script lang="ts">
	import { onMount } from 'svelte';
	import { type TerrainType, selectedCharID, game, view, selectedIsland } from './classes';
	import { iconSvg } from './icon';
	export let unit: number;
	let h: number;
	let timeArr: Record<string, number> = {};
	let p = 0;
	let time = 0;
	let diff = 0;
	function getBackground(cell: TerrainType) {
		let hue = 0;
		let light = cell.elevation * 10 + 10;
		let saturation = 80;
		let half = $game.diameter / 2;
		let d = 1 - (Math.abs(cell.y - half) - half * 0.6) / (half * 0.4);
		if (cell.type == 'water') {
			light = (cell.elevation + 3) * 10 + 10;
			hue = 222;
		} else if (cell.type == 'sand') {
			hue = 53;
			light = 45;
			saturation = 50;
			if (Math.abs(cell.y - half) > half * 0.6) {
				saturation = Math.min(saturation, Math.pow(d, 2) * saturation);
				light += Math.pow(1 - d, 2) * (5 - cell.elevation) * 10;
			}
		} else if (cell.type == 'plain' || cell.type == 'tree') {
			saturation = (3 - cell.elevation) * 10 + 10;
			light = (2 - cell.elevation) * 7.5 + 20;

			if (Math.abs(cell.y - half) > half * 0.6) {
				saturation = Math.min(saturation, Math.pow(d, 2) * saturation);
				light += Math.pow(1 - d, 2) * (5 - cell.elevation) * 10;
			}
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
		} else {
			light *= diff;
		}
		if (light < 3) light = 3;
		return `hsl(${hue},${saturation}%,${light}%)`;
	}
	function getColor(cell: TerrainType) {
		let hue = 0;
		let light = 40;
		let saturation = 100;
		let alpha = 1;
		if (cell.icon == '🌳') {
			hue = 110 + ((cell.x + cell.y) % 3) * 12;
			saturation = 100 - ((cell.x + cell.y) % 3) * 12;
			light = 35 - ((cell.x + cell.y) % 3) * 2;
			let half = $game.diameter / 2;
			let d = 1 - (Math.abs(cell.y - half) - half * 0.6) / (half * 0.4);
			if (Math.abs(cell.y - half) > half * 0.6) {
				saturation = Math.min(saturation, 10 + Math.pow(d, 2) * (saturation - 10));
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
		light += ((cell.x + cell.y) % 3) * 0.5;
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
		} else {
			light *= diff;
		}
		if (light < 3) light = 3;
		return `hsla(${hue},${saturation}%,${light}%,${alpha})`;
	}
	let canvas: HTMLCanvasElement;
	let cached: HTMLImageElement;
	let ctx: CanvasRenderingContext2D | null;
	let cameraC: HTMLCanvasElement;
	let cameraCtx: CanvasRenderingContext2D | null;
	onMount(() => {
		cameraC = document.getElementById('canvas') as HTMLCanvasElement;
		canvas = document.createElement('canvas');
		canvas.width = $view.renderSize;
		canvas.height = $view.renderSize;
		ctx = canvas.getContext('2d');
		cameraCtx = cameraC.getContext('2d');
		cached = new Image();
		requestAnimationFrame(draw);
		game.subscribe(() => {
			requestAnimationFrame(draw);
		});
		selectedCharID.subscribe(() => {
			requestAnimationFrame(draw);
		});
		view.subscribe(() => {
			requestAnimationFrame(camera);
		});
		selectedIsland.subscribe(() => {
			requestAnimationFrame(draw);
		});
	});
	function draw() {
		if (!$game?.name) return;
		//timeArr = {};
		//p = performance.now();
		time = $game.time.hour * 60 + $game.time.minute;
		diff = 1 - Math.pow(Math.abs(time - 840) / 720, 4);
		if (diff < 0.6) diff = 0.6;
		let u = $view.renderSize / $game.diameter;
		if (!ctx) return;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		//ctx.scale($view.zoom, $view.zoom);
		//ctx.translate(x, y);
		ctx.shadowColor = 'white';
		ctx.shadowBlur = 0;
		//ctx.setTransform($view.zoom, 0, 0, $view.zoom, $view.x + $view.xDiff, $view.y + $view.yDiff);
		//log('reset');
		for (let row of $game.map) {
			for (let cell of row) {
				ctx.fillStyle = getBackground(cell);
				ctx.fillRect(cell.x * u, cell.y * u, u + 1, u + 1);
			}
		}
		//log('tiles');
		if ($selectedIsland !== undefined) {
			for (const xy of $game.islands[$selectedIsland]) {
				let [x, y] = xy.split(',').map((i) => parseInt(i)) as [number, number];
				ctx.fillStyle = 'rgba(255,255,255,0.2)';
				ctx.fillRect(x * u, y * u, u, u);
			}
		}
		//log('island');

		//log('player path');
		for (let row of $game.map) {
			for (let cell of row) {
				if (!cell.icon || iconSvg[cell.icon] == undefined) continue;
				let svg = iconSvg[cell.icon];
				let scale = svg?.scale ?? 1;
				let x = (cell.x - (scale - 1) / 2) * u;
				let y = (cell.y - (scale - 1)) * u;
				ctx.fillStyle = getColor(cell);
				ctx.setTransform(1, 0, 0, 1, 0, 0);
				//ctx.scale($view.zoom, $view.zoom);
				//ctx.translate($view.x + $view.xDiff, $view.y + $view.yDiff);
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
		if ($selectedCharID !== undefined) {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.shadowBlur = 0;
			let char = $game.chars.filter((x) => x.id == $selectedCharID)[0];

			for (const i in char.situation.been) {
				const [x, y] = char.situation.been[i].split(',').map((j) => parseFloat(j)) as [
					number,
					number
				];
				ctx.fillStyle = `rgba(255,255,255,${Math.max(0.1, 0.8 - (char.situation.been.length - parseInt(i)) * 0.01)})`;
				ctx.fillRect(x * u + u / 4, y * u + u / 4, u / 2, u / 2);
			}
			if (char !== undefined && char.path !== undefined) {
				for (const [x, y] of char.path) {
					//ctx.strokeStyle = 'red';
					//ctx.lineWidth = 5 / $view.zoom;
					//ctx.strokeRect(x * u, y * u, u, u);
					ctx.fillStyle = 'rgba(255,215,0,.8)';
					ctx.fillRect(x * u + u / 4, y * u + u / 4, u / 2, u / 2);
				}
			}
			ctx.strokeStyle = 'rgba(200,40,40,0.5)';
			ctx.lineWidth = 5 / $view.zoom;
			ctx.beginPath();
			let range = char.stats.combatRange + (char.equip?.weapon?.rangeBonus ?? 0);
			ctx.arc(char.situation.x * u, char.situation.y * u, range * u, 0, 2 * Math.PI);
			ctx.stroke();
		}
		cached.src = canvas.toDataURL('image/png');
		setTimeout(() => {
			camera();
		}, 1);
	}
	function log(name: string) {
		let time = Math.round(performance.now() - p);
		timeArr[name] = time;
		p = performance.now();
	}
	function camera() {
		if (!cameraCtx) return;
		if (!cached) return;
		cameraCtx.setTransform(1, 0, 0, 1, 0, 0);
		cameraCtx.fillStyle = $selectedCharID !== undefined ? 'rgb(2,5,14)' : 'rgb(5,17,46)';
		cameraCtx.fillRect(0, 0, canvas.width, canvas.height);
		cameraCtx.scale($view.zoom, $view.zoom);
		cameraCtx.translate($view.x + $view.xDiff, $view.y + $view.yDiff);
		cameraCtx.drawImage(cached, 0, 0);
	}
	function scroll(e: WheelEvent) {
		let zoom = $view.zoom;
		zoom -= e.deltaY / 1000;
		if (zoom < 1) zoom = 1;
		if (zoom > 3) zoom = 3;
		changeZoom(zoom);
	}
	let drag = false;
	let startX = 0;
	let startY = 0;
	let xDiff = 0;
	let yDiff = 0;
	let initTouchDistance = -1;
	let initZoom = 0;
	function doubleClick(e: MouseEvent) {
		let { zoom, x, y } = $view;
		zoom += 0.08;
		if (zoom < 1) zoom = 1;
		if (zoom > 3) zoom = 3;
		changeZoom(zoom);
	}
	function changeZoom(z: number) {
		view.update((v) => {
			let initOffset = (v.renderSize - v.renderSize / v.zoom) / 2;
			let afterOffset = (v.renderSize - v.renderSize / z) / 2;
			v.x += initOffset - afterOffset;
			v.y += initOffset - afterOffset;
			v.zoom = z;
			return v;
		});
	}
	function getPinchDistance(t: TouchList) {
		return Math.sqrt(
			Math.pow(t[0].clientX - t[1].clientX, 2) + Math.pow(t[0].clientY - t[1].clientY, 2)
		);
	}
	function dragStart(e: MouseEvent | TouchEvent) {
		if (e instanceof TouchEvent && e.targetTouches.length == 2) {
			initTouchDistance = getPinchDistance(e.targetTouches);
			initZoom = $view.zoom;
			drag = true;
			return;
		}
		drag = true;
		if (e instanceof MouseEvent) {
			startX = e.offsetX;
			startY = e.offsetY;
		} else {
			startX = e.targetTouches[0].clientX;
			startY = e.targetTouches[0].clientY;
		}
		let names = Array.from(document.getElementsByClassName('islandName'))
			.concat(Array.from(document.getElementsByClassName('gameBar')))
			.concat(Array.from(document.getElementsByTagName('char'))) as HTMLDivElement[];
		for (const name of names) {
			name.style.pointerEvents = 'none';
		}
	}
	function dragMove(e: MouseEvent | TouchEvent) {
		if (e instanceof TouchEvent && e.targetTouches.length == 2 && initTouchDistance >= 0) {
			let zoom = $view.zoom;
			let d = getPinchDistance(e.targetTouches);
			zoom = (initZoom * d) / initTouchDistance;
			if (zoom < 1) zoom = 1;
			if (zoom > 3) zoom = 3;
			changeZoom(zoom);
			e.preventDefault();
			return;
		}
		let dragSpeed = $game.diameter * 5 * $view.zoom;
		if (drag) {
			let offsetX = e instanceof MouseEvent ? e.offsetX : e.targetTouches[0].clientX;
			let offsetY = e instanceof MouseEvent ? e.offsetY : e.targetTouches[0].clientY;
			xDiff = ((offsetX - startX) / h) * dragSpeed;
			$view.xDiff = xDiff;
			yDiff = ((offsetY - startY) / h) * dragSpeed;
			$view.yDiff = yDiff;
		}
	}
	function dragEnd(e: MouseEvent | TouchEvent) {
		initTouchDistance = -1;
		if (drag) {
			drag = false;
			view.update((v) => {
				v.x += v.xDiff;
				v.y += v.yDiff;
				v.xDiff = 0;
				v.yDiff = 0;
				return v;
			});
			let names = Array.from(document.getElementsByClassName('islandName'))
				.concat(Array.from(document.getElementsByClassName('gameBar')))
				.concat(Array.from(document.getElementsByTagName('char'))) as HTMLDivElement[];
			for (const name of names) {
				name.style.pointerEvents = 'auto';
			}
		}
	}
</script>

<div
	bind:clientHeight={h}
	on:wheel={scroll}
	on:dblclick={doubleClick}
	on:mousemove={dragMove}
	on:mousedown={dragStart}
	on:mouseup={dragEnd}
	on:mouseleave={dragEnd}
	on:touchstart={dragStart}
	on:touchmove={dragMove}
	on:touchend={dragEnd}
>
	<canvas id="canvas" height={$view.renderSize} width={$view.renderSize}> </canvas>
</div>

<style>
	canvas {
		height: min(100svh, 100vw);
		aspect-ratio: 1;
	}
	:global(mapicon.glow svg) {
		position: relative;
		filter: drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.8));
		z-index: 1;
	}
	div {
		position: relative;
		height: min(100svh, 100vw);
	}
</style>
