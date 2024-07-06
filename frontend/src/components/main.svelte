<script lang="ts">
  import { onMount } from "svelte";
	
  const light_css = "/smui.css";
	const dark_css = "/smui-dark.css";

	let dark_mode:boolean|undefined=undefined;

  let resp = "Loading..."

  onMount(() => {
      
  });

  
</script>

<svelte:head>
  {#if dark_mode === undefined}
  <link
    rel="stylesheet"
    href={light_css}
    media="(prefers-color-scheme: light)"
  />
  <link
    rel="stylesheet"
    href={dark_css}
    media="screen and (prefers-color-scheme: dark)"
  />
  {:else if dark_mode}
	<link rel="stylesheet" href={light_css} media="print" />
	<link rel="stylesheet" href={dark_css} media="screen" />
  {:else}
  	<link rel="stylesheet" href={light_css} />
  {/if}
</svelte:head>


<div>
	{resp}
</div>

<style>
	
</style>
