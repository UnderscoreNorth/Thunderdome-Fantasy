import { writable } from 'svelte/store';
export type Game = {
	name: string;
	map: Record<string, TerrainType>;
	islands: Record<string, string>;
	center: {
		q: number;
		s: number;
		r: number;
	};
	diameter: number;
	chars: Char[];
	time: {
		day: number;
		hour: number;
		minute: number;
	};
	msg: string;
	burned: string[];
};
export type TerrainType = {
	q: number;
	s: number;
	r: number;
	icon: string;
	type: string;
	elevation: number;
	groupID: string;
};
export type Char = {
	name: string;
	group: string;
	id: number;
	img: string;
	stats: {
		health: number;
		maxHealth: number;
		energy: number;
		maxEnergy: number;
		sightRange: number;
		intimidation: number;
		moveSpeed: number;
		kills: number;
		meleeExp: number;
		rangeExp: number;
		magicExp: number;
		survivalExp: number;
		combatRange: number;
	};
	situation: {
		visibility: number;
		awareOf: Char[];
		inRangeOf: Char[];
		vision: string[];
		seen: string[];
		been: string[];
	};
	coord: {
		q: number;
		s: number;
		r: number;
	};
	equip: {
		weapon?: {
			name: string;
			uses: number;
			rangeBonus: number;
		};
		armor?: {
			name: string;
			uses: number;
		};
	};
	death: string;
	path?: string[];
	log: Array<[string, string]>;
};
export const game = writable<Game>();
export const selectedCharID = writable<number | undefined>(undefined);
export const selectedIsland = writable<string | undefined>(undefined);
export type View = {
	renderSize: number;
	zoom: number;
	x: number;
	y: number;
	xDiff: number;
	yDiff: number;
};
export const view = writable<View>({
	zoom: 1,
	x: 0,
	y: 0,
	xDiff: 0,
	yDiff: 0,
	renderSize: 3000
});
export type Cube = { q: number; s: number; r: number };
