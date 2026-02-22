"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Mail, Save, User } from "lucide-react";
import AppLayout from "@/components/app-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { formatDate, getInitials } from "@/lib/utils";
import { SanitizedUser } from "@/types";

export default function ProfilePage() {
  const { validate } = useAuth();
  const [user, setUser] = useState<SanitizedUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    handleGetData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetData = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/profile");
      if (data.success) {
        setUser(data.data);
        setName(data.data.name || "");
        setEmail(data.data.email || "");
        await validate();
      }
    } catch (error) {
      logger.error("Erro ao carregar perfil", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      if (!name || !email) {
        logger.error("Preencha todos os campos corretamente");
        return;
      }

      if (password !== confirmPassword) {
        logger.error("As senhas não coincidem");
        return;
      }

      const { data } = await api.put("/profile", {
        name,
        email,
        password: password || undefined,
      });

      if (data.success) {
        logger.success("Perfil atualizado com sucesso");
        await handleGetData();
      }
    } catch (error) {
      logger.error("Erro ao atualizar perfil", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout isLoading={isLoading}>
      <div className="p-4 md:p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Perfil</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visualize e atualize suas informações pessoais.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-[14px]">Resumo</CardTitle>
              <CardDescription className="text-[12px]">Dados da conta logada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl">{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{user?.name || "Usuário"}</h3>
                <p className="text-[13px] text-muted-foreground">{user?.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Membro desde {user?.created_at ? formatDate(String(user.created_at)) : ""}
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-[12px] font-medium text-foreground">Nome</p>
                    <p className="text-[12px] text-muted-foreground">{user?.name || "Não informado"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-[12px] font-medium text-foreground">Email</p>
                    <p className="text-[12px] text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card lg:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-[14px]">Editar perfil</CardTitle>
              <CardDescription className="text-[12px]">Atualize nome, email e senha</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="mt-2 grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      // onChange={(e) => setEmail(e.target.value)}
                      // placeholder="seu.email@exemplo.com"
                      readOnly
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Nova Senha</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme a nova senha"
                    />
                  </div>

                  <div className="mt-1 flex justify-end">
                    <Button type="submit" disabled={isSaving} className="h-9 text-[13px]">
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? "Salvando..." : "Salvar Alteracoes"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
