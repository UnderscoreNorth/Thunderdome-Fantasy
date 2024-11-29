<script lang="ts">
	import { onMount } from 'svelte';
	import { type TerrainType, selectedCharID, game, view, selectedIsland } from './classes';
	import { iconSvg } from './icon';
	import { fromCube, toCube } from './utils';
	import Worker from './canvasWorker.ts?worker';
	let h: number;
	let timeArr: Record<string, number> = {};
	let p = 0;
	let time = 0;
	let diff = 0;

	let canvas: HTMLCanvasElement;
	let cached: HTMLImageElement;
	let ctx: CanvasRenderingContext2D | null;
	let cameraC: HTMLCanvasElement;
	let cameraCtx: CanvasRenderingContext2D | null;
	onMount(() => {
		cameraC = document.getElementById('canvas') as HTMLCanvasElement;
		canvas = document.createElement('canvas');
		cameraCtx = cameraC.getContext('2d');
		canvas.width = $view.renderSize;
		canvas.height = $view.renderSize;
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
		//const offscreenC = cameraC.transferControlToOffscreen();
		const offscreen = canvas.transferControlToOffscreen();
		const worker = new Worker();
		worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);
		//worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);
		worker.onmessage = (e) => {
			camera();
		};
		function draw() {
			if (worker)
				worker.postMessage({ type: 'draw', $view, $game, $selectedCharID, $selectedIsland });

			//console.log(timeArr);
		}
		function camera() {
			if (!cameraCtx && !canvas) return;
			if (cameraCtx == null) return;
			cameraCtx.setTransform(1, 0, 0, 1, 0, 0);
			cameraCtx.fillStyle = $selectedCharID !== undefined ? 'rgb(2,5,14)' : 'rgb(5,17,46)';
			cameraCtx.fillRect(0, 0, canvas.width, canvas.height);
			cameraCtx.scale($view.zoom, $view.zoom);
			cameraCtx.translate($view.x + $view.xDiff, $view.y + $view.yDiff);
			cameraCtx.drawImage(canvas, 0, 0);
		}
	});
	function log(name: string) {
		let time = Math.round(performance.now() - p);
		timeArr[name] = time;
		p = performance.now();
	}

	function scroll(e: WheelEvent) {
		let zoom = $view.zoom;
		zoom -= (e.deltaY * zoom) / 1000;
		if (zoom < 1) zoom = 1;
		if (zoom > $game.diameter / 10) zoom = $game.diameter / 10;
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
