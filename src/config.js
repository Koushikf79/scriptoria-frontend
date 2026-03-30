const rawApiUrl = import.meta.env.VITE_API_URL;
console.log('API URL:', import.meta.env.VITE_API_URL);

export const API = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : '';
export const API_V1 = API ? `${API}/api/v1` : '';
export const WS_API = API ? API.replace(/^https/, 'wss').replace(/^http/, 'ws') : '';

export function ensureApiConfigured(context) {
	if (!API) {
		console.error(`[Scriptoria] Missing VITE_API_URL while running: ${context}`);
		throw new Error('Missing VITE_API_URL configuration');
	}
}
