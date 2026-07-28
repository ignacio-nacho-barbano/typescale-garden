/**
 * The design-token shape the Figma plugin consumes.
 *
 * Derived from Figma's own `TextStyle` rather than hand-declared, because these
 * tokens exist to be assigned onto real Figma text styles — so the field names
 * and value shapes have to track Figma's API, not a parallel copy of it that can
 * drift. `FontName`, `TextCase`, `LetterSpacing` and `LineHeight` all come from
 * @figma/plugin-typings.
 *
 * It is a `Pick`, not the whole interface: `TextStyle` also carries the
 * identity and document-membership surface of a live style node (`id`, `key`,
 * `consumers`, `getStyleConsumersAsync()`, …), which a token payload has no way
 * to supply. Picking exactly the seven fields we emit is what lets the plugin
 * assign them without the `@ts-ignore`s the original needed.
 *
 * Widening a token to accept more of `TextStyle` is a matter of adding the field
 * name here.
 */
export type DesignTokenTextStyle = Pick<
	TextStyle,
	"type" | "name" | "fontName" | "textCase" | "letterSpacing" | "lineHeight" | "fontSize"
>;

/** Keyed by style name, e.g. "desktop/title-1", "mobile/body-1-bold". */
export type DesignTokenSet = Record<string, DesignTokenTextStyle>;
