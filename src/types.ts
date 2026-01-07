export enum FontFamily {
  Inter = "Inter",
  Serif = "Playfair Display",
  Cursive = "Great Vibes",
  Cinzel = "Cinzel",
  Roboto = "Roboto",
}

export interface CertificateField {
  id: string;
  label: string; // The internal name, e.g., "Student Name"
  value: string; // The current value to render, e.g., "John Doe"
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  fontSize: number; // px (relative to base, we will scale)
  fontFamily: FontFamily;
  color: string;
  align: "left" | "center" | "right" | "justify";
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline";
  underlinePadding: boolean;
}

export interface GuideLine {
  id: string;
  type: "horizontal" | "vertical";
  position: number; // Percentage 0-100
}

export interface TemplateState {
  imageUrl: string | null;
  dimensions: { width: number; height: number };
}

export interface GenerationConfig {
  format: "png" | "pdf"; // PDF implementation later
  quality: number;
}

export interface SavedProject {
  id: string;
  name: string;
  updatedAt: number;
  imageUrl: string | null;
  fields: CertificateField[];
}
