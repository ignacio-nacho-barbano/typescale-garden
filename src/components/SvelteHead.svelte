<script lang="ts">
	export let title: string = '';
	export let description: string = '';
	const ogImage = '../../logo.png';

	const fullTitle = `${title} | Nacho Barbano`;
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://nacho-barbano.netlify.app" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:secure_url" content={ogImage} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="136" />
	<meta property="og:image:height" content="136" />
	<meta property="og:image:alt" content="Nacho Barbano's personal brand logo" />
</svelte:head>
