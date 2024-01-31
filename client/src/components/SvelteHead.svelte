<script lang="ts">
	export let title: string = "Typescale Garden";
	export let description: string = "A typescale creation tool.";
	const ogImage = "../../tg-logo.png";
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://typescale-garden.netlify.app" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:secure_url" content={ogImage} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="144" />
	<meta property="og:image:height" content="144" />
	<meta property="og:image:alt" content="Typescale Garden Logo" />
</svelte:head>
