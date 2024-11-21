import { writable } from 'svelte/store';
export type Game = {
	map: TerrainType[][];
	islands: Record<string, string>;
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
	glow: boolean;
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
		armor?: {
			name: string;
			uses: number;
		};
	};
	death: string;
	path?: Array<[number, number]>;
	log: string[];
};
export const game = writable<Game>(undefined);
export const selectedCharID = writable<number | undefined>(undefined);
export const selectedIsland = writable<string | undefined>(undefined);
export const view = writable<{
	renderSize: number;
	zoom: number;
	x: number;
	y: number;
	xDiff: number;
	yDiff: number;
}>({
	zoom: 1,
	x: 0,
	y: 0,
	xDiff: 0,
	yDiff: 0,
	renderSize: 2000
});
