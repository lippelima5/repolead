"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { cn } from "@/lib/utils";

type FeedbackCategory = "feature" | "improvement" | "bug" | "other";

const categoryValues: FeedbackCategory[] = ["feature", "improvement", "bug", "other"];

type FeedbackFormProps = {
  className?: string;
  showHeading?: boolean;
  showCancel?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export function FeedbackForm({ className, showHeading = true, showCancel = false, onCancel, onSuccess }: FeedbackFormProps) {
  const { user } = useAuth();
  const { locale } = useI18n();
  const pathname = usePathname();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("feature");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setName((current) => current || user.name || "");
    }
    if (user?.email) {
      setEmail((current) => current || user.email || "");
    }
  }, [user?.email, user?.name]);

  const labels = useMemo(
    () =>
      locale === "pt"
        ? {
            title: "Enviar Feedback",
            subtitle: "Compartilhe sua ideia, melhoria ou problema para a equipe priorizar.",
            category: "Categoria",
            placeholderTitle: "Titulo",
            placeholderDescription: "Descreva sua ideia, melhoria ou problema em detalhes",
            feature: "Feature",
            improvement: "Melhoria",
            bug: "Bug",
            other: "Outro",
            name: "Nome",
            email: "Email",
            cancel: "Cancelar",
            submit: "Enviar ticket",
            submitting: "Enviando...",
            invalidMessage: "Preencha titulo, descricao e email para enviar o feedback.",
            success: "Feedback enviado com sucesso",
            failure: "Falha ao enviar feedback",
          }
        : {
            title: "Send Feedback",
            subtitle: "Share your idea, improvement, or issue so the team can prioritize it.",
            category: "Category",
            placeholderTitle: "Title",
            placeholderDescription: "Describe your idea, improvement, or issue in details",
            feature: "Feature",
            improvement: "Improvement",
            bug: "Bug",
            other: "Other",
            name: "Name",
            email: "Email",
            cancel: "Cancel",
            submit: "Send ticket",
            submitting: "Sending...",
            invalidMessage: "Fill title, description, and email before sending feedback.",
            success: "Feedback sent successfully",
            failure: "Failed to send feedback",
          },
    [locale],
  );

  const categoryLabel: Record<FeedbackCategory, string> = {
    feature: labels.feature,
    improvement: labels.improvement,
    bug: labels.bug,
    other: labels.other,
  };

  const isValid =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    email.trim().length > 0 &&
    !isSubmitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValid) {
      logger.error(labels.invalidMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/feedback", {
        category,
        title: title.trim(),
        description: description.trim(),
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        page: pathname || undefined,
      });

      logger.success(labels.success);
      setTitle("");
      setDescription("");
      setCategory("feature");
      onSuccess?.();
    } catch (error) {
      logger.error(labels.failure, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={cn("space-y-4", className)} onSubmit={handleSubmit}>
      {showHeading ? (
        <div className="space-y-1.5">
          <h2 className="text-[22px] font-semibold leading-none tracking-tight">{labels.title}</h2>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
      ) : null}

      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={labels.placeholderTitle}
        maxLength={120}
      />

      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder={labels.placeholderDescription}
        className="min-h-[220px] resize-y"
        maxLength={5000}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Select value={category} onValueChange={(value) => setCategory(value as FeedbackCategory)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={labels.category} />
          </SelectTrigger>
          <SelectContent align="start">
            {categoryValues.map((value) => (
              <SelectItem key={value} value={value}>
                {categoryLabel[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={labels.name} maxLength={120} />
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder={labels.email}
          maxLength={160}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        {showCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            {labels.cancel}
          </Button>
        ) : null}
        <Button type="submit" disabled={!isValid}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          {isSubmitting ? labels.submitting : labels.submit}
        </Button>
      </div>
    </form>
  );
}
