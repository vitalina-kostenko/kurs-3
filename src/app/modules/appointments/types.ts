export interface SelectedMaterial {
  materialId: string;
  quantity: string;
}

export const statusVariant: Record<
  string,
  "default" | "secondary" | "success" | "destructive" | "warning"
> = {
  scheduled: "secondary",
  in_progress: "warning",
  completed: "success",
  cancelled: "destructive",
};
