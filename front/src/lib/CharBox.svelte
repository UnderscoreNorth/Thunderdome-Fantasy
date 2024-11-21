<script lang="ts">
	import { type Char } from './classes';
	import Icon from './Icon.svelte';

	export let char: Char;
</script>

<tr>
	<td style:background-image={`url(${char.img})`} class="sideImg"> </td>
	<td>
		<div
			style:height={'4px'}
			style:width={(char.stats.health / char.stats.maxHealth) * 100 + '%'}
			style:background={'red'}
		/>
		<div
			style:height={'4px'}
			style:width={(char.stats.energy / char.stats.maxEnergy) * 100 + '%'}
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
	<td colspan="2">
		{char.name}<br />
		{char.death ? char.death : char.statusMessage}</td
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
	}
	.iconBar {
		text-align: left;
		font-size: 1rem;
	}
	:global(.iconBar svg) {
		height: 0.75rem !important;
		width: 0.75rem !important;
	}
</style>
