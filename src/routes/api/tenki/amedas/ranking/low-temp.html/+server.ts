import { error } from '@sveltejs/kit';

export async function GET() {
	try {
		const response = await fetch('https://tenki.jp/amedas/ranking/low-temp.html');
		if (!response.ok) {
			throw error(500, 'Failed to fetch external URL');
		}
		const html = await response.text();
		return new Response(html, {
			headers: {
				'Content-Type': 'text/html'
			}
		});
	} catch (err) {
		throw error(500, 'Internal server error');
	}
}
