"use client";

import { materialApi, type Material } from "@/app/entities/material/api";
import { materialSchema, type MaterialFormData } from "@/app/entities/material/schema";
import { useCrud } from "@/app/shared/hooks/use-crud";
import { useRole } from "@/app/shared/hooks/use-role";
import { exportToCsv } from "@/app/shared/lib/csv-export";
import {
  Badge,
  Button,
  Card, CardContent,
  ConfirmDialog,
  Dialog, DialogContent,
  DialogFooter,
  DialogHeader, DialogTitle,
  Input, Label,
  LoadingOverlay,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  Textarea,
} from "@/app/shared/ui";
import { cn } from "@/pkg/theme/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

export function MaterialsModule() {
  const t = useTranslations("materials");
  const tc = useTranslations("common");

  const { isAdmin } = useRole();

  const { data, isLoading, isFetching, create, update, remove, isSaving, isDeleting, deletingId } = useCrud<Material>("materials", materialApi);
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;

    const q = search.toLowerCase();

    return data.filter((m) => m.name.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q));
  }, [data, search]);

  const form = useForm<MaterialFormData>({
    
    resolver: zodResolver(materialSchema),
    defaultValues: { name: "", description: "", unit: "pcs", quantity: "0", minQuantity: "0", pricePerUnit: "0" },
  });

  const onOpen = (item?: Material) => {
    if (item) { setEditing(item); form.reset({ name: item.name, description: item.description ?? "", unit: item.unit, quantity: item.quantity, minQuantity: item.minQuantity, pricePerUnit: item.pricePerUnit }); }
   
    else { setEditing(null); form.reset(); }
    
    setOpen(true);
  };

  const onSubmit = async (data: MaterialFormData) => {
    try {
     
      if (editing) { await update({ id: editing.id, ...data }); } else { await create(data as unknown as Record<string, unknown>); }
      
      setOpen(false);
    } catch { /* handled */ }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
   
    try { await remove(deleteTarget); } catch { /* toast */ }
   
    setDeleteTarget(null);
  };

  const isLowStock = (item: Material) => Number(item.quantity) <= Number(item.minQuantity);

  const handleExport = () => {
    exportToCsv(filtered, [
      { key: "name", label: "Name" },
      { key: "unit", label: "Unit" },
      { key: "quantity", label: "Quantity" },
      { key: "minQuantity", label: "Min Quantity" },
      { key: "pricePerUnit", label: "Price per Unit" },
    ], "materials");
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        
        <div className="flex justify-between items-center"><div className="h-5 w-36 animate-pulse rounded bg-muted" /><div className="h-10 w-40 animate-pulse rounded-xl bg-muted" /></div>
        <Card>
          <TableSkeleton rows={5} cols={7} />
          </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">{filtered.length} / {data.length}</p>
          
          {isFetching && <Spinner size="sm" className="text-muted-foreground" />}
       
        </div>
        <div className="flex items-center gap-2">
          
          <Button variant="outline" onClick={handleExport} className="gap-2" disabled={filtered.length === 0}><Download className="h-4 w-4" /> {tc("export")}</Button>
          {isAdmin && <Button onClick={() => onOpen()} className="gap-2"><Plus className="h-4 w-4" /> {t("addMaterial")}</Button>}
        </div>
      </div>

      <div className="relative">
        
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={tc("search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("unit")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("minQuantity")}</TableHead>
                <TableHead>{t("pricePerUnit")}</TableHead>
                <TableHead>{tc("status")}</TableHead>
                
                {isAdmin && <TableHead className="w-24">{tc("actions")}</TableHead>}
             
              </TableRow>
           
            </TableHeader>
          
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filtered.map((item) => {
                  const isItemDeleting = deletingId === item.id;
                  
                  return (
                    <motion.tr key={item.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: isItemDeleting ? 0.4 : 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0 }} transition={{ duration: 0.2 }} className={cn("border-b transition-colors hover:bg-muted/50", isItemDeleting && "pointer-events-none")}>
                      <TableCell><div><p className="font-medium">{item.name}</p>{item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}</div></TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.minQuantity}</TableCell>
                      <TableCell>${item.pricePerUnit}</TableCell>
                      
                      <TableCell>
                        {isLowStock(item) ? (<Badge variant="warning" className="gap-1"><AlertTriangle className="h-3 w-3" /> {t("lowStock")}</Badge>) : (<Badge variant="success">{tc("active")}</Badge>)}
                      </TableCell>
                    
                      {isAdmin && <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => onOpen(item)} disabled={isItemDeleting}><Pencil className="h-4 w-4" /></Button>
                         
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item.id)} disabled={isDeleting}>
                            {isItemDeleting ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                          </Button>
                        </div>
                      </TableCell>
                      }
                    </motion.tr>
                  );
                })}
             
              </AnimatePresence>
            
              {filtered.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{tc("noData")}</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title={tc("deleteConfirmTitle")} description={tc("deleteConfirmDesc")} confirmLabel={tc("delete")} cancelLabel={tc("cancel")} onConfirm={handleDelete} isLoading={isDeleting} />

      <Dialog open={open} onOpenChange={(v) => !isSaving && setOpen(v)}>
        <DialogContent>
        
          <LoadingOverlay visible={isSaving} text={editing ? "Updating..." : "Creating..."} />
          
          <DialogHeader><DialogTitle>{editing ? t("editMaterial") : t("addMaterial")}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("name")}</Label>

              <Input {...form.register("name")} 
              disabled={isSaving} />
              </div>
           
            <div className="space-y-2">
              <Label>{t("description")}</Label>

              <Textarea {...form.register("description")} disabled={isSaving} />
              </div>
           
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("unit")}</Label>
                <Input {...form.register("unit")} 
                disabled={isSaving} /></div>
              
              <div className="space-y-2">
                <Label>{t("pricePerUnit")}</Label>

                <Input {...form.register("pricePerUnit")} 
                disabled={isSaving} />
                </div>
            </div>
           
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("quantity")}</Label>

                <Input {...form.register("quantity")} 
                disabled={isSaving} />
                </div>
              
              <div className="space-y-2">
                <Label>{t("minQuantity")}</Label>

                <Input {...form.register("minQuantity")} 
                disabled={isSaving} />
                </div>
            </div>
            
            <DialogFooter>
              <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              disabled={isSaving}>{tc("cancel")}
              </Button>
              
              <Button 
              type="submit" 
              disabled={isSaving}>
                {isSaving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
                {tc("save")}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
