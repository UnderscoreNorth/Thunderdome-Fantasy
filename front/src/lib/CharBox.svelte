<script lang="ts">
	import { type Char } from './classes';
	import Icon from './Icon.svelte';

	export let char: Char;
</script>

<tr>
	<td style:background-image={`url(${char.img})`} class="sideImg"> </td>
	<td>
		{char.name}<br />
		<div
			style:height={'4px'}
			style:width={(Math.max(char.stats.health, 0) / char.stats.maxHealth) * 100 + '%'}
			style:background={'red'}
		/>
		<div
			style:height={'4px'}
			style:width={(Math.max(char.stats.energy, 0) / char.stats.maxEnergy) * 100 + '%'}
			style:background={'green'}
		/>
		<div class="iconBar">
			{#if char.stats.kills}
				{char.stats.kills}<Icon icon="kills" />
			{/if}
			{#if char.equip.weapon?.name}
				<Icon icon={char.equip.weapon.name} />
			{/if}
			{#if char.equip.armor?.name}
				<Icon icon={char.equip.armor.name + 'Armor'} />
			{/if}
		</div>
	</td>
</tr>
<tr>
	<td colspan="2" style:height="2rem"
		>{char.death ? char.death : (char.log?.[char.log.length - 1]?.[1] ?? '')}</td
	>
</tr>

<style>
	.sideImg {
		background-size: cover;
		height: 2rem;
		width: 2rem;
	}
	td {
		font-size: small;
		vertical-align: top;
	}
	.iconBar {
		text-align: left;
		font-size: 1rem;
		color: rgb(190, 123, 0);
	}
	:global(.iconBar svg) {
		height: 0.75rem !important;
		width: 0.75rem !important;
	}
</style>
