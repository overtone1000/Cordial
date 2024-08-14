<script lang="ts">
	import { mdiThemeLightDark } from '@mdi/js';
	import IconButton, { Icon } from '@smui/icon-button';
	import Button from '@smui/button';
	import { invoke } from '@tauri-apps/api';
	import type { InvokeArgs } from '@tauri-apps/api/tauri';

	const light_css = '/smui.css';
	const dark_css = '/smui-dark.css';
	let dark_mode: boolean | undefined = undefined;

	type Interaction = DebugInteraction;
	interface DebugInteraction {
		debug: string;
	}

	interface InteractionArgument extends InvokeArgs {
		interaction: Interaction;
	}

	let tauriInteraction = (arg: InteractionArgument) => {
		console.debug('Sending tauri interaction', arg);
		invoke('tauri_ui_interaction', arg)
			.then((res: any) => {
				console.log('tauri_ui_interaction: ', res);
			})
			.catch((e: any) => console.error('tauri_ui_interaction', e));
	};

	let tauriDebug = (message: string) => {
		tauriInteraction({
			interaction: {
				debug: message
			}
		});
	};
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
		<div class="top_menu_item"></div>
		<div class="spacer"></div>
		<div class="top_menu_item">
			<IconButton on:click={() => (dark_mode = !dark_mode)} toggle pressed={dark_mode}>
				<Icon tag="svg" viewBox="0 0 24 24" on>
					<path fill="currentColor" d={mdiThemeLightDark} />
				</Icon>
				<Icon tag="svg" viewBox="0 0 24 24">
					<path fill="currentColor" d={mdiThemeLightDark} />
				</Icon>
			</IconButton>
		</div>
	</div>
	<div class="page">
		<Button
			on:click={() => {
				tauriDebug('Test Debug');
			}}>Test Debug</Button
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
