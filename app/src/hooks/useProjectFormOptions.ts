import { useMemo } from 'react';
import currencyCodes from 'currency-codes';
import { State, City } from 'country-state-city';

// Currency options (static)
export const useCurrencyOptions = () =>
  useMemo(
    () =>
      currencyCodes.codes().map((code) => {
        const currency = currencyCodes.code(code);
        return {
          label: `${currency?.currency} (${currency?.code})`,
          value: currency?.code || '',
        };
      }),
    [],
  );

// Indian states (static)
export const useIndianStates = () =>
  useMemo(
    () =>
      State.getStatesOfCountry('IN').map((s) => ({
        label: s.name,
        value: s.name, // 👈 state name, not code
        isoCode: s.isoCode,
      })),
    [],
  );

// Cities based on selected state
export const useCities = (stateName: string) => {
  const states = useIndianStates();
  return useMemo(() => {
    const state = states.find((s) => s.value === stateName);
    if (!state) return [];
    return City.getCitiesOfState('IN', state.isoCode).map((c) => ({
      label: c.name,
      value: c.name,
    }));
  }, [stateName, states]);
};
