<script lang="ts">
	import GiPistolGun from 'svelte-icons/gi/GiPistolGun.svelte';
	import GiTwoHandedSword from 'svelte-icons/gi/GiTwoHandedSword.svelte';
	import GiHealthNormal from 'svelte-icons/gi/GiHealthNormal.svelte';
	import GiPowerLightning from 'svelte-icons/gi/GiPowerLightning.svelte';
	import GiRun from 'svelte-icons/gi/GiRun.svelte';
	import GiSkullCrossedBones from 'svelte-icons/gi/GiSkullCrossedBones.svelte';
	import GiSwordBrandish from 'svelte-icons/gi/GiSwordBrandish.svelte';
	import FaTree from 'svelte-icons/fa/FaTree.svelte';
	import GiFire from 'svelte-icons/gi/GiFire.svelte';
	import GiCaveEntrance from 'svelte-icons/gi/GiCaveEntrance.svelte';
	import GiWhiteTower from 'svelte-icons/gi/GiWhiteTower.svelte';
	import GiHut from 'svelte-icons/gi/GiHut.svelte';
	import GiAbstract038 from 'svelte-icons/gi/GiAbstract038.svelte';
	import GiWinchesterRifle from 'svelte-icons/gi/GiWinchesterRifle.svelte';
	export let icon: string;
</script>

{#if icon == 'pistol'}
	<GiPistolGun />
{:else if icon == 'sword'}
	<GiTwoHandedSword />
{:else if icon == 'health'}
	<GiHealthNormal />
{:else if icon == 'energy'}
	<GiPowerLightning />
{:else if icon == 'agi'}
	<GiRun />
{:else if icon == 'kills'}
	<GiSkullCrossedBones />
{:else if icon == 'combatxp'}
	<GiSwordBrandish />
{:else if icon == '🌳'}
	<FaTree />
{:else if icon == 'cave'}
	<GiCaveEntrance />
{:else if icon == 'hut'}
	<GiHut />
{:else if icon == 'tower'}
	<GiWhiteTower />
{:else if icon == '🔥'}
	<GiFire />
{:else if icon == 'center'}
	<GiAbstract038 />
{:else if icon == 'sniper'}
	<GiWinchesterRifle />
{/if}
