import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const CURRENCY_KEY = '@currency_pref';

export function useCurrencyPref() {
  const [currency, setCurrencyState] = useState('₺');

  useEffect(() => {
    AsyncStorage.getItem(CURRENCY_KEY).then(val => {
      if (val) setCurrencyState(val);
    });
  }, []);

  const setCurrency = useCallback(async (c: string) => {
    setCurrencyState(c);
    await AsyncStorage.setItem(CURRENCY_KEY, c);
  }, []);

  return { currency, setCurrency };
}
