<script lang="ts">
	export let title: string = "Typescale Garden";
	export let description: string =
		"Typescale Garden is a typescale creation tool. It allows you to generate a typographic scale and export css and figma tokens out of it, directly into design trough the official figma plugin. A useful tool for people working with design systems.";
	const ogImage =
		"https://raw.githubusercontent.com/ignacio-nacho-barbano/typescale-garden/main/client/static/logo.svg";
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://typescalegarden.uy" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:secure_url" content={ogImage} />
	<meta property="og:image:type" content="image/svg+xml" />
	<meta property="og:image:width" content="144" />
	<meta property="og:image:height" content="144" />
	<meta property="og:image:alt" content="Typescale Garden Logo" />
</svelte:head>
