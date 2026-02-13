import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const SAO_PAULO = 'America/Sao_Paulo';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Retorna as iniciais de um nome
 * @param name 
 * @returns 
 */
export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

/**
 * Formata uma data no formato brasileiro (dd/MM/yyyy)
 * @param dateString 
 * @returns 
 */
export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR")
}

/**
 * Formata uma data e hora no formato brasileiro (dd/MM/yyyy HH:mm)
 * @param dateString 
 * @returns 
 */
export function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("pt-BR")
}

/**
 * Retorna a data e hora atual formatada para o input datetime-local (yyyy-MM-ddTHH:mm)
 * @returns 
 */
export function getDateTimeLocal() {
  const now = new Date();

  // Formatar para o padrão: yyyy-MM-ddTHH:mm
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

  return currentDateTime;
}

/**
 *  Converte uma string de data para o fuso horário de São Paulo antes de salvar no banco de dados.
 * @param dateString 
 * @returns 
 */
export function toDatabaseDate(dateString: string): Date {
  // Se vier só a parte de data, adiciona meia-noite
  const iso = dateString.includes('T')
    ? dateString
    : `${dateString}T00:00:00`;

  return fromZonedTime(iso, SAO_PAULO);
}

/**
 *  Converte uma data UTC do banco de dados para o fuso horário de São Paulo.
 * @param dateUtc 
 * @returns 
 */
export function fromDatabaseDate(dateUtc: Date): Date {
  return toZonedTime(dateUtc, SAO_PAULO);
}

/**
 * Formata um CPF
 * @param value 
 * @returns 
 */
export function formatCPF(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1")
}

/**
 * Formata um número de telefone brasileiro
 * @param value 
 * @returns 
 */
export function formatPhone(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1")
}

/**
 * Formata um CEP (Código de Endereçamento Postal)
 * @param value 
 * @returns 
 */
export function formatZipCode(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{3})\d+?$/, "$1")
}

/**
 * Remove todos os caracteres não numéricos de uma string
 * @param v 
 * @returns 
 */
export function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

/**
 * Formata um CNPJ
 * @param value 
 * @returns 
 */
export function formatCNPJ(value: string) {
  const v = onlyDigits(value).slice(0, 14);
  if (v.length <= 2) return v;
  if (v.length <= 5) return v.replace(/^(\d{2})(\d)/, "$1.$2");
  if (v.length <= 8) return v.replace(/^(\d{2})(\d{3})(\d)/, "$1.$2.$3");
  if (v.length <= 12) return v.replace(/^(\d{2})(\d{3})(\d{3})(\d)/, "$1.$2.$3/$4");
  return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, "$1.$2.$3/$4-$5");
}

/**
 * Formata um número para o padrão monetário brasileiro (BRL).
 * @param value O número a ser formatado.
 * @returns O valor formatado como uma string em Reais (ex: "R$ 1.234,56").
 */
export function formatCurrencyBRL(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";

  const n = Number(String(value));
  if (Number.isNaN(n)) return "-";

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 *  Converte um valor para string decimal padrão (usando ponto como separador decimal)
 * @param value 
 * @returns 
 */
export function toDecimalString(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const s = String(value).trim().replace(",", ".");
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * Multiplica dois valores decimais representados como strings.
 * @param a 
 * @param b 
 * @returns 
 */
export function multiplyDecimal(a: string, b: string) {
  const na = Number(a);
  const nb = Number(b);
  const res = na * nb;
  return res.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * Soma uma lista de valores decimais representados como strings.
 * @param values 
 * @returns 
 */
export function addDecimal(values: string[]) {
  const sum = values.reduce((acc, v) => acc + Number(v), 0);
  return sum.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

export function WhatsAppLink(message: string) {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodedMessage}`;
}