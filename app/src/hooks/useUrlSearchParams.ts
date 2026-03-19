import { useSearchParams } from 'react-router-dom';

export default function useUrlSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  function setParams(key: string, value: string | null) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set(key, value || '');
        return params;
      },
      { replace: true },
    );
  }
  function getParam(key: string) {
    return searchParams.get(key);
  }
  function deleteAllParams() {
    setSearchParams({});
  }
  function deleteParams(keys: string[]) {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    for (const key of keys) {
      newSearchParams.delete(key);
    }
    setSearchParams(newSearchParams);
  }
  return {
    setParams,
    getParam,
    deleteAllParams,
    deleteParams,
  };
}
