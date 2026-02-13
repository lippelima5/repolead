export function WorkspaceStatusName(status: string) {
  switch (status) {
    case "active":
      return "Ativo";
    case "trialing":
      return "Gratuito";
    case "pending":
      return "Pendente";
    case "inactive":
      return "Inativo";
    case "canceled":
      return "Cancelado";
    case "expired":
      return "Expirado";
    default:
      return undefined;
  }
}


