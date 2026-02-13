// Utiliza ponto-e-vírgula como separador, recomendado para o Excel em locais onde a vírgula é usada como separador decimal.
export const SEPARATOR = ';';

/**
 * Função auxiliar para escapar caracteres especiais do CSV.
 * Envolve o valor entre aspas duplas se houver o separador, quebras de linha ou aspas.
 *
 * @param value - Valor a ser escapado.
 * @returns Valor escapado para uso em CSV.
 */
export function escapeCSV(value: string): string {
  if (!value) return '';

  let escaped = value.replace(/"/g, '""');

  if (escaped.search(new RegExp(`("|${SEPARATOR}|\n)`)) >= 0) {
    escaped = `"${escaped}"`;
  }

  return escaped;
}

/**
 * Função auxiliar para exportar os dados para um arquivo CSV.
 *
 * @param rows - Linhas a serem exportadas.
 * @param filename - Nome do arquivo a ser criado.
 */
export function exportDataToCSV(rows: string[], filename = 'dados.csv'): void {
  // Junta todas as linhas com quebras de linha e adiciona o BOM para compatibilidade com o Excel
  const csvContent = "\ufeff" + rows.join('\n');

  // Cria um Blob com o conteúdo CSV e dispara o download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

