<script lang="ts">
	import Portrait from '../../static/portrait.svg';
	import ProfileCircles from '../../static/profile-circles.svg';
</script>

<div class="illustration-frame">
	<Portrait id="portrait" aria-hidden />
	<ProfileCircles id="profile-circles" aria-hidden />
</div>

<style lang="scss">
	:global(#portrait) {
		z-index: 1;
		position: relative;
	}

	:global(#profile-circles) {
		position: absolute;
		width: 100%;
		left: $s4;
		top: -$s7;
		overflow: visible;
	}
	:global(#profile-circles *) {
		animation: oscilate4x 2s infinite alternate linear both;
	}
	:global(#profile-circles *:first-child) {
		animation-delay: 200ms;
		animation-direction: alternate-reverse;
	}
	:global(#profile-circles *:nth-child(2)) {
		animation-delay: 400ms;
		animation-direction: alternate-reverse;
	}
</style>
