"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CrudApi<T> {
  getAll: () => Promise<T[]>;
  create: (data: Record<string, unknown>) => Promise<T>;
  update: (data: Record<string, unknown>) => Promise<T>;
  delete: (id: string) => Promise<unknown>;
}

async function extractErrorMessage(error: unknown, fallback: string): Promise<string> {
  try {
    if (error && typeof error === "object" && "response" in error) {
      const resp = (error as { response: Response }).response;
      const body = await resp.json();
      if (body?.error) return body.error;
    }
  } catch {
    // ignore parse errors
  }
  return fallback;
}

export function useCrud<T extends { id: string }>(
  key: string,
  api: CrudApi<T>
) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: [key],
    queryFn: api.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [key] });
      toast.success("Created successfully");
    },
    onError: async (error) => {
      const msg = await extractErrorMessage(error, "Failed to create");
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [key] });
      toast.success("Updated successfully");
    },
    onError: async (error) => {
      const msg = await extractErrorMessage(error, "Failed to update");
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      try {
        return await api.delete(id);
      } finally {
        setDeletingId(null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [key] });
      toast.success("Deleted successfully");
    },
    onError: async (error) => {
      const msg = await extractErrorMessage(error, "Failed to delete");
      toast.error(msg);
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSaving: createMutation.isPending || updateMutation.isPending,
    deletingId,
  };
}
