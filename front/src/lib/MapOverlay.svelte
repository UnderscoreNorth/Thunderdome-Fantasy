<script lang="ts">
	import { onMount } from 'svelte';
	export let selectChar: Function;
	export let unit: number;
	import { type Char, game, selectedCharID, selectedIsland, view } from './classes';
	import { fromCube, toCube } from './utils';
	import Icon from './Icon.svelte';
	let u = 100 / unit;
	function islandNames(): Array<{ i: string; s: number; name: string; x: number; y: number }> {
		if (!$game?.diameter) return [];
		u = 100 / $game.diameter;
		let islands = [];
		for (let name in $game.islands) {
			if (name.indexOf('--') !== 0) {
				let qT = 0;
				let rT = 0;
				let sT = 0;
				let t = 0;
				for (let qrs of $game.islands[name]) {
					let coord = toCube(qrs);
					qT += coord.q;
					rT += coord.r;
					sT += coord.s;
					t++;
				}
				let q = qT / t;
				let r = rT / t;
				let x =
					(((3 * q) / 2 - 2.25 + ($game.diameter * 3) / 2) * 100) / ($game.diameter * 3) +
					($view.x + $view.xDiff) / ($view.renderSize / 100);
				x *= $view.zoom;
				let y =
					((((Math.sqrt(3) * q) / 2 + Math.sqrt(3) * r) * 0.75 + ($game.diameter * 3) / 2) * 100) /
						($game.diameter * 3) +
					($view.y + $view.yDiff) / ($view.renderSize / 100);
				y *= $view.zoom;
				console.log(x, y);
				let i = t % 2;
				let i2 = Math.round(x) % 4;
				let type = '';
				let s = 1;
				if (t > 4000) {
					type = [
						[`'s Land`, '', ` Grande`, ``],
						[`Grand `, ``, 'The ', '']
					][i][i2];
					s = 2.5;
				} else if (t > 2000) {
					type = [
						[' Island', ' Isle', `'s Island`, `'s Island`],
						[`L'Île `, `L'Île de `, 'La Isla ', 'La Isla de ']
					][i][i2];
					s = 2;
				} else if (t > 750) {
					type = [
						[' Holm', ' Key', `'s Holm'`, ' Key'],
						[`L'Atoll `, `Le le Récif de la `, 'El Escollo de ', 'El Escollo ']
					][i][i2];
					s = 1.5;
				} else if (t > 300) {
					type = [
						[' Haven', ' Enclave', ' Haven', ' Enclave'],
						['El Arrecife de ', 'La Peninsula De ', 'La Chaine ', 'Le Recif ']
					][i][i2];
				} else {
					type = [
						[' Refuge', ' Islet', `'s Refuge`, ' Islet'],
						['El Refugio De ', 'El Atolon ', 'Le Havre De ', 'Le Refuge ']
					][i][i2];
				}
				islands.push({
					i: name,
					s,
					name,
					x,
					y
				});
			}
		}
		return islands;
	}
	function islandName(name: string, type: string, format: 'En' | 'Fr') {
		if (format == 'En') return name + type;

		return type + name;
	}
	function getX(char: Char, offset = 0) {
		let x =
			(((3 * char.coord.q) / 2 - 2.25 + offset + ($game.diameter * 3) / 2) * 100) /
				($game.diameter * 3) +
			($view.x + $view.xDiff) / ($view.renderSize / 100);
		return x * $view.zoom;
	}
	function getY(char: Char, offset: number) {
		let cell = $game.map[fromCube(char.coord)];
		let elevation = cell.elevation / 1.5;
		if (elevation < 0) {
			elevation = 0;
		} else {
			elevation += 0.5;
		}
		let y =
			((((Math.sqrt(3) * char.coord.q) / 2 + Math.sqrt(3) * char.coord.r - elevation) * 0.75 -
				6.5 -
				offset +
				($game.diameter * 3) / 2) *
				100) /
				($game.diameter * 3) +
			($view.y + $view.yDiff) / ($view.renderSize / 100);
		return y * $view.zoom;
	}
</script>

<div id="mapOverlay">
	{#key $view}
		{#each islandNames() as island}
			<div
				on:click={() => ($selectedIsland = $selectedIsland == island.i ? undefined : island.i)}
				class="islandName"
				style:font-size={island.s * 1.5 + 'rem'}
				style:left={island.x + '%'}
				style:top={island.y + '%'}
			>
				<div>{island.name}</div>
			</div>
		{/each}
		<div>
			{#each $game?.chars ?? [] as char (char.id)}
				<char
					on:click={() => {
						selectChar(char);
					}}
					class={[char.id == $selectedCharID ? 'sel' : '', char.death ? 'dead' : ''].join(' ')}
					style:background-image={`url(${char.img})`}
					style:left={getX(char) + '%'}
					style:top={getY(char, 0) + '%'}
					style:height={u * 1.5 * $view.zoom + '%'}
				/>
				<div
					class="gameBar"
					style:left={getX(char) + '%'}
					style:top={getY(char, 1.5) + '%'}
					style:width={u * (char.stats.health / char.stats.maxHealth) * 1.5 * $view.zoom + '%'}
					style:height={$view.zoom / 5 + '%'}
					style:background={'red'}
				/>
				<div
					class="gameBar"
					style:left={getX(char) + '%'}
					style:top={getY(char, 0.75) + '%'}
					style:width={u * (char.stats.energy / char.stats.maxEnergy) * 1.5 * $view.zoom + '%'}
					style:height={$view.zoom / 5 + '%'}
					style:background={'green'}
				/>
				<div
					class="gameBar"
					style:left={getX(char, 1) + '%'}
					style:top={getY(char, -4.5) + '%'}
					style:width={u * 0.75 * $view.zoom + '%'}
					style:height={u * 0.75 * $view.zoom + '%'}
				>
					<Icon icon="person" />
				</div>
			{/each}
		</div>
	{/key}
</div>

<style>
	#mapOverlay {
		height: min(100svh, 100vw);
		width: min(100svh, 100vw);
		position: absolute;
		pointer-events: none;
		overflow: hidden;
	}
	char {
		position: absolute;
		border-radius: 50%;
		z-index: 1;
		aspect-ratio: 1;
		background-size: cover;
		opacity: 0.9;
		cursor: pointer;
		box-sizing: border-box;
		border: solid 1px gold;
	}
	char.sel {
		opacity: 1;
		z-index: 2;
		border: solid 1px white;
		box-shadow: 0 0 100px 25px #fff;
	}

	char.dead {
		opacity: 0.2;
	}
	.gameBar {
		position: absolute;
		z-index: 1;
		opacity: 0.8;
	}
	.islandName {
		position: absolute;
		z-index: 1;
		opacity: 0.8;
		color: rgb(155, 140, 57);
		font-weight: bold;
		width: 1px;
		cursor: pointer;
	}
	.islandName div {
		display: flex;
		justify-content: center;
		white-space: nowrap;
		text-shadow:
			-1px -1px 0 #000,
			1px -1px 0 #000,
			-1px 1px 0 #000,
			1px 1px 0 #000;
	}
	.islandName:hover div {
		color: rgb(219, 206, 130);
	}
</style>
