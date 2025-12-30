import type { IconifyIconHTMLElement } from "iconify-icon";

export {};

declare module "@builder.io/qwik" {
	interface HTMLElementTagNameMap {
		script: HTMLScriptElement & {
			src: string;
		};
		"iconify-icon": IconifyIconHTMLElement & {
			icon: string;
		};
	}
}
