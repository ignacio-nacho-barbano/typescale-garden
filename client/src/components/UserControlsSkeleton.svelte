<!--
	Stands in for UserControls while the silent login is still resolving — including in
	the SSR pass, where auth is never known. Geometry mirrors UserControls (40px avatar,
	the name hidden below $bp-l, room for the chevron) so the swap costs no layout shift.
-->
<div class="user-controls-skeleton" aria-hidden="true">
	<div class="avatar" />
	<div class="name" />
	<div class="chevron" />
</div>
<span class="visually-hidden" aria-live="polite">Loading account</span>

<style lang="scss">
	.user-controls-skeleton {
		height: 40px;
		display: flex;
		align-items: center;
		gap: $s3;
		flex: 0 0 auto;
	}

	.avatar {
		@include skeleton;
		height: 100%;
		aspect-ratio: 1;
		flex: 0 0 auto;
		border-radius: 50%;
	}

	// Matches #user-name in UserControls: absent until $bp-l.
	.name {
		@include skeleton;
		display: none;

		@media ($bp-l) {
			display: block;
			width: 72px;
			height: $s3;
		}
	}

	// Placeholder for the <Icon>expand_more</Icon>, which renders at 24px.
	.chevron {
		@include skeleton;
		width: 24px;
		height: $s3;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
</style>
