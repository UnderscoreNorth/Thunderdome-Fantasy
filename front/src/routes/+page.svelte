<script lang="ts">
	import { api } from '$lib/utils';
	import { onMount } from 'svelte';
	import './styles.css';
	import { selectedCharID, type Char, type Game, type TerrainType } from '$lib/classes';
	import CharDetailed from '$lib/CharDetailed.svelte';
	import CharBox from '$lib/CharBox.svelte';
	import Icon from '$lib/Icon.svelte';
	import Canvas from '$lib/Canvas.svelte';
	import MapOverlay from '$lib/MapOverlay.svelte';
	import { game } from '$lib/classes';
	let unit = 0;
	let centerRadius = 0;
	let rerender: number;
	let pinging = false;
	let seed = 0;
	let showKilled = true;

	onMount(async () => {
		seed = Math.random();
		ping();
		setInterval(() => {
			ping();
		}, 5000);
	});
	function ping() {
		if (!pinging) {
			pinging = true;
			api('get')
				.then((r) => {
					if (r.diameter) {
						game.set(r);
						centerRadius = ((15 - r.time.day) / 15) * r.diameter * 0.75;
						rerender = Math.random();
						unit = r.diameter;
					}
				})
				.finally(() => {
					pinging = false;
				});
		}
	}
	function selectChar(char: Char) {
		if ($selectedCharID === char?.id) {
			$selectedCharID = undefined;
		} else {
			$selectedCharID = char.id;
		}
		rerender = Math.random();
	}
</script>

<svelte:head></svelte:head>
<app>
	{#if $game}
		<Canvas {unit} />
		<MapOverlay {unit} {selectChar} />
		<div id="sidePanel">
			<div style:height={'1rem'} style:padding-bottom={'5px'}>
				<b>{$game.msg}</b>
				Day {$game.time.day}
				{$game.time.hour.toString().padStart(2, '0')}:{$game.time.minute
					.toString()
					.padStart(2, '0')}
				{$game.chars.filter((i) => !i.death).length}/{$game.chars.length} Chars
				<input bind:checked={showKilled} type="checkbox" />Show <Icon icon="kills" />
			</div>
			<div id="sidePanelChars">
				{#each $game.chars as char (char.id)}
					{#if showKilled || (!showKilled && !char.death)}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<table
							class={[char.id == $selectedCharID ? 'sel' : '', char.death ? 'dead' : ''].join(' ')}
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
				{#if $selectedCharID !== undefined}
					{#each $game.chars.filter((x) => x.id == $selectedCharID) as char}
						<CharDetailed {char} {selectChar} />
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</app>

<style>
	app {
		display: flex;
		flex-direction: row;
		height: 100vh;
		width: 100vw;
	}

	.gameBar {
		position: absolute;
		z-index: 1;
		opacity: 0.7;
	}
	#sidePanel {
		flex-grow: 1;
		background: #202020;
		display: grid;
		grid-template-columns: auto;
		grid-template-rows: 1.2rem auto auto;
		height: 100vh;
		overflow-y: hidden;
		z-index: 2;
	}
	#sidePanelChars {
		display: flex;
		flex-wrap: wrap;
		overflow-y: scroll;
		align-content: flex-start;
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
</style>
