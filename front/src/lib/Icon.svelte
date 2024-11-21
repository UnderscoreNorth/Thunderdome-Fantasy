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
	import GiNinjaArmor from 'svelte-icons/gi/GiNinjaArmor.svelte';
	import GiLeatherArmor from 'svelte-icons/gi/GiLeatherArmor.svelte';
	import GiShoulderArmor from 'svelte-icons/gi/GiShoulderArmor.svelte';
	import GiSpellBook from 'svelte-icons/gi/GiSpellBook.svelte';
	import GiWizardStaff from 'svelte-icons/gi/GiWizardStaff.svelte';
	import GiBullseye from 'svelte-icons/gi/GiBullseye.svelte';
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
{:else if icon == 'meleeExp'}
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
{:else if icon == 'clothArmor'}
	<GiNinjaArmor />
{:else if icon == 'leatherArmor'}
	<GiLeatherArmor />
{:else if icon == 'plateArmor'}
	<GiShoulderArmor />
{:else if icon == 'magic'}
	<GiSpellBook />
{:else if icon == 'magicExp'}
	<GiWizardStaff />
{:else if icon == 'rangeExp'}
	<GiBullseye />
{/if}
