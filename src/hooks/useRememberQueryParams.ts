import { useSearchParams } from "react-router";

export const useRememberQueryParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentParams = Object.fromEntries(searchParams.entries());

  const setQueryParams = (params, config = { retain: false }) => {
    const newParams = {
      ...(config.retain ? Object.fromEntries(searchParams.entries()) : {}),
    };

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        delete newParams[key];
      } else {
        newParams[key] = String(value);
      }
    });

    setSearchParams(newParams);
  };

  const removeQueryParams = (paramKey) => {
    if (!paramKey) {
      setSearchParams({});
      return;
    }

    const newParams = Object.fromEntries(searchParams.entries());
    const keysToRemove = Array.isArray(paramKey) ? paramKey : [paramKey];

    keysToRemove.forEach((key) => {
      delete newParams[key];
    });

    setSearchParams(newParams);
  };

  const resetAfterArchive = () => {
    const retained = Object.fromEntries(searchParams.entries());
    retained.status = "1";
    setSearchParams(retained);
  };

  const resetAfterRestore = () => {
    const retained = Object.fromEntries(searchParams.entries());
    retained.status = "0";
    setSearchParams(retained);
  };

  return [
    currentParams,
    setQueryParams,
    removeQueryParams,
    resetAfterArchive,
    resetAfterRestore,
  ];
};
