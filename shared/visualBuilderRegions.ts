import { SITE_THEME_FIELDS } from "./siteTheme";

export type VisualBuilderFieldType = "color" | "text" | "textarea" | "toggle";

export type VisualBuilderRegion = {
  label: string;
  type: VisualBuilderFieldType;
};

/** Maps data-rvr-setting keys to admin field metadata. */
export const VISUAL_BUILDER_REGIONS: Record<string, VisualBuilderRegion> = Object.fromEntries(
  SITE_THEME_FIELDS.map((field) => [field.key, { label: field.label, type: field.type }])
);

export const VISUAL_BUILDER_MESSAGE_SOURCE = "rvr-visual-builder";

export type VisualBuilderSelectMessage = {
  source: typeof VISUAL_BUILDER_MESSAGE_SOURCE;
  type: "select";
  key: string;
  label: string;
  fieldType: VisualBuilderFieldType;
};

export type VisualBuilderPatchMessage = {
  source: typeof VISUAL_BUILDER_MESSAGE_SOURCE;
  type: "patch";
  settings: Record<string, string>;
};

export type VisualBuilderReadyMessage = {
  source: typeof VISUAL_BUILDER_MESSAGE_SOURCE;
  type: "ready";
};

export function isVisualBuilderMessage(
  data: unknown
): data is VisualBuilderSelectMessage | VisualBuilderPatchMessage | VisualBuilderReadyMessage {
  return Boolean(
    data &&
      typeof data === "object" &&
      (data as { source?: string }).source === VISUAL_BUILDER_MESSAGE_SOURCE
  );
}
