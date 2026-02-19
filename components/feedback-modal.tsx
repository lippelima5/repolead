"use client";

import { ReactNode, useState } from "react";
import { FeedbackForm } from "@/components/feedback-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

type FeedbackModalProps = {
  trigger: ReactNode;
};

export function FeedbackModal({ trigger }: FeedbackModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <FeedbackForm
          showCancel
          onCancel={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
