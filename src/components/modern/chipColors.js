import {
  Hash,
  Receipt as ReceiptIcon,
  FileText,
  Calendar,
  IndianRupee,
  Tag,
  MapPin,
  User,
  Phone,
  Mail,
  Building,
  Stethoscope,
  Pill,
  Clock,
  CreditCard,
} from "lucide-react";

export const FIELD_COLORS = {
  uhid:     { fg: "#7C3AED", bg: "#7C3AED14", icon: Hash },
  receipt:  { fg: "#0F766E", bg: "#0F766E14", icon: ReceiptIcon },
  bill:     { fg: "#2563EB", bg: "#2563EB14", icon: FileText },
  date:     { fg: "#64748B", bg: "#64748B14", icon: Calendar },
  amount:   { fg: "#059669", bg: "#05966914", icon: IndianRupee },
  tnx:      { fg: "#DB2777", bg: "#DB277714", icon: Tag },
  addr:     { fg: "#F59E0B", bg: "#F59E0B14", icon: MapPin },
  user:     { fg: "#0F766E", bg: "#0F766E14", icon: User },
  phone:    { fg: "#0891B2", bg: "#0891B214", icon: Phone },
  email:    { fg: "#6366F1", bg: "#6366F114", icon: Mail },
  building: { fg: "#475569", bg: "#47556914", icon: Building },
  doctor:   { fg: "#0EA5E9", bg: "#0EA5E914", icon: Stethoscope },
  medicine: { fg: "#10B981", bg: "#10B98114", icon: Pill },
  time:     { fg: "#A855F7", bg: "#A855F714", icon: Clock },
  card:     { fg: "#F97316", bg: "#F9731614", icon: CreditCard },
};

export const ACCENT_PALETTE = [
  "#0F766E", "#2563EB", "#7C3AED", "#DB2777",
  "#F59E0B", "#10B981", "#EF4444", "#0EA5E9",
];

export function accentFromSeed(seed, palette = ACCENT_PALETTE) {
  const k = String(seed ?? "");
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
