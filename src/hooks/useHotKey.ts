import { DependencyList, useEffect } from "react";

type KeyboardCallback = (e: KeyboardEvent) => void;
const subscriptions: { callback: KeyboardCallback; id: string }[] = [];

if (typeof window !== "undefined") {
	document.addEventListener("keydown", e => {
		for (const subscription of subscriptions) {
			subscription.callback(e);
		}
	});
	document.addEventListener("keyup", e => {
		for (const subscription of subscriptions) {
			subscription.callback(e);
		}
	});
}

export function useHotKeys(
	callback: KeyboardCallback,
	id: string,
	deps?: DependencyList | null
) {
	useEffect(() => {
		subscriptions.push({ callback, id });
		return () => {
			const index = subscriptions.findIndex(s => s.id === id);
			if (index >= 0) {
				subscriptions.splice(index, 1);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [callback, ...(deps ?? [])]);
}
