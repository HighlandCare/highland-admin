export const pageMainSx = {
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  minWidth: 0,
  overflowX: "hidden",
  overflowY: "visible",
  pb: "10px",
  pt: { xs: 1.5, sm: 2 },
  width: "100%",
};

export const pageContainerSx = {
  display: "flex",
  flex: 1,
  flexDirection: "column",
  maxWidth: "100%",
  minWidth: 0,
  px: { xs: 1.25, sm: 2, md: 3 },
};

export const pageTitleSx = {
  fontSize: { xs: "1.5rem", sm: "2.125rem" },
};

export const richTextEditorSx = {
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
  },
};

export const richTextFormSx = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  maxWidth: "100%",
  width: "100%",
};

export const formActionsSx = {
  display: "flex",
  flexShrink: 0,
  justifyContent: { xs: "stretch", sm: "flex-end" },
  width: "100%",
  "& .MuiButton-root": {
    minWidth: { xs: "100%", sm: 120 },
  },
};

export const responsiveModalSx = {
  bgcolor: "background.paper",
  borderRadius: 2.5,
  boxShadow: 24,
  left: "50%",
  maxHeight: "calc(100vh - 32px)",
  maxWidth: "calc(100vw - 32px)",
  overflowY: "auto",
  p: { xs: 2.5, sm: 4 },
  position: "absolute",
  top: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "100%", sm: 560, md: 600 },
};
