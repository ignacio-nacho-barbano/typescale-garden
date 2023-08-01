<script lang="ts">
	import GithubIcon from 'svelte-material-icons/Github.svelte';
	import LinkedinIcon from '../../static/linkedin.svg';
	import Mail from 'svelte-material-icons/EmailOutline.svelte';
	import Cube from 'svelte-material-icons/CubeOutline.svelte';
	import Id from 'svelte-material-icons/CardAccountDetailsOutline.svelte';
	import IdCard from 'svelte-material-icons/IdCard.svelte';
	import Flag from 'svelte-material-icons/FlagOutline.svelte';
	import Location from 'svelte-material-icons/MapMarker.svelte';
	import Calendar from 'svelte-material-icons/CalendarBadgeOutline.svelte';
	import Clock from 'svelte-material-icons/ClockTimeFiveOutline.svelte';
	import { onMount } from 'svelte';
	import { getInTouch, routes } from './routes';

	const data = {
		linkedin: 'https://www.linkedin.com/in/ignacio-barbano',
		github: 'https://github.com/ignacio-nacho-barbano',
		email: 'nacho.barbano.dev@gmail.com',
		thingiverse: 'https://www.thingiverse.com/ignaciobarbanodesigner/designs'
	};
	const title = 'Contact';
	let time = new Date();

	$: uyTime = time.toLocaleString('en-US', {
		timeZone: 'America/Montevideo',
		hour12: true,
		timeStyle: 'short'
	});

	onMount(() => {
		const interval = setInterval(() => {
			time = new Date();
		}, 10000);

		return () => {
			clearInterval(interval);
		};
	});

	// @ts-ignore
	const timePassed = new Date(Date.now() - new Date('14-sep-1997'));
	const age = Math.abs(timePassed.getUTCFullYear() - 1970);
</script>

<!-- <SvelteHead {title} description="Get in touch with me" /> -->
<article id={routes[3].id} class="container">
	<h1 class="title3">{title}</h1>
	<section class="personal-data text-container">
		<h2 class="title6">Personal data</h2>
		<div class="personal-data-blocks">
			<ul>
				<li>
					<div class="icon"><Id size="32" ariaHidden /></div>
					<p class="secondary">Full name:</p>
					<p class="sub-heading primary">Ignacio Rafael Barbano Panisello</p>
				</li>
				<li>
					<div class="icon"><Mail size="32" ariaHidden /></div>
					<p class="secondary">Age:</p>
					<p class="sub-heading primary">{age}</p>
				</li>

				<li>
					<div class="icon"><Calendar size="32" ariaHidden /></div>
					<p class="secondary">Birthdate:</p>
					<p class="sub-heading primary">September 14, 1997</p>
				</li>
				<li>
					<div class="icon"><Location size="32" ariaHidden /></div>
					<p class="secondary">Location:</p>
					<p class="sub-heading primary">Montevideo, Uruguay</p>
				</li>
				<li>
					<div class="icon"><Flag size="32" ariaHidden /></div>
					<p class="secondary">Nationality:</p>
					<p class="sub-heading primary">Uruguayan</p>
				</li>
				<li>
					<div class="icon"><Clock size="32" ariaHidden /></div>
					<p>Timezone:</p>
					<p class="sub-heading primary">
						GMT-3 <small class="secondary">(It's currently {uyTime} for me 😁)</small>
					</p>
				</li>
				<li>
					<div class="icon"><IdCard size="32" ariaHidden /></div>
					<p class="secondary">Valid international documents:</p>
					<p class="sub-heading primary">Passport and US Visa</p>
				</li>
			</ul>
			<ul class="links glass">
				<li>
					<div class="icon"><LinkedinIcon height="32" width="32" class="li-icon" ariaHidden /></div>
					<a class="secondary" target="_blank" href={data.linkedin}>LinkedIn</a>
				</li>
				<li>
					<div class="icon"><GithubIcon size="32" ariaHidden /></div>
					<a class="secondary" target="_blank" href={data.github}>Github</a>
				</li>
				<li>
					<div class="icon"><Mail size="32" ariaHidden /></div>
					<a class="secondary" target="_blank" href={getInTouch.url}>{data.email}</a>
				</li>
				<li>
					<div class="icon"><Cube size="32" ariaHidden /></div>
					<a class="secondary" target="_blank" href={data.thingiverse}>Thingiverse</a>
				</li>
			</ul>
		</div>
	</section>
	<section class="text-container">
		<h2 class="title5">What Inspires Me</h2>
		<p>
			I aspire to work on awesome products that solve real problems while being ethically
			responsible towards society, the environment, and economics.
		</p>
	</section>
	<section class="text-container">
		<h2 class="title5">My Dream Team</h2>
		<p>
			The ideal team for me is one where there are people from whom I can learn, encouraging and
			inspiring others, with lots of collaboration, responsibility, and trust, that builds upon
			healthy human connections and personal growth to achieve success and product excellence.
		</p>
	</section>
	<section class="text-container">
		<h2 class="title5">My Hobbies and Things I Like</h2>
		<p>
			I really enjoy spending time with people I love , playing bass and singing, Bouldering and
			water sports, cooking, playing video-games and, sometimes Painting.
		</p>
	</section>
</article>

<style lang="scss">
	section {
		margin-top: $s6;
	}

	ul {
		list-style: none;
	}

	.personal-data-blocks {
		display: flex;
		flex-wrap: wrap;
		gap: $s6;

		.links {
			display: flex;
			width: 100%;
			justify-content: center;
			padding: $s3 0 $s4;
			border-radius: $s4;
			gap: 0 $s4;
			flex-wrap: wrap;
			li {
				display: flex;
				gap: $s2;
				align-content: center;

				.icon {
					width: $s5;
					height: $s5;
					align-items: center;
					justify-content: center;
				}

				:global(svg path) {
					fill: $c-accent;
				}
			}
		}
	}

	li {
		display: grid;
		grid-template-columns: 44px auto;
		grid-template-rows: auto auto;
		align-items: center;
		margin-top: 12px;

		p,
		a {
			grid-column: 2/3;
		}

		a {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.icon {
			grid-row: 1/3;
			display: flex;
			align-items: center;
			justify-content: flex-start;
		}
	}
</style>
