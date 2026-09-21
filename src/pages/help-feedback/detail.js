import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import DocumentIcon from "@heroicons/react/24/outline/DocumentIcon";
import PaperClipIcon from "@heroicons/react/24/outline/PaperClipIcon";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Container,
  Dialog,
  Link,
  MenuItem,
  Stack,
  SvgIcon,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Layout as DashboardLayout } from "../../layouts/dashboard/layout";
import Loader from "../../components/Loader";
import { StatusBadge } from "../../components/table-cells";
import {
  DetailAvatar,
  DetailHero,
  DetailPageFrame,
  DetailPageState,
  DetailPanel,
  DetailRowList,
  DetailSection,
} from "../../components/detail-page/detail-page-ui";
import {
  getSupportQueryById,
  replyToSupportQuery,
  updateSupportQueryStatus,
} from "../../Services/support-queries.service";
import { formatDateTime } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
import { brand } from "../../theme/colors";
import {
  formatFileSize,
  formatSupportLabel,
  getAttachmentLabel,
  getAttachmentUrl,
  getStoredSupportQueryDetail,
  getSubmitterImageUrl,
  getSupportQueryFromResponse,
  getSupportQueryId,
  getSupportStatusMeta,
  isImageAttachment,
  storeSupportQueryDetail,
  SUPPORT_QUERY_STATUS_OPTIONS,
  validateSupportReply,
} from "../../utils/supportQueryUtils";

const selectLabelSx = {
  bgcolor: "background.paper",
  px: 0.5,
};

const MessageAttachments = ({ attachments = [], onPreviewImage }) => {
  if (!attachments.length) {
    return null;
  }

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={1}
      sx={{ mt: 1.25, width: "100%" }}
    >
      {attachments.map((file, fileIndex) => {
        const url = getAttachmentUrl(file);
        const label = getAttachmentLabel(file);
        const key = url || `${label}-${fileIndex}`;

        if (!url) {
          return null;
        }

        if (isImageAttachment(file)) {
          return (
            <Box
              alt={label}
              component="img"
              key={key}
              onClick={() => onPreviewImage?.(url, label)}
              src={url}
              sx={{
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "neutral.200",
                borderRadius: 1.5,
                cursor: "pointer",
                display: "block",
                height: { xs: 88, sm: 104 },
                objectFit: "cover",
                width: { xs: 88, sm: 104 },
              }}
            />
          );
        }

        return (
          <Link
            href={url}
            key={key}
            rel="noopener noreferrer"
            sx={{
              alignItems: "center",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "neutral.200",
              borderRadius: 1.5,
              color: "text.primary",
              display: "inline-flex",
              gap: 1,
              maxWidth: "100%",
              minHeight: 44,
              px: 1.25,
              py: 1,
              textDecoration: "none",
              "&:hover": {
                bgcolor: "neutral.50",
                borderColor: "neutral.300",
              },
            }}
            target="_blank"
          >
            <SvgIcon fontSize="small" sx={{ color: "text.secondary", flexShrink: 0 }}>
              <DocumentIcon />
            </SvgIcon>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                variant="body2"
              >
                {label}
              </Typography>
              {file.size ? (
                <Typography color="text.secondary" variant="caption">
                  {formatFileSize(file.size)}
                </Typography>
              ) : null}
            </Box>
          </Link>
        );
      })}
    </Stack>
  );
};

