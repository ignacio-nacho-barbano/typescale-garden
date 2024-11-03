<script lang="ts">
	export let title: string = "Typescale Garden";
	export let description: string =
		"Typescale Garden is a typescale creation tool. It allows you to generate a typographic scale and export css and figma tokens out of it, directly into design through the official figma plugin. A useful tool for people working with design systems.";
	const url = "https://typescalegarden.uy";
</script>

<svelte:head>
	<meta charset="UTF-8" />
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta name="googlebot" content="all" />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={url + "/tg-logo.png"} />
	<meta property="og:image:secure_url" content={url + "/tg-logo.png"} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="144" />
	<meta property="og:image:height" content="144" />
	<meta property="og:image:alt" content="Typescale Garden Logo" />
</svelte:head>
