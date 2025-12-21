const investmentsListeners = new Set<() => void>();
const balanceListeners = new Set<(value: number) => void>();

export function onInvestmentsChanged(listener: () => void) {
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

export function onBalanceExpenseChanged(listener: (value: number) => void) {
  balanceListeners.add(listener);
  return () => {
    balanceListeners.delete(listener);
  };
}

export function emitBalanceExpenseChanged(value: number) {
  balanceListeners.forEach((l) => {
    try {
      l(value);
    } catch {
      // no-op
    }
  });
}
