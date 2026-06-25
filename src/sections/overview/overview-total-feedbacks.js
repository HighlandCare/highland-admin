import { React, useState, useEffect } from "react";
import PropTypes from "prop-types";
import ArrowRightIcon from "@heroicons/react/24/solid/ArrowRightIcon";
import Link from "next/link";
import {
  CardActions,
  Divider,
  Avatar,
  Box,
  Card,
  CardContent,
  Stack,
  SvgIcon,
  Typography,
  Button,
} from "@mui/material";
import { getChap } from "../../Services/Auth.service";
import Loader from "../../components/Loader";
import Feed from "@heroicons/react/24/solid/ChatBubbleOvalLeftEllipsisIcon";
import Cog6ToothIcon from "@heroicons/react/24/solid/Cog6ToothIcon";
export const OverviewTotalFeedbacks = (props) => {
  const { sx } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [feedbacks, setFeedback] = useState([]);
  const [page, setPage] = useState(1);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getChap(page);

        setFeedback(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Card sx={{ ...sx, padding: 0, margin: 0 }}>
      <CardContent>
        <Stack
          alignItems="flex-start"
          direction="row"
          justifyContent="space-between"
          spacing={3}
          mb={2}
        >
          <Stack spacing={2}>
            <Typography color="text.secondary" variant="overline">
              Total Chaperone
            </Typography>
            <Box sx={{ alignItems: "center", display: "flex", minHeight: 40 }}>
              {isLoading ? (
                <Loader minHeight={40} size="sm" />
              ) : (
                <Typography variant="h4">{feedbacks.length}</Typography>
              )}
            </Box>
          </Stack>
          <Avatar
            sx={{
              backgroundColor: "success.main",
              height: 56,
              width: 56,
            }}
          >
            <SvgIcon>
              <Cog6ToothIcon />
            </SvgIcon>
          </Avatar>
        </Stack>

        <Stack spacing={1}>
          <Divider />
          <CardActions sx={{ justifyContent: "flex-end", margin: 0, padding: 0 }}>
            <Link href="/chaperone" style={{ color: "black" }}>
              <Button
                color="inherit"
                endIcon={
                  <SvgIcon fontSize="small">
                    <ArrowRightIcon />
                  </SvgIcon>
                }
                size="small"
              >
                See all chaperone
              </Button>
            </Link>
          </CardActions>
        </Stack>
      </CardContent>
    </Card>
  );
};

OverviewTotalFeedbacks.propTypes = {
  difference: PropTypes.number,
  positive: PropTypes.bool,
  value: PropTypes.string.toString,
  sx: PropTypes.object,
};
