<script lang="ts">
	import { api } from '$lib/utils';
	import { onMount } from 'svelte';
	import './styles.css';
	import { type Char, type Game, type TerrainType } from '$lib/classes';
	import CharDetailed from '$lib/CharDetailed.svelte';
	import CharBox from '$lib/CharBox.svelte';
	import Icon from '$lib/Icon.svelte';
	let game: Game;
	let unit = 0;
	let centerRadius = 0;
	let selectedCharID: number | undefined;
	let rerender: number;
	let pinging = false;
	let seed = 0;
	let showKilled = true;
	let islandNames: Array<{ name: string; x: number; y: number }> = [];

	onMount(async () => {
		seed = Math.random();
		game = (await api('get')) as Game;
		unit = (1 / game.diameter) * 100;
		setInterval(() => {
			if (!pinging) {
				pinging = true;
				api('get')
					.then((r) => {
						game = r;
						centerRadius = ((15 - r.time.day) / 15) * r.diameter * 0.75;
						islandNames = [];
						for (let name in game.islands) {
							if (name.indexOf('--') !== 0) {
								let xT = 0;
								let yT = 0;
								let t = 0;
								for (let xy of game.islands[name]) {
									let [x, y] = xy.split(',').map((i) => parseInt(i)) as [number, number];
									xT += x;
									yT += y;
									t++;
								}
								let x = xT / t;
								let y = yT / t;
								let i = t % 2;
								if (t > 2000) {
									name += [' Island', ' Isle'][i];
								} else if (t > 750) {
									name += [' Holm', ' Key'][i];
								} else if (t > 300) {
									name += [' Haven', ' Enclave'][i];
								} else {
									name += [' Refuge', ' Islet'][i];
								}
								islandNames.push({ name, x, y });
							}
						}
					})
					.finally(() => {
						pinging = false;
					});
			}
		}, 5000);
	});
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
		if (selectedCharID !== undefined) {
			let char = game.chars.filter((x) => x.id == selectedCharID)[0];
			if (char == undefined) {
				selectedCharID = undefined;
				return;
			}
			let xy = `${cell.x},${cell.y}`;
			if (char.path && char.path.map((i) => `${i[0]},${i[1]}`).includes(`${cell.x},${cell.y}`)) {
				return `repeating-radial-gradient(
				hsl(${hue},${saturation * 1.1}%,${light + 5}%),
				red ${unit * 0.9}vh
				)`;
			} else if (char.situation.vision.includes(xy)) {
				saturation *= 1.1;
				light += 5;
			} else if (char.situation.seen.includes(xy)) {
				return `repeating-linear-gradient(
				45deg,
				hsl(${hue},${saturation}%,${Math.max(light - 10, 3)}%),
				hsl(${hue},${saturation - 10}%,${Math.max(light - 15, 3)}%) 3px,
				hsl(${hue},${saturation}%,${Math.max(light - 10, 3)}%) 3px,
				hsl(${hue},${saturation - 10}%,${Math.max(light - 15, 3)}%) 3px
				)`;
			} else {
				light = 3;
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
		if (selectedCharID !== undefined) {
			let char = game.chars.filter((x) => x.id == selectedCharID)[0];
			if (char == undefined) {
				selectedCharID = undefined;
				return;
			}
			let xy = `${cell.x},${cell.y}`;
			if (char.situation.vision.includes(xy)) {
			} else if (char.situation.seen.includes(xy)) {
				light -= 10;
			} else {
				light = 3;
			}
		}
		return `hsl(${hue},${saturation}%,${light}%)`;
	}
	function selectChar(char: Char) {
		if (selectedCharID === char.id) {
			selectedCharID = undefined;
		} else {
			selectedCharID = char.id;
		}
		rerender = Math.random();
	}
</script>

<svelte:head></svelte:head>
<app>
	{#if game}
		{#await game then GAME}
			{#key rerender}
				<map
					style:grid-template-columns={`repeat(${GAME.diameter},${unit}vh)`}
					style:grid-template-rows={`repeat(${GAME.diameter},${unit}vh)`}
					style:font-size={`${unit}vh`}
				>
					{#each GAME.map as row}
						{#each row as cell}
							<tile style:background={getBackground(cell)} style:color={getColor(cell)}>
								{#if cell.icon.length}
									<mapicon class={cell.glow ? 'glow' : ''}>
										<Icon icon={cell.icon} />
									</mapicon>
								{/if}
							</tile>
						{/each}
					{/each}
				</map>
			{/key}
			{#each islandNames as island}
				<div
					class="islandName"
					style:top={unit * island.x + 'vh'}
					style:left={unit * island.y + 'vh'}
				>
					<div>{island.name}</div>
				</div>
			{/each}
			<div>
				{#each GAME.chars as char (char.id)}
					<char
						on:click={() => {
							selectChar(char);
						}}
						class={[char.id == selectedCharID ? 'sel' : '', char.death ? 'dead' : ''].join(' ')}
						style:background-image={`url(${char.img})`}
						style:top={unit * (char.situation.x - 1) + 'vh'}
						style:left={unit * (char.situation.y - 1) + 'vh'}
						style:height={unit * 3 + 'vh'}
					/>
					<div
						class="gameBar"
						style:display="none"
						style:height={'4px'}
						style:top={unit * (char.situation.x + 2) + 'vh'}
						style:left={unit * (char.situation.y - 1) + 'vh'}
						style:width={unit * (char.stats.health / char.stats.maxHealth) + 'vh'}
						style:background={'red'}
					/>
					<div
						class="gameBar"
						style:display="none"
						style:height={'4px'}
						style:top={`calc(${unit * (char.situation.x + 2)}vh + 4px)`}
						style:left={unit * (char.situation.y - 1) + 'vh'}
						style:width={unit * (char.stats.energy / char.stats.maxEnergy) * 3 + 'vh'}
						style:background={'green'}
					/>
				{/each}
			</div>
			<div id="sidePanel">
				<div style:height={'1rem'} style:padding-bottom={'5px'}>
					<b>{GAME.msg}</b>
					Day {GAME.time.day}
					{GAME.time.hour.toString().padStart(2, '0')}:{GAME.time.minute
						.toString()
						.padStart(2, '0')}
					{GAME.chars.filter((i) => !i.death).length}/{GAME.chars.length} Chars
					<input bind:checked={showKilled} type="checkbox" />Show <Icon icon="kills" />
				</div>
				<div id="sidePanelChars">
					{#each GAME.chars as char (char.id)}
						{#if showKilled || (!showKilled && !char.death)}
							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<table
								class={[char.id == selectedCharID ? 'sel' : '', char.death ? 'dead' : ''].join(' ')}
								on:click={() => {
									selectChar(char);
								}}
							>
								<CharBox {char} />
							</table>
						{/if}
					{/each}
				</div>
				<div id="sidePanelLog">
					{#if selectedCharID !== undefined}
						{#each GAME.chars.filter((x) => x.id == selectedCharID) as char}
							<CharDetailed {char} />
						{/each}
					{/if}
				</div>
			</div>
		{/await}
	{/if}
</app>

<style>
	tile {
		position: relative;
	}
	app {
		display: flex;
		flex-direction: row;
		height: 100vh;
		width: 100vw;
	}
	char {
		position: absolute;
		border-radius: 50%;
		z-index: 1;
		aspect-ratio: 1;
		background-size: cover;
		opacity: 0.9;
		cursor: pointer;
	}
	char.sel {
		opacity: 1;
		border: solid 2px red;
		box-shadow: 0 0 100px 15px #fff;
	}
	:global(mapicon.glow svg) {
		position: relative;
		filter: drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.8));
		z-index: 1;
	}
	char.dead {
		opacity: 0.33;
	}
	.gameBar {
		position: absolute;
		z-index: 1;
		opacity: 0.7;
	}
	map {
		position: relative;
		height: 100%;
		max-height: 100vh;
		max-width: 100vw;
		aspect-ratio: 1;
		display: grid;
		gap: 0;
	}
	#sidePanel {
		flex-grow: 1;
		background: #202020;
		color: white;
		font-family: 'Helvetica';
		display: grid;
		grid-template-columns: auto;
		grid-template-rows: 1.2rem auto auto;
		height: 100vh;
		overflow-y: hidden;
	}
	#sidePanelChars {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		overflow-y: scroll;
	}
	#sidePanelChars table {
		height: 3rem;
		cursor: pointer;
		width: 7rem;
	}
	#sidePanelChars table:hover {
		background: #313131;
	}
	#sidePanelChars table.sel {
		border: solid 1px white;
	}
	#sidePanelChars table.dead {
		opacity: 0.5;
	}
	.islandName {
		position: absolute;
		z-index: 1;
		opacity: 0.8;
		font-family: 'Footlight MT';
		font-size: 1.5rem;
		color: rgb(155, 140, 57);
		font-weight: bold;
		width: 1px;
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
</style>
