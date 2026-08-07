import PropTypes from "prop-types";
import NextLink from "next/link";
import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import { Box, Button, Stack, SvgIcon, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Loader from "../Loader";
import { brand } from "../../theme/colors";
import { pageTitleSx } from "../../utils/pageLayout";

export const detailPanelSx = {
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "neutral.200",
  borderRadius: 3,
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(17, 25, 39, 0.06)",
};

export const detailHeroSx = {
  background: `linear-gradient(135deg, ${alpha(brand.primary, 0.1)} 0%, ${alpha(brand.secondary, 0.03)} 100%)`,
  borderBottom: "1px solid",
  borderColor: "neutral.200",
  px: { xs: 2.5, md: 3.5 },
  py: { xs: 2.5, md: 3 },
};

export function DetailBackLink({ href, children = "Back" }) {
  return (
    <Button
      component={NextLink}
      href={href}
      startIcon={
        <SvgIcon fontSize="small">
          <ArrowLeftIcon />
        </SvgIcon>
      }
      sx={{
        alignSelf: "flex-start",
        color: "text.secondary",
        px: 0,
        textTransform: "none",
        "&:hover": { bgcolor: "transparent", color: "primary.main" },
      }}
    >
      {children}
    </Button>
  );
}

DetailBackLink.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export function DetailStat({ label, value }) {
  if (value == null || value === "" || value === "—") {
    return null;
  }

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: alpha(brand.primary, 0.12),
        borderRadius: 2,
        minWidth: { xs: 120, sm: 140 },
        maxWidth: { xs: "100%", sm: 220 },
        flex: { xs: "1 1 140px", sm: "0 1 auto" },
        px: 2,
        py: 1.25,
      }}
    >
      <Typography color="text.secondary" sx={{ display: "block", mb: 0.25 }} variant="caption">
        {label}
      </Typography>
      <Typography fontWeight={700} sx={{ wordBreak: "break-word" }} variant="body2">
        {value}
      </Typography>
    </Box>
  );
}

DetailStat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};

export function DetailHero({
  title,
  subtitle,
  badge = null,
  avatar = null,
  stats = [],
  footer = null,
}) {
  return (
    <Box sx={detailHeroSx}>
      <Stack
        alignItems={{ xs: "flex-start", md: "center" }}
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2.5}
      >
        <Stack alignItems={{ xs: "flex-start", md: "center" }} direction={{ xs: "column", md: "row" }} spacing={2.5}>
          {avatar}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ ...pageTitleSx, mb: 0.5 }} variant="h4">
              {title}
            </Typography>
            {subtitle ? (
              <Typography color="text.secondary" sx={{ wordBreak: "break-word" }} variant="body1">
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>
        {badge}
      </Stack>

      {(stats?.length || footer) ? (
        <Stack
          alignItems={{ xs: "stretch", sm: "center" }}
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mt: 2.5 }}
        >
          {stats?.length ? (
            <Stack direction="row" flexWrap="wrap" gap={1.5}>
              {stats.map((stat) => (
                <DetailStat key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </Stack>
          ) : (
            <Box />
          )}
          {footer ? (
            <Box
              sx={{
                alignSelf: { xs: "stretch", sm: "center" },
                display: "flex",
                justifyContent: { xs: "flex-start", sm: "flex-end" },
                ml: { sm: "auto" },
              }}
            >
              {footer}
            </Box>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
}

DetailHero.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  badge: PropTypes.node,
  avatar: PropTypes.node,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.node,
    })
  ),
  footer: PropTypes.node,
};

export function DetailAvatar({ src, alt, fallback }) {
  if (src) {
    return (
      <Box
        alt={alt}
        component="img"
        src={src}
        sx={{
          bgcolor: "neutral.100",
          border: "2px solid",
          borderColor: "background.paper",
          borderRadius: "20px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
          flexShrink: 0,
          height: 88,
          objectFit: "cover",
          width: 88,
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: alpha(brand.primary, 0.12),
        border: "2px solid",
        borderColor: "background.paper",
        borderRadius: "20px",
        color: "primary.main",
        display: "flex",
        flexShrink: 0,
        fontSize: 32,
        fontWeight: 800,
        height: 88,
        justifyContent: "center",
        width: 88,
      }}
    >
      {fallback || "?"}
    </Box>
  );
}

DetailAvatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  fallback: PropTypes.string,
};

export function DetailPanel({ children }) {
  return <Box sx={detailPanelSx}>{children}</Box>;
}

DetailPanel.propTypes = {
  children: PropTypes.node,
};

export function DetailSection({ title, description, children, noBorder = false }) {
  return (
    <Box
      sx={{
        px: { xs: 2.5, md: 3.5 },
        py: { xs: 2.5, md: 3 },
        ...(!noBorder && {
          borderTop: "1px solid",
          borderColor: "neutral.100",
        }),
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography fontWeight={700} variant="subtitle1">
          {title}
        </Typography>
        {description ? (
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
            {description}
          </Typography>
        ) : null}
      </Box>
      {children}
    </Box>
  );
}

DetailSection.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node,
  noBorder: PropTypes.bool,
};

export function DetailField({ label, value, hideEmpty = false }) {
  const isEmail = label === "Email" || (typeof value === "string" && value.includes("@"));
  const displayValue =
    value == null || value === "" || value === "false"
      ? "—"
      : isEmail
        ? String(value).toLowerCase()
        : value;

  if (hideEmpty && (displayValue === "—" || displayValue == null)) {
    return null;
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        color="text.secondary"
        sx={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: 0.4, mb: 0.5, textTransform: "uppercase" }}
        variant="caption"
      >
        {label}
      </Typography>
      <Typography
        data-email={isEmail ? "true" : undefined}
        fontWeight={600}
        sx={{
          wordBreak: "break-word",
          ...(isEmail ? { textTransform: "lowercase" } : {}),
        }}
        variant="body2"
      >
        {displayValue}
      </Typography>
    </Box>
  );
}

DetailField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  hideEmpty: PropTypes.bool,
};

export function DetailFieldGrid({ fields = [], columns = { xs: 1, sm: 2, lg: 3 } }) {
  const visible = fields.filter(
    (field) => !field.hideEmpty || (field.value != null && field.value !== "" && field.value !== "—")
  );

  if (!visible.length) {
    return (
      <Typography color="text.secondary" variant="body2">
        No information available.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2.5,
        gridTemplateColumns: {
          xs: "1fr",
          sm: `repeat(${columns.sm || 2}, minmax(0, 1fr))`,
          lg: `repeat(${columns.lg || 3}, minmax(0, 1fr))`,
        },
      }}
    >
      {visible.map((field) => (
        <DetailField key={field.label} hideEmpty={field.hideEmpty} label={field.label} value={field.value} />
      ))}
    </Box>
  );
}

