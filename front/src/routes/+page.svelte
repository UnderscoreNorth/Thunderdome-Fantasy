<script lang="ts">
	import { api } from '$lib/utils';
	import { onMount } from 'svelte';
	import './styles.css';
	import {
		selectedCharID,
		selectedIsland,
		type Char,
		type Game,
		type TerrainType
	} from '$lib/classes';
	import CharDetailed from '$lib/CharDetailed.svelte';
	import CharBox from '$lib/CharBox.svelte';
	import Icon from '$lib/Icon.svelte';
	import Canvas from '$lib/Canvas.svelte';
	import MapOverlay from '$lib/MapOverlay.svelte';
	import { game } from '$lib/classes';
	import Admin from '$lib/Admin.svelte';
	import CONFIG from '$lib/config.json';
	let unit = 0;
	let pinging = false;
	let showKilled = true;
	let sort: 'group' | 'name' | 'value' = 'group';
	function sortChars(chars: Array<Char>) {
		return chars.sort((a, b) => {
			if (sort == 'group') {
				if (a.group == b.group) {
					if (a.name == b.name) return 0;
					return a.name > b.name ? 1 : -1;
				} else {
					return a.group > b.group ? 1 : -1;
				}
			} else if (sort == 'value') {
				if (a.death && b.death) {
					let lastA = a.log[a.log.length - 1][0];
					let lastB = b.log[b.log.length - 1][0];
					if (lastA == lastB) {
						return 0;
					} else {
						return lastB > lastA ? 1 : -1;
					}
				} else {
					return (
						b.stats.health * (1 + (b.stats.magicExp + b.stats.meleeExp + b.stats.rangeExp) / 100) -
						a.stats.health * (1 + (a.stats.magicExp + a.stats.meleeExp + a.stats.rangeExp) / 100)
					);
				}
			} else {
				if (a.name == b.name) return 0;
				return a.name > b.name ? 1 : -1;
			}
		});
	}
	function changeSort() {
		if (sort == 'group') {
			sort = 'name';
		} else if (sort == 'name') {
			sort = 'value';
		} else {
			sort = 'group';
		}
		$game.chars = sortChars($game.chars);
	}
	onMount(async () => {
		ping();
		setInterval(() => {
			ping();
		}, CONFIG.freq);
	});
	function ping() {
		if (!pinging) {
			pinging = true;
			api('get?id=' + ($game?.name ?? 'new'))
				.then((r) => {
					if (!r.time) return undefined;
					if (
						r.time.minute !== $game?.time?.minute ||
						r.time.hour !== $game?.time?.hour ||
						r.time.day !== $game?.time?.day
					)
						game.update((g) => {
							if (g?.name !== r?.name) {
								$selectedCharID = undefined;
								$selectedIsland = undefined;
							}
							if (g == undefined) {
								g = r;
							} else {
								g = Object.assign(g, r);
							}
							g.chars = sortChars(g.chars);
							for (const qsr of g.burned) {
								g.map[qsr].icon = '🔥';
							}
							return g;
						});
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
	}
</script>

<svelte:head></svelte:head>
<app>
	<Canvas />
	<MapOverlay {unit} {selectChar} />
	<div id="sidePanel">
		{#if !$game}
			<div style:margin="auto"><h1>Waiting for game...</h1></div>
		{/if}
		<div id="topBar">
			{#if $game}
				<b>{$game.msg}</b>
				<div>
					Day {$game.time.day}
					{$game.time.hour.toString().padStart(2, '0')}:{$game.time.minute
						.toString()
						.padStart(2, '0')}
				</div>
				<div>
					{$game.chars.filter((i) => !i.death).length}/{$game.chars.length} Chars
				</div>
				<input bind:checked={showKilled} type="checkbox" />Show <Icon icon="kills" />
				<div style:width="1rem" id="sortButton" on:click={() => changeSort()}>
					<Icon icon="sort" />
				</div>
			{/if}
			<div style:flex-grow="1"></div>
			<div style:width="1rem"><Admin /></div>
		</div>
		<div id="sidePanelChars">
			{#if $game}
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
			{/if}
		</div>
		<div id="sidePanelLog">
			{#if $selectedCharID !== undefined}
				{#each $game.chars.filter((x) => x.id == $selectedCharID) as char}
					<CharDetailed {char} {selectChar} />
				{/each}
			{/if}
		</div>
	</div>
</app>

<style>
	app {
		display: flex;
		flex-direction: row;
		height: 100svh;
		width: 100vw;
	}
	#sortButton:hover {
		cursor: pointer;
		background: #575757;
	}
	.gameBar {
		position: absolute;
		z-index: 1;
		opacity: 0.7;
	}
	#topBar {
		height: 1rem;
		padding-bottom: 5px;
		display: flex;
		gap: 5px;
	}
	#sidePanel {
		flex-grow: 1;
		background: #202020;
		display: grid;
		grid-template-columns: auto;
		grid-template-rows: min-content auto auto;
		gap: 5px;
		height: 100svh;
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
		width: 10rem;
	}
	#sidePanelChars table:hover {
		background: #313131;
	}
	#sidePanelChars table.sel {
		background: #575757;
	}
	#sidePanelChars table.dead {
		opacity: 0.5;
	}
	:global(svg) {
		color: rgb(190, 123, 0);
	}
	@media (orientation: portrait) {
		app {
			flex-direction: column;
		}
	}
</style>
