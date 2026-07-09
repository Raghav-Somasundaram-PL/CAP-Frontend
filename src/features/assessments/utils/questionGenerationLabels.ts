import { languageDisplayName } from "./questionLanguage";

const STATIC_LABELS: Record<string, string> = {
  START: "Start",
  END: "Complete",
  queued: "Queued",
  non_streaming_generation: "Generating draft",
  language_generation_complete: "Language generation complete",
  full_generation_complete: "Full generation complete",
};

function titleCaseWords(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatGenerationLabel(value: string | null | undefined): string {
  if (!value?.trim()) {
    return "Working";
  }

  const text = value.trim();

  if (text.includes(" -> ")) {
    return text
      .split(" -> ")
      .map((part) => formatGenerationLabel(part))
      .join(" → ");
  }

  const staticLabel = STATIC_LABELS[text] ?? STATIC_LABELS[text.toLowerCase()];
  if (staticLabel) {
    return staticLabel;
  }

  const languageGenerationMatch = text.match(/^([a-z0-9+#]+)_code_generation$/i);
  if (languageGenerationMatch) {
    return `${languageDisplayName(languageGenerationMatch[1])} code generation`;
  }

  return titleCaseWords(text.replace(/_node$/i, "").replace(/_/g, " "));
}

export function formatGenerationMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed.includes("_")) {
    return trimmed;
  }

  if (trimmed.includes(" -> ")) {
    return formatGenerationLabel(trimmed);
  }

  return trimmed.replace(/([\w]+(?:_[\w]+)+)/g, (token) => formatGenerationLabel(token));
}
