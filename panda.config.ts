import { defineConfig } from "@pandacss/dev";

export default defineConfig({
	jsxFramework: "qwik",
	preflight: true,
	include: ["./src/**/*.{js,jsx,ts,tsx}"],
	exclude: [],
	conditions: {
		extend: {
			userLight: "[data-color-mode=light] &",
		},
	},
	globalFontface: {
		"IBM Plex Sans Variable": [
			{
				fontStyle: "normal",
				fontDisplay: "swap",
				fontWeight: "100 700",
				src: "url(https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans:vf@latest/latin-wght-normal.woff2) format('woff2-variations')",
				unicodeRange:
					"U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
			},
			// latin-ext
			{
				fontStyle: "normal",
				fontDisplay: "swap",
				fontWeight: "100 700",
				src: "url(https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans:vf@latest/latin-ext-wght-normal.woff2) format('woff2-variations')",
				unicodeRange:
					"U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
			},
		],
		"Space Grotesk Variable": [
			{
				fontStyle: "normal",
				fontDisplay: "swap",
				fontWeight: "300 700",
				src: "url(https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk:vf@latest/latin-wght-normal.woff2) format('woff2-variations')",
				unicodeRange:
					"U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
			},
		],
	},
	globalVars: {
		"--font-sans-fallback":
			'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
		"--font-ibm-plex": "'IBM Plex Sans Variable'",
		"--font-space-grotesk": "'Space Grotesk Variable'",
	},
	globalCss: {
		html: {
			"--global-font-body": "var(--font-ibm-plex), var(--font-sans-fallback)",
		},
		":root": {
			colorScheme: "light dark",
		},
	},
	theme: {
		extend: {
			tokens: {
				fonts: {
					ibmPlex: {
						value: "var(--font-ibm-plex), var(--font-sans-fallback)",
					},
					spaceGrotesk: {
						value: "var(--font-space-grotesk), var(--font-sans-fallback)",
					},
				},
			},
			semanticTokens: {
				colors: {
					bg: {
						DEFAULT: {
							value: {
								base: "{colors.zinc.900}",
								_userLight: "white",
								_osLight: "white",
							},
						},
						selected: {
							value: {
								base: "{colors.sky.900/20}",
								_userLight: "{colors.sky.50}",
								_osLight: "{colors.sky.50}",
							},
						},
					},
					text: {
						body: {
							value: {
								base: "{colors.zinc.300}",
								_userLight: "{colors.zinc.700}",
								_osLight: "{colors.zinc.700}",
							},
						},
						heading: {
							value: {
								base: "{colors.zinc.50}",
								_userLight: "black",
								_osLight: "black",
							},
						},
						hover: {
							value: {
								base: "{colors.sky.600}",
								_userLight: "{colors.sky.700}",
								_osLight: "{colors.sky.700}",
							},
						},
					},
					border: {
						value: {
							base: "{colors.zinc.800}",
							_userLight: "{colors.stone.200}",
							_osLight: "{colors.stone.200}",
						},
					},
				},
			},
			textStyles: {
				body: {
					value: {
						fontFamily: "{fonts.ibmPlex}",
						fontWeight: "normal",
					},
				},
				display: {
					value: {
						fontFamily: "{fonts.spaceGrotesk}",
						fontWeight: 500,
					},
				},
			},
		},
	},
	outdir: "src/styled-system",
});
