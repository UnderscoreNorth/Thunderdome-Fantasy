import CONFIG from '$lib/config.json';
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
