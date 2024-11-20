export type Game = {
	map: {
		array: TerrainType[][];
	};
	center: {
		x: number;
		y: number;
	};
	diameter: number;
	chars: Char[];
	time: {
		day: number;
		hour: number;
		minute: number;
	};
	msg: string;
};
export type TerrainType = {
	x: number;
	y: number;
	icon: string;
	type: string;
	elevation: number;
};
export type Char = {
	name: string;
	group: string;
	id: number;
	img: string;
	statusMessage: string;
	stats: {
		health: number;
		maxHealth: number;
		energy: number;
		maxEnergy: number;
		sightRange: number;
		intimidation: number;
		moveSpeed: number;
		kills: number;
		combatExp: number;
		survivalExp: number;
	};
	situation: {
		x: number;
		y: number;
		visibility: number;
		awareOf: Char[];
		inRangeOf: Char[];
		vision: string[];
		seen: string[];
		been: string[];
	};
	equip: {
		weapon?: {
			name: string;
			uses: number;
		};
	};
	death: string;
	path?: Array<[number, number]>;
	log: string[];
};
