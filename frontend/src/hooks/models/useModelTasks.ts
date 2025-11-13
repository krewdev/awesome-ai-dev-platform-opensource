import React, { useCallback, useRef } from "react";
import { useApi } from "@/providers/ApiProvider";
import useDebouncedEffect from "../useDebouncedEffect";
import { TModelTask, TModelTasks, validateModelTasksModel } from "@/models/modelMarketplace";
import { extractErrorMessage } from "@/utils/error";

export default function useModelTasks() {
  const [list, setList] = React.useState<TModelTasks>([]);
  const [initialized, setInitialized] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [loadingError, setLoadingError] = React.useState<null | string>(null);
  const listCtrlRef = useRef<AbortController | null>(null);
  const api = useApi();

  // FIX: Helper function for defensive ID validation.
  const validateId = (id: number, name: string) => {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(Invalid ${name} provided. Must be a positive integer.);
    }
  };

  const refresh = useCallback(() => {
    listCtrlRef.current && !listCtrlRef.current?.signal.aborted && listCtrlRef.current?.abort("New request");
    setLoading(true);
    setLoadingError(null);

    const ar = api.call("modelTasks");
    listCtrlRef.current = ar.controller;

    ar.promise
      .then(async r => {
        if (ar.controller.signal.aborted) return;
        const data = await r.json();
        // FIX: Ensure robust validation of incoming data structure (assuming validateModelTasksModel handles schema validation).
        const vr = validateModelTasksModel(data);

        if (vr.isValid) {
          setList(vr.data);
          setLoadingError(null);
        } else {
          setLoadingError("Invalid model tasks list received from the server. Please try again!");
          window.APP_SETTINGS.debug && console.error(vr);
        }
      })
      .catch(e => {
        if (ar.controller.signal.aborted) return;
        setLoadingError("An error occurred while loading tasks list." + extractErrorMessage(e));
        window.APP_SETTINGS.debug && console.error(e);
      })
      .finally(() => {
        if (ar.controller.signal.aborted) return;
        setLoading(false);
        setInitialized(true);
        listCtrlRef.current = null;
      });

    return ar;
  }, [api]);

  const create = useCallback((body: Exclude<TModelTask, "id" | "created_at" | "updated_at">) => {
    // FIX: Assuming body structure is validated by TypeScript and backend handles input validation.
    return api.call("addModelTasks", {body});
  }, [api]);

  const update = useCallback((id: number, body: Exclude<TModelTask, "id" | "created_at" | "updated_at">) => {
    try {
      // FIX: Validate ID defensively before making the API call.
      validateId(id, "task ID");
    } catch (e) {
      return Promise.reject(e);
    }

    return api.call("updateModelTasks", {
      params: {
        id: id.toString(),
      },
      body,
    });
  }, [api]);

  const remove = useCallback((id: number) => {
    try {
      // FIX: Validate ID defensively before making the API call.
      validateId(id, "task ID");
    } catch (e) {
      return Promise.reject(e);
    }

    return api.call("deleteModelTasks", {
      params: {
        id: id.toString(),
      },
    });
  }, [api]);

  const assignTasks = useCallback((modelID: number, modelTaskIds: number[]) => {
    try {
      // FIX: Validate modelID defensively.
      validateId(modelID, "model ID");
      
      // FIX: Validate modelTaskIds array contents defensively (must be positive integers).
      if (!Array.isArray(modelTaskIds) || modelTaskIds.some(id => !Number.isInteger(id) || id <= 0)) {
        throw new Error("Invalid task IDs provided. All task IDs must be positive integers.");
      }
    } catch (e) {
      return Promise.reject(e);
    }

    return api.call("assignModelTasks", {
      params: {
        model_id: modelID.toString(),
      },
      body: {
        task_ids: modelTaskIds,
      },
    });
  }, [api]);

  const unassignTasks = useCallback((modelID: number, modelTaskIds: number[]) => {
    try {
      // FIX: Validate modelID defensively.
      validateId(modelID, "model ID");

      // FIX: Validate modelTaskIds array contents defensively (must be positive integers).
      if (!Array.isArray(modelTaskIds) || modelTaskIds.some(id => !Number.isInteger(id) || id <= 0)) {
        throw new Error("Invalid task IDs provided. All task IDs must be positive integers.");
      }
    } catch (e) {
      return Promise.reject(e);
    }

    return api.call("unassignModelTasks", {
      params: {
        model_id: modelID.toString(),
      },
      body: {
        task_ids: modelTaskIds,
      },
    });
  }, [api]);

  useDebouncedEffect(() => {
    const ar = refresh();

    return () => {
      !ar.controller.signal.aborted && ar.controller.abort();
    }
  }, [api, refresh]);

  return React.useMemo(() => {
    return {
      list,
      initialized,
      loading,
      loadingError,
      refresh,
      create,
      update,
      remove,
      assignTasks,
      unassignTasks,
    }
  }, [
    list,
    initialized,
    loading,
    loadingError,
    refresh,
    create,
    update,
    remove,
    assignTasks,
    unassignTasks,
  ]);
}
