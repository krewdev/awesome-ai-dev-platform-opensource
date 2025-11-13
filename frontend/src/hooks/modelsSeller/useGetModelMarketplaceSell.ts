
import React from "react";
import { useApi } from "@/providers/ApiProvider";
import { TModelMarketplaceSell } from "./useGetModelMarketplaceListSell";
import useDebouncedEffect from "../useDebouncedEffect";

export type TModelHook = {
  loading: boolean;
  errorLoading: string | null;
  detail: TModelMarketplaceSell | null;
};

/**
 * Fetch model information.
 *
 * @param {string | undefined} id
 */
export default function useGetModelMarketplaceSell(id?: string): TModelHook {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [errorLoading, setErrorLoading] = React.useState<null | string>(null);
  const [detail, setDetail] = React.useState<TModelMarketplaceSell | null>(null);
  const api = useApi();

  useDebouncedEffect(() => {
    // FIX: Implement stricter input validation. Ensure the ID is a non-empty string
    // that represents a positive integer before attempting the API call. This prevents
    // unnecessary requests with malformed or negative IDs.
    if (!id) {
      return;
    }
    
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return;
    }

    setLoading(true);
    setErrorLoading(null);

    // The ID is passed as a parameter. We assume the underlying api.call abstraction
    // handles secure transport (HTTPS) and that the backend properly validates and
    // sanitizes this input (e.g., using parameterized queries).
    const ar = api.call("getModel", {
      params: { id },
    });

    ar.promise
      .then(async (r) => {
        if (ar.controller.signal.aborted) {
          return;
        }

        const data = await r.json();
        setDetail(data);
      })
      .catch((e) => {
        if (ar.controller.signal.aborted) {
          return;
        }

        let msg = "An error occurred while loading model information.";

        if (e instanceof Error) {
          // Error messages are stored in state and assumed to be rendered safely
          // by React (auto-escaping text content), preventing XSS.
          msg += " Error: " + e.message + ".";
        }

        setErrorLoading(msg + " Please try again!");

        if (window.APP_SETTINGS.debug) {
          console.error(e);
        }
      })
      .finally(() => {
        if (ar.controller.signal.aborted) {
          return;
        }

        setLoading(false);
      });

    return () => {
      ar.controller.abort();
    };
  }, [api, id]);

  return React.useMemo(() => {
    return {
      loading,
      errorLoading,
      detail,
    };
  }, [loading, errorLoading, detail]);
}

$
