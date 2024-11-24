<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { api } from './utils';
	let show = false;
	let pass = '';
	let auth = false;
	let bg: HTMLDivElement;
	let passwordEl: HTMLInputElement;
	type Char = { name: string; img: string; group: string };
	let chars: Char[] = [{ name: '', group: '', img: '' }];
	let data = '';
	let diameter = 250;
	let days = 12;
	let islandData = '';
	onMount(() => {});
	async function enterKey(e: KeyboardEvent) {
		if (e.key == 'Enter') {
			auth = (await api('auth', { pass })).auth;
			if (!auth) pass = '';
		}
	}
	function close(e: MouseEvent) {
		if (e.target == bg) show = false;
	}
	function showModal() {
		show = true;
	}
	function newGame() {
		if (parseInt(diameter.toString()) > 20 && getData().length && days > 1)
			api('newGame', {
				pass,
				chars: getData(),
				diameter,
				days,
				islandNames: islandData.split(/\n|,/gim).filter((i) => i.length)
			});
	}
	function newRow() {
		let char = chars[chars.length - 1];
		if (char.name || char.group || char.img) chars.push({ name: '', group: '', img: '' });
	}
	function deleteRow(i: number) {
		let char = chars[i];
		if (char.name || char.group || char.img) chars.splice(i, 1);
		if (chars.length == 0) chars = [{ name: '', img: '', group: '' }];
		chars = chars;
	}
	function getData() {
		return chars.filter((char) => char.name || char.group || char.img);
	}
	function importData() {
		let parsed = JSON.parse(data);
		if (Array.isArray(parsed)) {
			let temp: Char[] = [];
			for (const row of parsed) {
				if (typeof row == 'object') {
					temp.push({ name: row.name, img: row.img, group: row.group });
				}
			}
			if (temp.length) chars = temp;
		}
	}
	function exportData() {
		data = JSON.stringify(getData());
	}
</script>

{#if show}
	<div bind:this={bg} id="settingsModalBG" on:click={close}>
		<div id="settingsModal">
			{#if !auth}
				<!-- svelte-ignore a11y-autofocus -->
				<input
					bind:this={passwordEl}
					id="password"
					type="password"
					bind:value={pass}
					on:keypress={enterKey}
					autofocus
				/>
			{:else}
				<div style:padding="1rem">
					<table>
						<tr style:height="1rem">
							<th></th>
							<th>Name</th>
							<th>Group</th>
							<th>Img</th>
							<th></th>
							<th>Island Names</th>
						</tr>
						{#each chars as char, i}
							<tr>
								<td class="img" style:background-image={`url(${char.img})`}> </td>
								<td
									><input
										on:change={() => newRow()}
										on:keypress={() => newRow()}
										bind:value={char.name}
									/></td
								>
								<td
									><input
										on:change={() => newRow()}
										on:keypress={() => newRow()}
										bind:value={char.group}
										placeholder="Leave blank for solo"
									/></td
								>
								<td
									><input
										on:change={() => newRow()}
										on:keypress={() => newRow()}
										bind:value={char.img}
										placeholder="Image url"
									/></td
								>
								<td>
									{#if char.name || char.group || char.img}
										<button tabindex="-1" on:click={() => deleteRow(i)}>X</button>
									{/if}
								</td>
								{#if i == 0}
									<td rowspan="0">
										<textarea
											placeholder="Line or comma seperated"
											style:height={chars.length + 'rem'}
											tabindex="-1"
											bind:value={islandData}
										></textarea>
									</td>
								{/if}
							</tr>
						{/each}
					</table>

					<hr />
					<textarea bind:value={data}></textarea><br />
					<div id="buttonGrid">
						<button
							on:click={() => {
								importData();
							}}>Import</button
						>
						<button
							on:click={() => {
								exportData();
							}}>Export</button
						>
						<div>
							<input style:width="3rem" bind:value={diameter} />
							<span style:vertical-align="middle">Game Width</span><br />
							<input style:width="3rem" bind:value={days} />
							<span style:vertical-align="middle">Game Length</span>
						</div>
						<button
							on:click={() => {
								newGame();
							}}>Generate<br />New Game</button
						>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
<div id="settingsCog" on:click={() => showModal()}>
	<Icon icon="cog" />
</div>

<style>
	#buttonGrid {
		display: grid;
		grid-template-columns: 1fr 1fr auto 1fr;
		gap: 1rem;
	}
	textarea {
		width: 100%;
	}
	.img {
		height: 1rem;
		width: 1rem;
		background-size: cover;
	}
	#password {
		height: 1rem;
		padding: 0.5rem;
		margin: 0;
	}
	#settingsCog:hover {
		cursor: pointer;
		background: #575757;
	}
	#settingsModalBG {
		height: 100vh;
		width: 100vw;
		position: absolute;
		left: 0;
		top: 0;
		z-index: 3;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
	}
	#settingsModal {
		display: inline-block;
		min-height: 2rem;
		min-width: 100px;
		width: fit-content;
		height: fit-content;
		max-width: 80vw;
		max-height: 80vh;
		overflow: auto;
		margin: auto;
		background: #303030;
		border: solid 2px gold;
		z-index: 4;
	}
</style>
