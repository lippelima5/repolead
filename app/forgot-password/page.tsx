'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import api from "@/lib/api";
import logger from "@/lib/logger.client";

export default function Page() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault();
            setLoading(true);

            const { data } = await api.post('/auth/forgot-password', {
                email,
            });

            if (data && data.success) {
                logger.success("Reset link sent to your email. Please check your inbox.");

                setTimeout(() => {
                    window.location.href = "/login";
                }, 1000);
            }
        } catch (error) {
            logger.error("Error sending reset link:", error);
        } finally {
            setLoading(false);
        }
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
                                        <h1 className="text-2xl font-bold">Redefinir sua senha</h1>
                                        <p className="text-muted-foreground text-sm text-balance">Insira seu e-mail para redefinir sua senha</p>
                                    </div>
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
                                        <Button disabled={loading} type="submit">Enviar link por email</Button>
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
