<script lang="ts">
	import { onMount } from 'svelte';
	export let selectChar: Function;
	export let unit: number;
	import { game, selectedCharID, selectedIsland } from './classes';
	let u = 100 / unit;
	let islandNames: Array<{ i: string; s: number; name: string; x: number; y: number }> = [];
	onMount(() => {
		game.subscribe((g) => {
			console.log(10);
			islandNames = [];
			for (let name in g.islands) {
				if (name.indexOf('--') !== 0) {
					let xT = 0;
					let yT = 0;
					let t = 0;
					for (let xy of $game.islands[name]) {
						let [x, y] = xy.split(',').map((i) => parseInt(i)) as [number, number];
						xT += x;
						yT += y;
						t++;
					}
					let x = xT / t;
					let y = yT / t;
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
					islandNames.push({
						i: name,
						s,
						name: islandName(name, type, i == 0 ? 'En' : 'Fr'),
						x,
						y
					});
				}
			}
			islandNames = islandNames;
		});
	});

	function islandName(name: string, type: string, format: 'En' | 'Fr') {
		if (format == 'En') return name + type;

		return type + name;
	}
</script>

{#each islandNames as island}
	<div
		on:click={() => ($selectedIsland = $selectedIsland == island.i ? undefined : island.i)}
		class="islandName"
		style:font-size={island.s * 1.5 + 'vh'}
		style:left={u * island.x + 'vh'}
		style:top={u * island.y + 'vh'}
	>
		<div>{island.name}</div>
	</div>
{/each}
<div>
	{#each $game.chars as char (char.id)}
		<char
			on:click={() => {
				selectChar(char);
			}}
			class={[char.id == $selectedCharID ? 'sel' : '', char.death ? 'dead' : ''].join(' ')}
			style:background-image={`url(${char.img})`}
			style:left={u * (char.situation.x - 1) + 'vh'}
			style:top={u * (char.situation.y - 1) + 'vh'}
			style:height={u * 3 + 'vh'}
		/>
		<div
			class="gameBar"
			style:left={u * (char.situation.x - 1) + 'vh'}
			style:top={u * (char.situation.y + 2) + 'vh'}
			style:width={u * (char.stats.health / char.stats.maxHealth) * 3 + 'vh'}
			style:background={'red'}
		/>
		<div
			class="gameBar"
			style:left={u * (char.situation.x - 1) + 'vh'}
			style:top={`calc(${u * (char.situation.y + 2)}vh + 3px)`}
			style:width={u * (char.stats.energy / char.stats.maxEnergy) * 3 + 'vh'}
			style:background={'green'}
		/>
	{/each}
</div>

<style>
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

	char.dead {
		opacity: 0.33;
	}
	.gameBar {
		position: absolute;
		z-index: 1;
		opacity: 0.8;
		height: 3px;
	}
	.islandName {
		position: absolute;
		z-index: 1;
		opacity: 0.8;
		font-family: Arial, Helvetica, sans-serif;
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
