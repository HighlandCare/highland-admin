import PropTypes from "prop-types";
import Link from "next/link";
import ArrowRightIcon from "@heroicons/react/24/solid/ArrowRightIcon";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  Stack,
  SvgIcon,
  Typography,
} from "@mui/material";
import Loader from "../../components/Loader";

export const OverviewStatCard = (props) => {
  const {
    title,
    value,
    icon: Icon,
    iconColor = "primary.main",
    href,
    actionLabel,
    loading = false,
    sx,
  } = props;

  return (
    <Card sx={{ height: "100%", ...sx }}>
      <CardContent>
        <Stack
          alignItems="flex-start"
          direction="row"
          justifyContent="space-between"
          spacing={3}
          mb={href ? 2 : 0}
        >
          <Stack spacing={1} sx={{ minWidth: 0 }}>
            <Typography color="text.secondary" variant="overline">
              {title}
            </Typography>
            <Box sx={{ alignItems: "center", display: "flex", minHeight: 40 }}>
              {loading ? (
                <Loader minHeight={40} size="sm" />
              ) : (
                <Typography sx={{ wordBreak: "break-word" }} variant="h4">
                  {value}
                </Typography>
              )}
            </Box>
          </Stack>
          <Avatar
            sx={{
              backgroundColor: iconColor,
              height: 56,
              width: 56,
            }}
          >
            <SvgIcon>
              <Icon />
            </SvgIcon>
          </Avatar>
        </Stack>

        {href && actionLabel && (
          <Stack spacing={1}>
            <Divider />
            <CardActions sx={{ justifyContent: "flex-end", margin: 0, padding: 0 }}>
              <Link href={href} style={{ color: "inherit", textDecoration: "none" }}>
                <Button
                  color="inherit"
                  endIcon={
                    <SvgIcon fontSize="small">
                      <ArrowRightIcon />
                    </SvgIcon>
                  }
                  size="small"
                >
                  {actionLabel}
                </Button>
              </Link>
            </CardActions>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

OverviewStatCard.propTypes = {
  actionLabel: PropTypes.string,
  href: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  iconColor: PropTypes.string,
  loading: PropTypes.bool,
  sx: PropTypes.object,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
