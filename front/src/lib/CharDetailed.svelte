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
	<table>
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
		<tr>
			<td>{Math.round(char.stats.combatExp * 10) / 10}</td>
			<th><Icon icon={'combatxp'} /></th><td>Combat EXP</td>
		</tr>
	</table>
	<table>
		<tr>
			<th>{char.name}</th>
		</tr>
		<tr>
			<td><i>{char.group}</i></td>
		</tr>
		<tr>
			<td
				>{#if char.equip.weapon?.name}
					<Icon icon={char.equip.weapon?.name} /> Uses: {char.equip.weapon.uses}
				{/if}</td
			>
		</tr>
		<tr>
			<td
				>{#if char.equip.armor?.name}
					<Icon icon={char.equip.armor?.name + 'Armor'} /> Uses: {char.equip.armor.uses}
				{/if}</td
			>
		</tr>
	</table>
	<div class="log">
		Log:
		<hr />
		<div class="msgs">
			{#each char.log.reverse() as msg}
				<div>{msg}</div>
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
	tr > *:nth-child(1) {
		text-align: right;
	}
	tr > *:nth-child(4) {
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
