<script lang="ts">
	
	import { mdiThemeLightDark, mdiMenu } from '@mdi/js';
	import IconButton, { Icon } from '@smui/icon-button';
	import Select, { Option } from '@smui/select';
	import Button from '@smui/button';
	import { tauriDebug } from '../interactions/debug';
	import { specificQuery } from '../interactions/query_specific';
		
	const light_css = '/smui.css';
	const dark_css = '/smui-dark.css';
	let dark_mode: boolean | undefined = true;

	let user:string = "User Name Here";

	let rotation:string = "Rotation 3";
	let rotations:string[] = [];
	for (let n=0;n<20;n++)
	{
		rotations.push("Rotation " + n);
	}

</script>

<svelte:head>
	{#if dark_mode === undefined}
		<link rel="stylesheet" href={light_css} media="(prefers-color-scheme: light)" />
		<link rel="stylesheet" href={dark_css} media="screen and (prefers-color-scheme: dark)" />
	{:else if dark_mode}
		<link rel="stylesheet" href={light_css} media="print" />
		<link rel="stylesheet" href={dark_css} media="screen" />
	{:else}
		<link rel="stylesheet" href={light_css} />
	{/if}
</svelte:head>

<div class="vp_fill">
	<div class="top_menu">
		<div class="top_menu_item">
			<IconButton on:click={() => {}}>
				<Icon tag="svg" viewBox="0 0 24 24">
					<path fill="primary" d={mdiMenu} />
				</Icon>
			</IconButton>
		</div>
		<div class="spacer"></div>
		<div class="top_menu_item">
			<i>{user}</i>
		</div>
		<div class="top_menu_item">
			<Select
				label="Rotation"
				bind:value={rotation}
				>
				{#each rotations as rotation}
					<Option value={rotation}>{rotation}</Option>
				{/each}
			</Select>
		</div>
		<div class="top_menu_item">
			<IconButton on:click={() => (dark_mode = !dark_mode)} toggle pressed={dark_mode}>
				<Icon tag="svg" viewBox="0 0 24 24" on>
					<path fill="primary" d={mdiThemeLightDark} />
				</Icon>
				<Icon tag="svg" viewBox="0 0 24 24">
					<path fill="primary" d={mdiThemeLightDark} />
				</Icon>
			</IconButton>
		</div>
	</div>
	<div class="page">
		<Button
			on:click={() => {
				tauriDebug("Debug test");
			}}>Test Debug</Button
		>
		<Button
			on:click={() => {
				//specificQuery("2150241","2103TEST"); //this should pull up a 7/26/22 CR for "TEST,DUMMY"
				specificQuery("FOO","BAR"); //this is intentionally nonsensical
			}}>Test Specific Query</Button
		>
	</div>
</div>

<style>
	.vp_fill {
		width: 100vw;
		height: 100vh;
		max-width: 100vw;
		max-height: 100vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.top_menu {
		display: flex;
		flex-direction: row;
	}
	.top_menu_item
	{
		display:flex;
		align-items:center;
		height: 100%;
	}
	.page {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		min-height: 1px;
	}
	.spacer {
		flex-grow: 1;
	}
</style>
