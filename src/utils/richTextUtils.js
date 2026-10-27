/**
 * Keep at most one blank line between blocks.
 * Does not remove a single intentional empty paragraph the user added in the editor.
 */
export const normalizeRichTextSpacing = (html = "") => {
  if (typeof html !== "string" || !html.trim()) {
    return html || "";
  }

  let value = html;

  // Empty / whitespace-only Quill paragraphs (one visual blank line)
  const blankParagraph =
    "<p>(?:\\s|&nbsp;|<br\\s*/?>|&#160;|\\u00a0)*</p>";

  // 2+ consecutive blank paragraphs → keep exactly one
  value = value.replace(new RegExp(`(?:${blankParagraph}\\s*){2,}`, "gi"), "<p><br></p>");

  // 3+ consecutive <br> → two breaks max (one blank line feel)
  value = value.replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br><br>");

  // 3+ newline clusters → one blank line
  value = value.replace(/(?:\r?\n[ \t]*){3,}/g, "\n\n");

  if (!value.trim()) {
    return "<p><br></p>";
  }

  return value;
};

/** Editor styles: tight paragraph margins; blank lines come from empty paragraphs */
export const compactRichTextEditorSx = {
  maxWidth: "100%",
  width: "100%",
  "& .quill": {
    maxWidth: "100%",
    width: "100%",
  },
  "& .ql-toolbar.ql-snow": {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flexWrap: "wrap",
    px: { xs: 1, sm: 2 },
    rowGap: 1,
  },
  "& .ql-container.ql-snow": {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    width: "100%",
  },
  "& .ql-editor": {
    height: { xs: "280px", sm: "360px", md: "400px" },
    minHeight: { xs: 280, sm: 360 },
    lineHeight: 1.5,
    "& p": {
      marginBottom: 0,
      marginTop: 0,
    },
    "& h1, & h2, & h3, & h4, & h5, & h6": {
      marginBottom: "0.35em",
      marginTop: "0.75em",
    },
    "& ul, & ol": {
      marginBottom: "0.5em",
      marginTop: 0,
      paddingLeft: "1.5em",
    },
    "& li": {
      marginBottom: "0.15em",
    },
    "& blockquote": {
      marginBottom: "0.5em",
      marginTop: 0,
    },
  },
};
