type Listener = () => void;

const investmentsListeners = new Set<Listener>();

export function onInvestmentsChanged(listener: Listener) {
	investmentsListeners.add(listener);
	return () => {
		investmentsListeners.delete(listener);
	};
}

export function emitInvestmentsChanged() {
	investmentsListeners.forEach((l) => {
		try {
			l();
		} catch {
			// no-op
		}
	});
}


