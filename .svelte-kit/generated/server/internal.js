
import root from '../root.js';
import { set_building, set_prerendering } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env } from '../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	csrf_trusted_origins: [],
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hash_routing: false,
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	service_worker_options: undefined,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!DOCTYPE html>\r\n<html lang=\"ja\" class=\"\">\r\n  <head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>ひんやりさがし</title>\r\n    <link rel=\"icon\" href=\"" + assets + "/favicon.png\" />\r\n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\r\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\r\n    <!-- DNS prefetch for external services (only loaded when needed) -->\r\n    <link rel=\"dns-prefetch\" href=\"https://www.google.com\">\r\n    <link rel=\"dns-prefetch\" href=\"https://maps.googleapis.com\">\r\n    <link rel=\"dns-prefetch\" href=\"https://api.openweathermap.org\">\r\n    <link rel=\"dns-prefetch\" href=\"https://generativelanguage.googleapis.com\">\r\n    <link rel=\"preload\" href=\"https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&text=close,light_mode,dark_mode,menu,mode_cool,thermostat,location_on,humidity_low,search,content_copy,database&display=swap\" as=\"style\" onload=\"this.onload=null;this.rel='stylesheet'\">\r\n    <noscript><link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&text=close,light_mode,dark_mode,menu,mode_cool,thermostat,location_on,humidity_low,search,content_copy,database&display=swap\"></noscript>\r\n    \r\n    <!-- Material Symbols フォント読み込み監視スクリプト（レイアウトシフト防止） -->\r\n    <script>\r\n      (async () => {\r\n        try {\r\n          // タイムアウト設定（3秒でフォールバック）\r\n          const fontLoadTimeout = new Promise((_, reject) => \r\n            setTimeout(() => reject(new Error('Font load timeout')), 3000)\r\n          );\r\n          \r\n          // Material Symbolsフォントの読み込み完了を待機\r\n          await Promise.race([\r\n            document.fonts.load('1em \"Material Symbols Outlined\"'),\r\n            fontLoadTimeout\r\n          ]);\r\n          \r\n          // フォント読み込み完了時にクラスを追加してアイコンを表示\r\n          document.documentElement.classList.add('fonts-loaded');\r\n        } catch (error) {\r\n          // フォント読み込みが失敗またはタイムアウトした場合もアイコンを表示\r\n          console.warn('Material Symbols font could not be loaded in time, showing fallback.', error);\r\n          document.documentElement.classList.add('fonts-loaded');\r\n        }\r\n        \r\n        // フォント読み込み状況をログに記録（デバッグ用）\r\n        if (document.fonts) {\r\n          document.fonts.ready.then(() => {\r\n            const materialSymbolsFont = [...document.fonts].find(font => \r\n              font.family.includes('Material Symbols')\r\n            );\r\n            if (materialSymbolsFont) {\r\n              console.log('Material Symbols font status:', materialSymbolsFont.status);\r\n            }\r\n          });\r\n        }\r\n      })();\r\n    </script>\r\n    \r\n    " + head + "\r\n  </head>\r\n  <body data-sveltekit-preload-data=\"hover\" class=\"bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-200\">\r\n    <div style=\"display: contents\">" + body + "</div>\r\n  </body>\r\n</html>\r\n",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "13vnva1"
};

export async function get_hooks() {
	let handle;
	let handleFetch;
	let handleError;
	let handleValidationError;
	let init;
	

	let reroute;
	let transport;
	

	return {
		handle,
		handleFetch,
		handleError,
		handleValidationError,
		init,
		reroute,
		transport
	};
}

export { set_assets, set_building, set_manifest, set_prerendering, set_private_env, set_public_env, set_read_implementation };