const Page = () => {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const queryId = router.query?.id;

  const [row, setRow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [statusOnly, setStatusOnly] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    if (!router.isReady || !queryId) {
      return undefined;
    }

    let active = true;

    const loadDetail = async () => {
      const cached = getStoredSupportQueryDetail();
      if (cached && String(getSupportQueryId(cached)) === String(queryId)) {
        setRow(cached);
      }

      try {
        setIsLoading(true);
        const response = await getSupportQueryById(queryId);
        const detail = getSupportQueryFromResponse(response);
        if (active && detail) {
          setRow(detail);
          storeSupportQueryDetail(detail);
          setStatusOnly(detail.status || "");
          setReplyStatus("");
        }
      } catch (error) {
        console.error("Error loading support query:", error);
        if (active) {
          toast.error(error.message || "Failed to load support query");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      active = false;
    };
  }, [router.isReady, queryId]);

  useEffect(() => {
    const urls = attachments.map((file) =>
      isImageAttachment(file) ? URL.createObjectURL(file) : null
    );
    setAttachmentPreviews(urls);

    return () => {
      urls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [attachments]);

  const statusMeta = useMemo(() => getSupportStatusMeta(row?.status), [row?.status]);
  const messages = useMemo(() => {
    const list = Array.isArray(row?.messages) ? [...row.messages] : [];
    return list.sort((a, b) => {
      const timeA = new Date(a?.createdAt || 0).getTime();
      const timeB = new Date(b?.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [row?.messages]);
  const submitter = row?.submitter || {};

  const heroStats = useMemo(() => {
    if (!row) {
      return [];
    }
    return [
      { label: "Category", value: formatSupportLabel(row.category) },
      { label: "Role", value: formatSupportLabel(row.submitterRole) },
      { label: "Messages", value: String(messages.length) },
    ].filter((item) => item.value && item.value !== "—");
  }, [row, messages.length]);

  const submitterItems = useMemo(
    () =>
      [
        { label: "Name", value: submitter.fullName },
        { label: "Email", value: submitter.email },
        { label: "Phone", value: submitter.phone },
        { label: "Type", value: formatSupportLabel(submitter.userType || row?.submitterRole) },
      ].filter((item) => item.value),
    [submitter, row?.submitterRole]
  );

  const timingItems = useMemo(
    () =>
      [
        { label: "Created", value: formatDateTime(row?.createdAt) },
        { label: "Updated", value: formatDateTime(row?.updatedAt) },
        { label: "Last message", value: formatDateTime(row?.lastMessageAt) },
        { label: "Resolved", value: row?.resolvedAt ? formatDateTime(row.resolvedAt) : null },
        { label: "Closed", value: row?.closedAt ? formatDateTime(row.closedAt) : null },
      ].filter((item) => item.value && item.value !== "—"),
    [row]
  );

  const clearAttachments = () => {
    setAttachments([]);
  };

  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    setAttachments(files.slice(0, 5));
    event.target.value = "";
  };

  const handleReply = async () => {
    const validationError = validateSupportReply(replyMessage, attachments);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsReplying(true);
      const response = await replyToSupportQuery(getSupportQueryId(row), {
        message: replyMessage.trim(),
        status: replyStatus || undefined,
        attachments,
      });
      const updated = getSupportQueryFromResponse(response);
      if (updated) {
        setRow(updated);
        storeSupportQueryDetail(updated);
        setStatusOnly(updated.status || "");
      }
      setReplyMessage("");
      setReplyStatus("");
      clearAttachments();
      toast.success("Reply sent successfully");
    } catch (error) {
      toast.error(error.message || "Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusOnly) {
      toast.error("Select a status");
      return;
    }
    if (statusOnly === row?.status) {
      toast.info("Status is already set to this value");
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const response = await updateSupportQueryStatus(getSupportQueryId(row), statusOnly);
      const updated = getSupportQueryFromResponse(response);
      if (updated) {
        setRow(updated);
        storeSupportQueryDetail(updated);
      }
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <>
      <Head>
        <title>Support Query | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <DetailPageFrame backHref="/help-feedback" backLabel="Back to Help & Feedback">
            <DetailPageState
              loading={isLoading && !row}
              notFoundMessage="The selected support query could not be loaded."
              notFoundTitle={!isLoading && !row ? "Support query not found" : undefined}
            >
              {row ? (
                <Stack spacing={2.5}>
                  <DetailPanel>
                    <DetailHero
                      avatar={
                        <DetailAvatar
                          alt={submitter.fullName || "Submitter"}
                          fallback={(submitter.fullName || "S").charAt(0).toUpperCase()}
                          src={getSubmitterImageUrl(submitter)}
                        />
                      }
                      badge={
                        statusMeta ? (
                          <StatusBadge color={statusMeta.color} label={statusMeta.label} />
                        ) : null
                      }
                      stats={heroStats}
                      subtitle={submitter.fullName || submitter.email || "Submitter"}
                      title={row.subject || "Support query"}
                    />

                    <DetailSection
                      description="Update status without sending a message, or reply to the thread below."
                      noBorder
                      title="Admin actions"
                    >
                      <Stack
                        alignItems={{ xs: "stretch", sm: "center" }}
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.25}
                      >
                        <TextField
                          InputLabelProps={{ sx: selectLabelSx }}
                          fullWidth
                          label="Status"
                          onChange={(event) => setStatusOnly(event.target.value)}
                          select
                          size="medium"
                          sx={{ flex: 1, minWidth: 0 }}
                          value={statusOnly || row.status || "open"}
                        >
                          {SUPPORT_QUERY_STATUS_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Button
                          disabled={isUpdatingStatus || statusOnly === row.status}
                          onClick={handleStatusUpdate}
                          sx={{
                            color: "primary.main",
                            flexShrink: 0,
                            height: 56,
                            minWidth: { xs: "100%", sm: 140 },
                            "&.Mui-disabled": {
                              borderColor: alpha(brand.primary, 0.3),
                              color: alpha(brand.primary, 0.55),
                            },
                          }}
                          variant="outlined"
                        >
                          {isUpdatingStatus ? (
                            <Loader color={brand.primary} inline size="xs" />
                          ) : (
                            "Update"
                          )}
                        </Button>
                      </Stack>
                    </DetailSection>

                    <DetailSection title="Conversation">
                      <Box
                        sx={{
                          maxHeight: { xs: 360, sm: 440, md: 520 },
                          overflowX: "hidden",
                          overflowY: "auto",
                          pr: 0.5,
                          width: "100%",
                          "&::-webkit-scrollbar": {
                            width: 6,
                          },
                          "&::-webkit-scrollbar-thumb": {
                            bgcolor: "neutral.300",
                            borderRadius: 3,
                          },
                        }}
                      >
                        <Stack spacing={1.5} sx={{ width: "100%" }}>
                          {messages.length === 0 ? (
                            <Typography color="text.secondary" variant="body2">
                              No messages yet.
                            </Typography>
                          ) : (
                            messages.map((message, index) => {
                              const isAdmin = message.senderRole === "admin";
                              const messageAttachments = Array.isArray(message.attachments)
                                ? message.attachments
                                : [];
                              return (
                                <Box
                                  key={message.id || message._id || `message-${index}`}
                                  sx={{
                                    alignSelf: isAdmin ? "flex-end" : "flex-start",
                                    bgcolor: isAdmin
                                      ? alpha(brand.primary, 0.08)
                                      : "neutral.100",
                                    border: "1px solid",
                                    borderColor: isAdmin
                                      ? alpha(brand.primary, 0.2)
                                      : "neutral.200",
                                    borderRadius: 2,
                                    boxSizing: "border-box",
                                    maxWidth: { xs: "100%", sm: "90%", md: "75%" },
                                    minWidth: 0,
                                    px: { xs: 1.5, sm: 2 },
                                    py: 1.5,
                                    width: "fit-content",
                                  }}
                                >
                                  <Typography color="text.secondary" variant="caption">
                                    {[
                                      formatSupportLabel(message.senderRole),
                                      formatDateTime(message.createdAt),
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      mt: 0.5,
                                      overflowWrap: "anywhere",
                                      whiteSpace: "pre-wrap",
                                      wordBreak: "break-word",
                                    }}
                                    variant="body2"
                                  >
                                    {message.message || "—"}
                                  </Typography>
                                  <MessageAttachments
                                    attachments={messageAttachments}
                                    onPreviewImage={(url, label) =>
                                      setPreviewImage({ url, label })
                                    }
                                  />
                                </Box>
                              );
                            })
                          )}
                        </Stack>
                      </Box>
                    </DetailSection>

                    <DetailSection
                      description="Replies notify the submitter in-app and via push."
                      title="Reply"
                    >
                      <Stack spacing={2} sx={{ width: "100%" }}>
                        <TextField
                          fullWidth
                          label="Message"
                          minRows={3}
                          multiline
                          onChange={(event) => setReplyMessage(event.target.value)}
                          placeholder="Write your reply…"
                          value={replyMessage}
                        />

                        <TextField
                          InputLabelProps={{ sx: selectLabelSx }}
                          fullWidth
                          helperText="Optional. Open queries auto-move to In progress when you reply."
                          label="Set status with reply"
                          onChange={(event) => setReplyStatus(event.target.value)}
                          select
                          value={replyStatus}
                        >
                          <MenuItem value="">Keep current / auto</MenuItem>
                          {SUPPORT_QUERY_STATUS_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>

                        <Stack
                          alignItems={{ xs: "stretch", sm: "center" }}
                          direction={{ xs: "column", sm: "row" }}
                          flexWrap="wrap"
                          spacing={1.25}
                        >
                          <input
                            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,image/*,application/pdf"
                            hidden
                            multiple
                            onChange={handleFilesChange}
                            ref={fileInputRef}
                            type="file"
                          />
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            startIcon={
                              <SvgIcon fontSize="small">
                                <PaperClipIcon />
                              </SvgIcon>
                            }
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                            variant="outlined"
                          >
                            Attach files
                          </Button>
                          <Typography
                            color="text.secondary"
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                            variant="caption"
                          >
                            Up to 5 files · 10 MB each · images, PDF, Word
                          </Typography>
                        </Stack>

                        {attachments.length > 0 ? (
                          <Stack spacing={1.25}>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                              {attachments.map((file, index) => {
                                const previewUrl = attachmentPreviews[index];
                                if (previewUrl) {
                                  return (
                                    <Box
                                      alt={file.name}
                                      component="img"
                                      key={`${file.name}-${file.size}-${index}`}
                                      src={previewUrl}
                                      sx={{
                                        border: "1px solid",
                                        borderColor: "neutral.200",
                                        borderRadius: 1.5,
                                        height: 88,
                                        objectFit: "cover",
                                        width: 88,
                                      }}
                                    />
                                  );
                                }

                                return (
                                  <Box
                                    key={`${file.name}-${file.size}-${index}`}
                                    sx={{
                                      alignItems: "center",
                                      border: "1px solid",
                                      borderColor: "neutral.200",
                                      borderRadius: 1.5,
                                      display: "inline-flex",
                                      gap: 1,
                                      maxWidth: "100%",
                                      px: 1.25,
                                      py: 1,
                                    }}
                                  >
                                    <SvgIcon fontSize="small" sx={{ color: "text.secondary" }}>
                                      <DocumentIcon />
                                    </SvgIcon>
                                    <Typography
                                      sx={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                      variant="body2"
                                    >
                                      {file.name}
                                      {file.size ? ` (${formatFileSize(file.size)})` : ""}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Stack>
                            <Button
                              color="inherit"
                              onClick={clearAttachments}
                              size="small"
                              sx={{ alignSelf: "flex-start" }}
                            >
                              Clear attachments
                            </Button>
                          </Stack>
                        ) : null}

                        <Button
                          disabled={isReplying || !replyMessage.trim()}
                          onClick={handleReply}
                          sx={{
                            alignSelf: { xs: "stretch", sm: "flex-start" },
                            color: "#fff",
                            minWidth: 140,
                            "&.Mui-disabled": {
                              color: "rgba(255, 255, 255, 0.7)",
                            },
                          }}
                          variant="contained"
                        >
                          {isReplying ? <Loader color="#fff" inline size="xs" /> : "Send reply"}
                        </Button>
                      </Stack>
                    </DetailSection>

                    {submitterItems.length ? (
                      <DetailSection title="Submitter">
                        <DetailRowList items={submitterItems} />
                      </DetailSection>
                    ) : null}

                    {timingItems.length ? (
                      <DetailSection title="Timing">
                        <DetailRowList items={timingItems} />
                      </DetailSection>
                    ) : null}
                  </DetailPanel>
                </Stack>
              ) : null}
            </DetailPageState>
          </DetailPageFrame>
        </Container>
      </Box>

      <Dialog
        fullWidth
        maxWidth="md"
        onClose={() => setPreviewImage(null)}
        open={Boolean(previewImage)}
      >
        {previewImage ? (
          <Box sx={{ bgcolor: "neutral.900", p: { xs: 1, sm: 1.5 } }}>
            <Box
              alt={previewImage.label || "Attachment"}
              component="img"
              src={previewImage.url}
              sx={{
                display: "block",
                maxHeight: "80vh",
                mx: "auto",
                objectFit: "contain",
                width: "100%",
              }}
            />
          </Box>
        ) : null}
      </Dialog>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
