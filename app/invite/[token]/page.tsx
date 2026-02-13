"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import logger from "@/lib/logger.client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InvitePayload = {
  id: number;
  email: string;
  role: "owner" | "admin" | "user" | "viewer";
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  workspace: {
    id: number;
    name: string;
    description: string | null;
  };
};

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [invite, setInvite] = useState<InvitePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const autoAcceptRef = useRef(false);

  const redirectPath = `/invite/${token}`;

  useEffect(() => {
    let cancelled = false;

    const fetchSession = async () => {
      try {
        const { data } = await api.get("/profile");

        if (!cancelled && data?.success && data?.data?.email) {
          setIsLogged(true);
          setUserEmail(String(data.data.email).toLowerCase());
        }
      } catch {
        if (!cancelled) {
          setIsLogged(false);
          setUserEmail("");
        }
      }
    };

    fetchSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLogged) {
        setUserEmail("");
    }
  }, [isLogged]);

  useEffect(() => {
    const fetchInvite = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/workspace/invite/${token}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Falha ao carregar convite");
        }

        setInvite(data.data);
      } catch (error) {
        logger.error("Erro ao carregar convite", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchInvite();
    }
  }, [token]);

  useEffect(() => {
    if (!invite) return;

    const canOpenDialog =
      isLogged && invite.status === "pending" && Boolean(userEmail) && userEmail === invite.email.toLowerCase();

    setAcceptDialogOpen(canOpenDialog);
  }, [invite, isLogged, userEmail]);

  const acceptInvite = useCallback(async () => {
    try {
      setIsAccepting(true);
      const { data } = await api.post(`/workspace/invite/${token}/accept`);

      if (!data?.success) {
        throw new Error(data?.message || "Falha ao aceitar convite");
      }

      logger.success("Convite aceito com sucesso");
      router.push(`/dashboard/settings/workspace/${data.data.workspace_id}`);
      router.refresh();
    } catch (error) {
      logger.error("Erro ao aceitar convite", error);
    } finally {
      setIsAccepting(false);
      setAcceptDialogOpen(false);
    }
  }, [router, token]);

  useEffect(() => {
    if (!invite) return;
    if (autoAcceptRef.current) return;

    const canAutoAccept =
      isLogged &&
      invite.status === "pending" &&
      Boolean(userEmail) &&
      userEmail === invite.email.toLowerCase() &&
      new Date(invite.expires_at) >= new Date();

    if (!canAutoAccept) return;

    autoAcceptRef.current = true;
    void acceptInvite();
  }, [acceptInvite, invite, isLogged, userEmail]);

  const roleLabel = useMemo(() => {
    if (!invite) return "";

    switch (invite.role) {
      case "admin":
        return "Administrador";
      case "viewer":
        return "Visualizador";
      case "owner":
        return "Owner";
      default:
        return "Usuario";
    }
  }, [invite]);

  if (isLoading) {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-muted/30">
        <Card className="w-full max-w-lg">
          <CardContent className="py-10 text-center">Carregando convite...</CardContent>
        </Card>
      </main>
    );
  }

  if (!invite) {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-muted/30">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Convite invalido</CardTitle>
            <CardDescription>Este link nao foi encontrado ou nao esta mais disponivel.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">Voltar para o inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const inviteExpired = invite.status === "expired" || new Date(invite.expires_at) < new Date();
  const inviteNotPending = invite.status !== "pending";
  const wrongEmailLogged = isLogged && Boolean(userEmail) && userEmail !== invite.email.toLowerCase();

  return (
    <main className="min-h-screen grid place-items-center p-6 bg-muted/30">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Convite para workspace</CardTitle>
          <CardDescription>Voce foi convidado para participar de um workspace.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-md border p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Workspace</p>
            <p className="font-medium">{invite.workspace.name}</p>
            {invite.workspace.description && <p className="text-sm text-muted-foreground">{invite.workspace.description}</p>}
          </div>

          <div className="rounded-md border p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Convidado</p>
            <p className="font-medium">{invite.email}</p>
            <p className="text-sm text-muted-foreground">Perfil: {roleLabel}</p>
          </div>

          {inviteExpired && <p className="text-sm text-destructive">Este convite expirou.</p>}
          {!inviteExpired && inviteNotPending && <p className="text-sm text-destructive">Este convite nao esta mais pendente.</p>}
          {wrongEmailLogged && (
            <p className="text-sm text-destructive">
              Voce esta logado com outro e-mail. Entre com <strong>{invite.email}</strong> para aceitar este convite.
            </p>
          )}

          {!isLogged && !inviteExpired && invite.status === "pending" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild>
                <Link href={`/login?redirect=${encodeURIComponent(redirectPath)}`}>Entrar</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/register?redirect=${encodeURIComponent(redirectPath)}`}>Criar conta</Link>
              </Button>
            </div>
          )}

          {isLogged && userEmail === invite.email.toLowerCase() && !inviteExpired && invite.status === "pending" && (
            <Button className="w-full" onClick={() => setAcceptDialogOpen(true)}>
              Aceitar convite
            </Button>
          )}

          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Voltar</Link>
          </Button>
        </CardContent>
      </Card>

      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aceitar convite</DialogTitle>
            <DialogDescription>
              Deseja entrar no workspace <strong>{invite.workspace.name}</strong> como <strong>{roleLabel}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)} disabled={isAccepting}>
              Agora nao
            </Button>
            <Button onClick={acceptInvite} disabled={isAccepting}>
              {isAccepting ? "Entrando..." : "Aceitar e entrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}


