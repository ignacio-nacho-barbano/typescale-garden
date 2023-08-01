<script lang="ts">
	import SkillBlock from '../components/SkillBlock.svelte';
	import Abacus from 'svelte-material-icons/Abacus.svelte';
	import ScaleBalance from 'svelte-material-icons/ScaleBalance.svelte';
	import GestureTapButton from 'svelte-material-icons/GestureTapButton.svelte';
	import AccountHeart from 'svelte-material-icons/AccountHeart.svelte';
	import SeatLegroomExtra from 'svelte-material-icons/SeatLegroomExtra.svelte';
	import CubeScan from 'svelte-material-icons/CubeScan.svelte';
	import Printer3dNozzleOutline from 'svelte-material-icons/Printer3dNozzleOutline.svelte';
	import RobotIndustrial from 'svelte-material-icons/RobotIndustrialOutline.svelte';
	import FileTreeOutline from 'svelte-material-icons/FileTreeOutline.svelte';
	import EyeCheckOutline from 'svelte-material-icons/EyeCheckOutline.svelte';
	import Web from 'svelte-material-icons/Web.svelte';
	import type { Skill } from '../models';
	import { routes } from './routes';
	import Node from '../../static/nodejs.svg';
	import React from '../../static/react.svg';
	import Svelte from '../../static/svelte.svg';
	import Html from '../../static/language-html5.svg';
	import Css from '../../static/language-css3.svg';
	import Php from '../../static/language-php.svg';
	import Git from '../../static/git.svg';
	import Figma from '../../static/figma.svg';
	import Esp from '../../static/esp.svg';
	import Eng from '../../static/eng.svg';
	import Database from '../../static/database-outline.svg';
	import Angular from '../../static/angularjs.svg';

	const title = 'Skills summary';
	const skillGroups: { title: string; skills: Skill[] }[] = [
		{
			title: 'Languages',
			skills: [
				{ graphic: Eng, title: 'Fully fluent spoken and written English' },
				{ graphic: Esp, title: 'Native Spanish' }
			]
		},
		{
			title: 'Development',
			skills: [
				{
					graphic: Abacus,
					title:
						'Understanding of software patterns, good practices for code quality, scalability, readability and maintainability '
				},
				{ graphic: Abacus, title: 'Javascript & Typescript' },
				{
					graphic: React,
					title: 'React | +librarires Mui, styled-components, Apollo GraphQl, react-hook-forms'
				},
				{ graphic: Svelte, title: 'Svelte & SvelteKit' },
				{ graphic: RobotIndustrial, title: 'Cypress E2E, Integration testing, and Unit testing' },
				{ graphic: Database, title: 'SQL' },
				{ graphic: Php, title: 'PHP' },
				{ graphic: Node, title: 'NodeJS and Express' },
				{ graphic: Angular, title: 'Angular 8+ Material, lazy loading, complex services' },
				{ graphic: Html, title: 'HTML5, Semantics, Accessibility' },
				{ graphic: Css, title: 'CSS3, OOCSS, BEM, Layered CSS, Atomic Composition' },
				{ graphic: Git, title: 'Git, Github, and version control hygiene' }
			]
		},
		{
			title: 'Product Design',
			skills: [
				{
					graphic: AccountHeart,
					title:
						'Design Thinking, Knowledge of product design schools such as HCD, Blue Economy, Biomimicry, and circular economies'
				},
				{ graphic: ScaleBalance, title: 'Studies on design ethics' },
				{ graphic: SeatLegroomExtra, title: 'Ergonomics and ergonomic research practices' },
				{
					graphic: CubeScan,
					title: 'Advanced cad 3D modeling and AI assisted Generative Design'
				},
				{ graphic: Printer3dNozzleOutline, title: '3D printing and prototyping' },
				{ graphic: Figma, title: 'Figma design, componentization and prototyping' },
				{ graphic: GestureTapButton, title: 'User interviewing and surveying' },
				{
					graphic: FileTreeOutline,
					title: 'Understanding of good information acrchitecture fundamentals'
				},
				{ graphic: EyeCheckOutline, title: 'Accessible color usage for UI' }
			]
		}
	];
</script>

<article id={routes[2].id} class="container">
	<h1 class="title3">Skills</h1>
	{#each skillGroups as group}
		<section class="text-container">
			<h2 class="title5">{group.title}</h2>
			<ul>
				{#each group.skills as skill}
					<SkillBlock data={skill} />
				{/each}
			</ul>
		</section>
	{/each}
</article>

<style lang="scss">
	section {
		width: 100%;
		justify-content: center;
		margin-top: $s6;
	}

	:global(.skill-block) {
		margin-top: $s3;
	}
</style>
