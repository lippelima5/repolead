"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import logger from "@/lib/logger.client";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";
  const email = searchParams.get("email")?.trim() || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => token.length > 0 && password.length > 0 && confirmPassword.length > 0, [token, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      logger.error("Link de redefinicao inválido.");
      return;
    }

    if (password !== confirmPassword) {
      logger.error("As senhas não conferem.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post("/auth/reset-password", {
        token,
        password,
      });

      if (data?.success) {
        logger.success("Senha redefinida com sucesso.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    } catch (error) {
      logger.error("Erro ao redefinir senha", error);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Card className="overflow-hidden p-0">
            <CardContent className="p-6 md:p-8 space-y-4 text-center">
              <h1 className="text-2xl font-bold">Link inválido</h1>
              <p className="text-sm text-muted-foreground">
                O link de redefinicao esta incompleto ou inválido.
              </p>
              <Button asChild className="w-full">
                <Link href="/forgot-password">Solicitar novo link</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0">
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Criar nova senha</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      Defina sua nova senha para continuar.
                    </p>
                  </div>

                  {email ? (
                    <FieldDescription className="text-center">
                      Conta: <strong>{email}</strong>
                    </FieldDescription>
                  ) : null}

                  <Field>
                    <FieldLabel htmlFor="password">Nova senha</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                      required
                    />
                    <FieldDescription>
                      Mínimo de 8 caracteres, com letra maiuscula, minuscula e numero.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirm-password">Confirmar nova senha</FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      required
                    />
                  </Field>

                  <Field>
                    <Button disabled={loading || !canSubmit} type="submit">
                      {loading ? "Salvando..." : "Redefinir senha"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <FieldDescription className="px-6 text-center">
            Lembrou sua senha? <Link href="/login">Fazer login</Link>
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}

