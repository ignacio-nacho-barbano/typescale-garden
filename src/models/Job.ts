export type Tech =
	| 'react'
	| 'apollo'
	| 'node'
	| 'express'
	| 'sql'
	| 'php'
	| 'angular'
	| 'git'
	| 'js'
	| 'figma';

export type Job = {
	id: number;
	position: string;
	company: string;
	location: string;
	description: string;
	logo: string | ConstructorOfATypedSvelteComponent | Icon;
	startDate: string;
	endDate: string;
	website: string;
	images?: string[];
	techs?: Tech[];
};
