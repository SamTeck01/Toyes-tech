import { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Opts = { title: string; body?: string; confirm?: string; cancel?: string; danger?: boolean };
type Pending = Opts & { resolve: (ok: boolean) => void };
let push: ((p: Pending) => void) | null = null;

/** Premium replacement for window.confirm: `if (await confirmAction({ title: "Clear this sale?" })) …` */
export const confirmAction = (o: Opts) =>
  new Promise<boolean>((resolve) => (push ? push({ ...o, resolve }) : resolve(window.confirm(o.title))));

/** Mount once near the root. */
export const ConfirmHost = () => {
  const [p, setP] = useState<Pending | null>(null);
  useEffect(() => { push = setP; return () => { push = null; }; }, []);
  const close = (ok: boolean) => { p?.resolve(ok); setP(null); };
  return (
    <AlertDialog open={!!p} onOpenChange={(o) => !o && close(false)}>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl font-extrabold">{p?.title}</AlertDialogTitle>
          {p?.body && <AlertDialogDescription className="text-[15px] text-ink/70">{p.body}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter className="grid grid-cols-2 gap-2 sm:space-x-0">
          <AlertDialogCancel onClick={() => close(false)} className="mt-0 h-12 rounded-xl text-base font-bold">{p?.cancel ?? "Cancel"}</AlertDialogCancel>
          <AlertDialogAction autoFocus onClick={() => close(true)} className={cn("h-12 rounded-xl text-base font-bold text-white", p?.danger ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:brightness-110")}>{p?.confirm ?? "Yes"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
