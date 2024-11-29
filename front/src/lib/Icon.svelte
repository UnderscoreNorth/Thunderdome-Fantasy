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
	import MdSettings from 'svelte-icons/md/MdSettings.svelte';
	import MdSort from 'svelte-icons/md/MdSort.svelte';
	import GiPocketBow from 'svelte-icons/gi/GiPocketBow.svelte';
	import GiArrowhead from 'svelte-icons/gi/GiArrowhead.svelte';
	import MdPerson from 'svelte-icons/md/MdPerson.svelte';
	export let icon: string;
</script>

{#if icon == 'pistol'}
	<GiPistolGun />
{:else if icon == 'sword'}
	<svg
		fill="#000000"
		version="1.1"
		id="Layer_1"
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
		width="800px"
		height="800px"
		viewBox="0 0 260 260"
		enable-background="new 0 0 260 260"
		xml:space="preserve"
	>
		<path
			d="M258,2l-16,48L97.06,181.76l-7.23-11.14l-11.68-7.58L210,18L258,2z M101.029,238.26l11.314-11.314l-31.176-48.02
l-48.02-31.176l-11.314,11.314l31.386,31.386l-34.26,37.693c-4.464-0.586-9.138,0.82-12.568,4.249
c-5.858,5.858-5.858,15.355,0,21.213c5.858,5.858,15.355,5.858,21.213,0c3.428-3.428,4.834-8.1,4.25-12.562l37.695-34.262
L101.029,238.26z"
		/>
	</svg>
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
{:else if icon == 'cog'}
	<MdSettings />
{:else if icon == 'sort'}
	<MdSort />
{:else if icon == 'bow'}
	<GiPocketBow />
{:else if icon == 'spear'}
	<GiArrowhead />
{:else if icon == 'person'}
	<MdPerson />
{/if}

<style>
	svg {
		stroke: currentColor;
		fill: currentColor;
		stroke-width: 0;
		width: 100%;
		height: auto;
		max-height: 100%;
	}
</style>
