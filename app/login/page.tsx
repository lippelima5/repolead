'use client';

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import logger from "@/lib/logger.client";

function getSafeRedirect(redirect: string | null) {
  return redirect && redirect.startsWith("/") ? redirect : null;
}

export default function Page() {
  const searchParams = useSearchParams();
  const magicToken = searchParams.get("magic");
  const redirectTo = getSafeRedirect(searchParams.get("redirect"));

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  const consumedMagicRef = useRef(false);

  useEffect(() => {
    if (!magicToken || consumedMagicRef.current) {
      return;
    }

    consumedMagicRef.current = true;

    const consumeMagicLink = async () => {
      try {
        setMagicLoading(true);

        const { data } = await api.post('/auth/magic/consume', {
          token: magicToken,
        });

        if (data?.success) {
          logger.success("Acesso realizado com sucesso.");
          const fallbackRedirect = data?.data?.redirect_to || "/dashboard";
          window.location.href = redirectTo || fallbackRedirect;
        }
      } catch (error) {
        logger.error("Erro ao consumir magic link", error);
      } finally {
        setMagicLoading(false);
      }
    };

    consumeMagicLink();
  }, [magicToken, redirectTo]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      setLoading(true);

      const { data } = await api.post('/auth/login', {
        email,
        password,
      });

      if (data?.success) {
        logger.success("Login realizado com sucesso.");

        const fallbackRedirect = data?.data?.redirect_to || "/dashboard";
        window.location.href = redirectTo || fallbackRedirect;
      }
    } catch (error) {
      logger.error("Erro no login", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0">
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Bem vindo de volta</h1>
                    <p className="text-muted-foreground text-sm text-balance">Faca login na sua conta</p>
                  </div>

                  {magicToken ? (
                    <FieldDescription className="text-center">
                      {magicLoading ? "Validando link de acesso..." : "Se o link for valido, voce sera redirecionado automaticamente."}
                    </FieldDescription>
                  ) : null}

                  <Field>
                    <FieldLabel htmlFor="email">E-mail</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Senha</FieldLabel>
                      <a
                        href="/forgot-password"
                        className="ml-auto text-sm underline-offset-2 hover:underline"
                      >
                        Esqueceu sua senha?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      placeholder="********"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <Button disabled={loading || magicLoading} type="submit">
                      {loading ? "Entrando..." : "Conecte-se"}
                    </Button>
                  </Field>

                  <FieldDescription className="text-center">
                    Nao tem uma conta? <a href="/register">Cadastre-se</a>
                  </FieldDescription>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            Ao clicar em continuar, voce concorda com nossos <a href="/terms">Termos de Servico</a>{" "}
            e <a href="/privacy">Politica de Privacidade</a>.
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}
