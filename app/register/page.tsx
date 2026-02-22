'use client';

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { useSearchParams } from "next/navigation";

export default function Page() {
    const searchParams = useSearchParams();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const redirectParam = searchParams.get("redirect");
    const redirectTo = redirectParam && redirectParam.startsWith("/") ? redirectParam : null;

    useEffect(() => {
        let cancelled = false;

        const checkSession = async () => {
            try {
                const response = await fetch("/api/profile", { credentials: "include", cache: "no-store" });
                if (!cancelled && response.ok) {
                    const data = await response.json();
                    if (data?.success) {
                        window.location.href = "/dashboard";
                        return;
                    }
                }
            } catch {
                // ignore
            } finally {
                if (!cancelled) {
                    setCheckingSession(false);
                }
            }
        };

        void checkSession();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault();
            setLoading(true);

            if (password !== confirmPassword) {
                logger.error("Passwords do not match.");
                return;
            }

            const { data } = await api.post('/auth/register', {
                name,
                email,
                password,
                confirmPassword
            });

            if (data && data.success) {
                logger.success("Registration successful! Please check your email to verify your account.");

                setTimeout(() => {
                    window.location.href = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login";
                }, 1000);
            }
        } catch (error) {
            logger.error("Registration error:", error);
        } finally {
            setLoading(false);
        }
    }

    if (checkingSession) {
        return (
            <div className="bg-muted flex min-h-svh items-center justify-center p-6">
                <p className="text-sm text-muted-foreground">Verificando sessão...</p>
            </div>
        );
    }

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md">
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl">Crie sua conta</CardTitle>
                            <CardDescription>
                                Preencha seus dados abaixo para criar sua conta.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="name">Nome completo</FieldLabel>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required />
                                    </Field>
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
                                        <Field className="grid grid-cols-2 gap-4">
                                            <Field>
                                                <FieldLabel htmlFor="password">Senha</FieldLabel>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required />
                                            </Field>
                                            <Field>
                                                <FieldLabel htmlFor="confirm-password">Confirmar Senha</FieldLabel>
                                                <Input
                                                    id="confirm-password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required />
                                            </Field>
                                        </Field>
                                    </Field>
                                    <Field>
                                        <Button disabled={loading} type="submit">Criar uma conta</Button>
                                        <FieldDescription className="text-center">
                                            Já possui uma conta? <a href="/login">Faça login</a>
                                        </FieldDescription>
                                    </Field>
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>
                    <FieldDescription className="px-6 text-center">
                        Ao clicar em continuar, você concorda com nossos <a href="/terms">Termos de Serviço</a>{" "}
                        , <a href="/privacy">Política de Privacidade</a> e{" "}
                        <a href="/acceptable-use">Política de Uso Aceitável</a>.
                    </FieldDescription>
                </div>
            </div>
        </div>
    )
}
