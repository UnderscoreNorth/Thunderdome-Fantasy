<script lang="ts">
	import { type Char } from '$lib/classes';
	import Icon from './Icon.svelte';
	export let char: Char;
	export let selectChar: Function;
</script>

<div
	class="container"
	on:click={() => {
		selectChar(char.id);
	}}
>
	<div class="avatar" style:background-image={`url(${char.img})`}></div>
	<table class="stats">
		<tr>
			<td>{Math.max(Math.round(char.stats.health), 0)}/{char.stats.maxHealth}</td>
			<th><Icon icon="health" /></th><td>Health</td>
		</tr>
		<tr>
			<td>{Math.round(char.stats.energy)}/{char.stats.maxEnergy}</td>
			<th><Icon icon={'energy'} /></th><td>Energy</td>
		</tr>
		<tr>
			<td>{Math.round(char.stats.moveSpeed * 100) / 10}</td>
			<th><Icon icon={'agi'} /></th><td>Agility</td>
		</tr>
		<tr>
			<td>{char.stats.kills}</td>
			<th><Icon icon={'kills'} /></th><td>Kills</td>
		</tr>
		{#if char.stats.meleeExp}
			<tr>
				<td>{Math.round(char.stats.meleeExp * 10) / 10}</td>
				<th><Icon icon={'meleeExp'} /></th><td>Melee</td>
			</tr>
		{/if}
		{#if char.stats.rangeExp}
			<tr>
				<td>{Math.round(char.stats.rangeExp * 10) / 10}</td>
				<th><Icon icon={'rangeExp'} /></th><td>Range</td>
			</tr>
		{/if}
		{#if char.stats.magicExp}
			<tr>
				<td>{Math.round(char.stats.magicExp * 10) / 10}</td>
				<th><Icon icon={'magicExp'} /></th><td>Magic</td>
			</tr>
		{/if}
	</table>
	<table class="general">
		<tr>
			<th>{char.name}</th>
		</tr>
		<tr>
			<td><i>{isNaN(parseInt(char.group)) ? char.group : 'Solo'}</i></td>
		</tr>
		{#if char.equip.weapon?.name}
			<tr>
				<td>
					<Icon icon={char.equip.weapon?.name} /> Uses: {char.equip.weapon.uses}
				</td>
			</tr>
		{/if}
		{#if char.equip.armor?.name}
			<tr>
				<td>
					<Icon icon={char.equip.armor?.name + 'Armor'} /> Uses: {char.equip.armor.uses}
				</td>
			</tr>
		{/if}
	</table>
	<div class="log">
		Log:
		<hr />
		<div class="msgs">
			{#each char.log.reverse() as msg}
				<div>Day {msg[0] + ' - ' + msg[1]}</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.avatar {
		height: 8rem;
		max-height: 10vh;
		background-size: cover;
		aspect-ratio: 1;
		border-radius: 50%;
		border: solid 2px white;
	}
	th,
	td {
		height: 1rem;
		white-space: nowrap;
		vertical-align: top;
	}
	.container {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		padding: 5px;
		font-size: 2vh;
	}
	.stats tr > *:nth-child(1) {
		text-align: right;
	}
	.stats tr > *:nth-child(2) {
		width: 1rem;
	}
	.general tr {
		text-align: left;
	}
	.log {
		width: 100%;
	}
	.log .msgs {
		max-height: 40vh;
		overflow-y: scroll;
	}
</style>
