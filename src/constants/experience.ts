import type { Job } from '../models';
import EucdLogo from '../../raw-assets/eucd-logo.png?w=136&format=webp';
import ThingiverseLogo from '../../static/thingiverse.svg';
import EmLogo from '../../static/em-logo.svg';
import SenpaiLogo from '../../static/senpai-logo.svg';
import OortLogo from '../../static/oort-logo.svg';
import ExpertasteLogo from '../../static/expertaste-logo.svg';

export const college: Job = {
	id: 0,
	company: 'EUCD | Facultad de Arquitectura | UdelaR',
	position: 'Product Designer',
	description:
		'The degree program places a strong emphasis on management and methodological aspects of the design process, as well as the development of essential skills needed to design and develop innovative products and services. Additionally, the program prioritizes the ethical and social dimensions of design, preparing professionals who are capable of working effectively in transdisciplinary teams that embrace diverse perspectives and ways of life.',
	endDate: 'Paused - 307/360 Credits completed',
	startDate: 'March - 2016',
	location: 'Montevideo, Uruguay',
	website: 'http://www.fadu.edu.uy/institucion/eucd-institucion/',
	logo: EucdLogo
};

export const experiences: Job[] = [
	{
		id: 1,
		company: 'Senpai',
		position: 'Full Stack Tutor',
		description:
			'Tutoring the students taking the Full Stack Bootcamp at Senpai. I help them with their projects and guide them through the learning process. The technologies used are React, SQL, Node, Express and all of the underlying web fundamentals.',
		startDate: 'Feb 2023',
		endDate: 'Present',
		location: 'Montevideo, Uruguay | Remote',
		logo: SenpaiLogo,
		website: 'https://senpaiacademy.co',
		// images: [Class],
		techs: ['react', 'node', 'express', 'sql', 'js']
	},
	{
		id: 2,
		company: 'EquityMultiple',
		position: 'Growth Engineer',
		description: `Modern web-app based on Typescript, React and Gatsby migrating the old Wordpress base into the new rebranded updated site. Result can be seen at <a href="https://www.equitymultiple.com" target="_blank">EquityMultiple's Website</a>.`,
		startDate: 'Aug 2022',
		endDate: 'Feb 2023',
		location: 'New York, United States | Remote',
		logo: EmLogo,
		website: 'https://www.equitymultiple.com'
	},
	{
		id: 3,
		company: 'EquityMultiple',
		position: 'Lead Design System Designer',
		description: `Lead Design System Designer, marketing website project manager, and Front-End developer. Some of the work I did here can be seen at <a href="https://www.equitymultiple.com" target="_blank">EquityMultiple's Website</a>.`,
		startDate: 'Mar 2022',
		endDate: 'Aug 2022',
		location: 'New York, United States | Remote',
		logo: EmLogo,
		website: 'https://www.equitymultiple.com'
	},
	{
		id: 4,
		company: 'Oort',
		position: 'Product Designer',
		description:
			'Assisting the Lead Designer and Product Manager with the exploration and design of new features as well as the Design System of the brand to be used on the product.',
		startDate: 'Oct 2021',
		endDate: 'Mar 2022',
		location: 'Detroit, United States | Remote',
		logo: OortLogo,
		website: 'https://www.oort.io'
	},
	{
		id: 5,
		company: 'Oort',
		position: 'Front-End Developer',
		description:
			'Front-End developer working on developing and testing new features for the main product.',
		startDate: 'May 2021',
		endDate: 'Oct 2021',
		location: 'Detroit, United States | Remote',
		logo: OortLogo,
		website: 'https://www.oort.io'
	},
	{
		id: 6,
		company: 'Expertaste',
		position: 'UX Designer & Software Engineer',
		description:
			"This was a small re-design project for a sampling application's dashboard with significantly different user goals to be achieved by the various persons using the system. I was in charge of the design of these new dashboards, and then I assisted in their development. It was very interesting as the project wasn't functioning for them so we injected a micro-fronted with Svelete that was extremely light,  without re-building the application which had no maintainers at the time the project was requested. Despite that major challenge, this solution allowed us to deliver a successful project.",
		startDate: 'Feb 2021',
		endDate: 'March 2021',
		location: 'Raleigh, United States | Remote',
		logo: ExpertasteLogo,
		website: 'https://www.equitymultiple.com'
	},
	{
		id: 7,
		company: 'Open Source Project, Thingiverse',
		position: 'Product Designer & Production Line Designer',
		description: `Open source face shield design where I took care of topography optimization intending to drastically reduce production time and cost, designing manufacturing tools that could also be printed or found at a low cost, and also designed the production steps and tutorials for setting up a small production line for a local hospital. The final result was an optimization of around 300% in production speed and material usage with the project's production successfully delivered to a local hospital. The final result can be found here <a href="https://www.thingiverse.com/thing:4311425" target="_blank">Thingiverse Project</a>`,
		startDate: 'Mar 2020',
		endDate: 'Aug 2020',
		location: 'Montevideo, Uruguay | Remote',
		logo: ThingiverseLogo,
		website: 'https://www.equitymultiple.com'
	},
	{
		id: 8,
		company: 'Globant',
		position: 'Front-End Developer',
		description:
			'Started at Globant through the Code Your Future boot camp where I had the opportunity to kickstart a career in the IT world. I worked for two different clients, being part of different teams in charge of both starting projects from scratch and maintaining old ones. Worked with several Front-End technologies like React, Angular, Typescript, RXJs, and several testing frameworks (Jest, Mocha, Storybook). As part of a team, I worked with agile methods, mainly Scrum and Kanban, with a strong focus on meaningful work partnership and compromise, as well as embracing code quality through the code review phases and receiving feedback on my part of the code as well. ',
		startDate: 'Mar 2019',
		endDate: 'Apr 2021',
		location: 'Montevideo, Uruguay',
		logo: 'https://openqube.io/wp-content/uploads/2015/06/Short-Original-501x330.png',
		website: 'https://www.equitymultiple.com'
	}
];