DetailFieldGrid.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.node,
      hideEmpty: PropTypes.bool,
    })
  ),
  columns: PropTypes.object,
};

export function DetailEmptyState({ title, message }) {
  return (
    <Box sx={{ ...detailPanelSx, py: 8, px: 3, textAlign: "center" }}>
      <Typography variant="h6">{title}</Typography>
      {message ? (
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          {message}
        </Typography>
      ) : null}
    </Box>
  );
}

DetailEmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
};

export function DetailPageFrame({ backHref, backLabel, children }) {
  return (
    <Stack spacing={2.5}>
      {backHref ? <DetailBackLink href={backHref}>{backLabel}</DetailBackLink> : null}
      {children}
    </Stack>
  );
}

DetailPageFrame.propTypes = {
  backHref: PropTypes.string,
  backLabel: PropTypes.string,
  children: PropTypes.node,
};

export function DetailPageState({ loading, notFoundTitle, notFoundMessage, children }) {
  if (loading) {
    return <Loader page />;
  }

  if (notFoundTitle) {
    return <DetailEmptyState message={notFoundMessage} title={notFoundTitle} />;
  }

  return children;
}

DetailPageState.propTypes = {
  loading: PropTypes.bool,
  notFoundTitle: PropTypes.string,
  notFoundMessage: PropTypes.string,
  children: PropTypes.node,
};

export const detailTableRowSx = {
  "&:hover": { bgcolor: alpha(brand.primary, 0.03) },
  "& td": { borderBottom: "1px solid", borderColor: "neutral.100", py: 1.75 },
};

export const detailTableHeadSx = {
  "& th": {
    bgcolor: "neutral.50",
    borderBottom: "1px solid",
    borderColor: "neutral.200",
    color: "text.secondary",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.3,
    py: 1.5,
    textTransform: "uppercase",
  },
};

export function DetailRowList({ items = [] }) {
  const visible = items.filter(
    (item) => item.value != null && item.value !== "" && item.value !== "—"
  );

  if (!visible.length) {
    return null;
  }

  return (
    <Stack spacing={0}>
      {visible.map((item, index) => {
        const isEmail =
          item.label === "Email" ||
          (typeof item.value === "string" && item.value.includes("@"));

        return (
          <Stack
            direction="row"
            justifyContent="space-between"
            key={item.label}
            spacing={2}
            sx={{
              borderTop: index > 0 ? "1px solid" : "none",
              borderColor: "neutral.100",
              py: 1.25,
            }}
          >
            <Typography color="text.secondary" sx={{ flexShrink: 0 }} variant="body2">
              {item.label}
            </Typography>
            <Typography
              data-email={isEmail ? "true" : undefined}
              fontWeight={600}
              sx={{
                textAlign: "right",
                wordBreak: "break-word",
                ...(isEmail ? { textTransform: "lowercase" } : {}),
              }}
              variant="body2"
            >
              {isEmail ? String(item.value).toLowerCase() : item.value}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

DetailRowList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.node,
    })
  ),
};

export function DetailDocumentGallery({ documents = [] }) {
  if (!documents.length) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        overflowX: "auto",
        pb: 0.5,
        "&::-webkit-scrollbar": { height: 6 },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: "neutral.300",
          borderRadius: 3,
        },
      }}
    >
      {documents.map((doc) => (
        <Box
          key={doc.label}
          sx={{
            bgcolor: "neutral.50",
            border: "1px solid",
            borderColor: "neutral.200",
            borderRadius: 2,
            flex: "0 0 auto",
            minWidth: 200,
            p: 1.5,
            width: { xs: 200, sm: 220 },
          }}
        >
          <Typography fontWeight={600} sx={{ mb: 1.25 }} variant="caption">
            {doc.label}
          </Typography>
          {doc.src ? (
            <Box
              alt={doc.label}
              component="img"
              src={doc.src}
              sx={{
                borderRadius: 1.5,
                display: "block",
                maxHeight: 180,
                objectFit: "cover",
                width: "100%",
              }}
            />
          ) : (
            <Box
              sx={{
                alignItems: "center",
                bgcolor: "background.paper",
                border: "1px dashed",
                borderColor: "neutral.300",
                borderRadius: 1.5,
                color: "text.secondary",
                display: "flex",
                height: 120,
                justifyContent: "center",
              }}
            >
              <Typography variant="caption">Not available</Typography>
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  );
}

DetailDocumentGallery.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      src: PropTypes.string,
    })
  ),
};
