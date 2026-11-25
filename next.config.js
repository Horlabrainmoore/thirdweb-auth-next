/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	webpack: (config) => {
		config.externals.push("pino-pretty", "lokijs", "encoding");
		return config;
	},
	headers: async () => [
		{
			source: "/(.*)",
			headers: [
				{ key: "X-Content-Type-Options", value: "nosniff" },
				{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
				{ key: "Strict-Transport-Security", value: "max-age=63072000" },
				{ key: "X-Frame-Options", value: "SAMEORIGIN" },
				{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
			],
		},
	],
};

module.exports = nextConfig;
