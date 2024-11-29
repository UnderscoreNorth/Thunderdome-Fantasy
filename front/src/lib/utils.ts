import CONFIG from '$lib/config.json';
import { type Cube } from './classes';
export async function api(url: string, body?: object) {
	return await fetch(
		`${CONFIG.api}${url}`,
		body == undefined
			? {}
			: {
					method: 'post',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(body)
				}
	).then(async (result) => {
		return await result.json();
	});
}
export function fromCube({ q, s, r }: Cube) {
	return `${q},${s},${r}`;
}
export function toCube(qsr: string): Cube {
	const split = qsr.split(',').map((i) => parseInt(i));
	const sum = split.reduce((a, b) => a + b, 0);
	//if (sum !== 0) throw `${qsr} needs to sum to zero`;
	if (split.length !== 3) throw `${qsr} must be 3 components`;
	return {
		q: split[0],
		s: split[1],
		r: split[2]
	};
}
