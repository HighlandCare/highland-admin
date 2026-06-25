/* eslint-disable react/jsx-max-props-per-line */
import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import ChatBubbleLeftRightIcon from "@heroicons/react/24/outline/ChatBubbleLeftRightIcon";
import {
  Box,
  Button,
  Modal,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  DataTable,
  DataTableToolbar,
  filterBySearch,
  getServerPaginationMeta,
  getServerPaginationProps,
  sortItems,
  tableActionButtonSx,
} from "../../components/data-table";
import {
  StatusBadge,
  TablePersonCell,
  TableQuickActions,
} from "../../components/table-cells";
import { replyToCustomer } from "../../Services/Auth.service";
import Loader from "../../components/Loader";
import { toast } from "react-toastify";
import { getListFromResponse } from "../../utils/listUtils";
import { responsiveModalSx } from "../../utils/pageLayout";

export const FeedbackTable = (props) => {
  const {
    items = [],
    onPageChange = () => {},
    page = 1,
    title = "Feedback",
  } = props;

  const [openModal, setOpenModal] = useState(false);
  const [modalFeedback, setModalFeedback] = useState(null);
  const [reply, setReply] = useState("");
  const [modalMode, setModalMode] = useState("view");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const replySubject = "Your Feedback";

  const handleOpenViewModal = (feedback) => {
    setModalFeedback(feedback);
    setModalMode("view");
    setOpenModal(true);
  };

  const handleOpenReplyModal = (feedback) => {
    setModalFeedback(feedback);
    setModalMode("reply");
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setModalFeedback(null);
    setReply("");
    setOpenModal(false);
  };

  const handleReplyChange = (event) => {
    setReply(event.target.value);
  };

  const handleReplySubmit = async () => {
    try {
      const feedID = modalFeedback._id;
      setIsSubmitting(true);
      await replyToCustomer(feedID, replySubject, reply);
      setIsSubmitting(false);
      handleCloseModal();
      toast.success("Email Sent!");
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  const pageFeedbacks = useMemo(() => getListFromResponse(items, ["feedbacks"]), [items]);
  const isEmpty = !pageFeedbacks.length && !(items?.total_records ?? items?.totalRecords);

  const rows = useMemo(() => {
    if (!pageFeedbacks.length) {
      return [];
    }

    const filtered = filterBySearch(pageFeedbacks, search, (feedback) =>
      [feedback?.userId?.fullName, feedback?.subject, feedback?.message].filter(Boolean).join(" ")
    );

    return sortItems(filtered, "newest", (a, b) => ({
      dateA: new Date(a?.createdAt || 0).getTime(),
      dateB: new Date(b?.createdAt || 0).getTime(),
      nameA: a?.userId?.fullName || a?.subject || "",
      nameB: b?.userId?.fullName || b?.subject || "",
    }));
  }, [pageFeedbacks, search]);

  const paginationMeta = useMemo(
    () => getServerPaginationMeta(items, page, pageFeedbacks.length),
    [items, page, pageFeedbacks.length]
  );

  const handleSearchChange = (value) => {
    setSearch(value);
    onPageChange(1);
  };

  const showEmptyState = isEmpty;

  return (
    <>
      <DataTable
        empty={showEmptyState}
        pagination={getServerPaginationProps({
          currentPage: page,
          onPageChange,
          totalPages: paginationMeta.totalPages,
          totalRecords: paginationMeta.totalRecords,
        })}
        toolbar={
          <DataTableToolbar
            onSearchChange={handleSearchChange}
            searchValue={search}
            title={title}
          />
        }
      >
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Subject</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Quick Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography color="text.secondary" textAlign="center" variant="body2">
                  No matching results found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((feedback) => (
            <TableRow hover key={feedback._id}>
              <TableCell>
                <TablePersonCell
                  name={feedback?.userId?.fullName}
                  subtitle={feedback?.userId?.email}
                />
              </TableCell>
              <TableCell>
                <Typography fontWeight={600} variant="body2">
                  {feedback.subject}
                </Typography>
              </TableCell>
              <TableCell sx={{ maxWidth: 360 }}>
                <Typography
                  color="text.secondary"
                  sx={{
                    display: "-webkit-box",
                    overflow: "hidden",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                  }}
                  variant="body2"
                >
                  {feedback.message}
                </Typography>
              </TableCell>
              <TableCell>
                <StatusBadge color="info" label="Received" />
              </TableCell>
              <TableCell align="right">
                <TableQuickActions
                  actions={[
                    {
                      icon: EyeIcon,
                      label: "View feedback",
                      onClick: () => handleOpenViewModal(feedback),
                    },
                    {
                      icon: ChatBubbleLeftRightIcon,
                      label: "Reply",
                      onClick: () => handleOpenReplyModal(feedback),
                    },
                  ]}
                />
              </TableCell>
            </TableRow>
          ))
          )}
        </TableBody>
      </DataTable>

      <Modal onClose={handleCloseModal} open={openModal}>
        <Box
          sx={{
            ...responsiveModalSx,
            border: "1px solid",
            borderColor: "neutral.200",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)",
            width: { xs: "100%", sm: 440 },
          }}
        >
          <Typography sx={{ mb: 2 }} variant="h6">
            {modalMode === "view" ? "Feedback Details" : "Reply to Feedback"}
          </Typography>
          {modalFeedback && (
            <>
              {modalMode === "view" && (
                <>
                  <Typography sx={{ mb: 1 }} variant="subtitle2">
                    Subject
                  </Typography>
                  <Typography sx={{ mb: 2 }} variant="body2">
                    {modalFeedback.subject}
                  </Typography>
                  <Typography sx={{ mb: 1 }} variant="subtitle2">
                    Message
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
                    {modalFeedback.message}
                  </Typography>
                  {modalFeedback.images && modalFeedback.images.length > 0 && (
                    <Box mt={2}>
                      <Typography sx={{ mb: 1 }} variant="subtitle2">
                        Images
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {modalFeedback.images.map((image, index) => (
                          <Box
                            component="img"
                            key={index}
                            src={`https://lgmapi.s3.us-east-1.amazonaws.com/public/uploads/${image}`}
                            sx={{
                              border: "1px solid",
                              borderColor: "neutral.200",
                              borderRadius: 2,
                              height: 96,
                              objectFit: "cover",
                              width: 96,
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </>
              )}
              {modalMode === "reply" && (
                <TextField
                  fullWidth
                  label="Reply"
                  multiline
                  onChange={handleReplyChange}
                  rows={4}
                  value={reply}
                />
              )}
              <Stack
                direction={{ xs: "column-reverse", sm: "row" }}
                justifyContent="flex-end"
                mt={3}
                spacing={1}
              >
                <Button
                  fullWidth
                  onClick={handleCloseModal}
                  sx={{ ...tableActionButtonSx, width: { xs: "100%", sm: "auto" } }}
                  variant="outlined"
                >
                  Close
                </Button>
                {modalMode === "reply" && (
                  <Button
                    color="primary"
                    disabled={isSubmitting}
                    fullWidth
                    onClick={handleReplySubmit}
                    sx={{ ...tableActionButtonSx, width: { xs: "100%", sm: "auto" } }}
                    variant="contained"
                  >
                    {isSubmitting ? <Loader inline size="xs" /> : "Reply"}
                  </Button>
                )}
              </Stack>
            </>
          )}
        </Box>
      </Modal>
    </>
  );
};

FeedbackTable.propTypes = {
  items: PropTypes.object,
  onPageChange: PropTypes.func,
  page: PropTypes.number,
  title: PropTypes.string,
};
