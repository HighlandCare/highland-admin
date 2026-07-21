import { React, useState, useEffect } from "react";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import Head from "next/head";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Modal,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

import { addFAQ, getFAQ } from "../Services/Auth.service";

import { useRouter } from "next/router";
import Loader from "../components/Loader";
import { FAQTable } from "../sections/faq/faq-table";
import { toast } from "react-toastify";
import { pageContainerSx, pageMainSx, responsiveModalSx } from "../utils/pageLayout";

const Page = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [faq, setFAQ] = useState([]);
  const [page, setPage] = useState(1);
  const [isAddFAQModalOpen, setIsAddFAQModalOpen] = useState(false);
  const [isEditFAQModalOpen, setIsEditFAQModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newFAQ, setNewFAQ] = useState([{ question: "", answer: "" }]);
  const [editFAQ, setEditFAQ] = useState({ question: "", answer: "" });
  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      setIsLoading(true);
      router.push("/auth/login");
    }
  }, [router]);

  const fetchFAQ = async () => {
    try {
      setIsLoading(true);
      const response = await getFAQ();
      setFAQ(response.data.item || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching faq:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQ();
  }, []);

  const persistFAQ = async (items, successMessage) => {
    await addFAQ("faq", items);
    const response = await getFAQ();
    setFAQ(response.data.item || []);
    toast.success(successMessage);
  };

  const handleOpenAddFAQModal = () => {
    setNewFAQ([{ question: "", answer: "" }]);
    setIsAddFAQModalOpen(true);
  };

  const handleCloseAddFAQModal = () => {
    setIsAddFAQModalOpen(false);
  };

  const handleAddFAQ = () => {
    setNewFAQ([...newFAQ, { question: "", answer: "" }]);
  };

  const handleFAQChange = (index, event) => {
    const updatedFAQ = [...newFAQ];
    updatedFAQ[index][event.target.name] = event.target.value;
    setNewFAQ(updatedFAQ);
  };

  const handleSaveFAQ = async () => {
    const isEmptyField = newFAQ.some((faqItem) => !faqItem.question || !faqItem.answer);

    if (isEmptyField) {
      toast.error("Some fields are empty. Please fill in all fields.");
      return;
    }

    try {
      setIsSaving(true);
      const updatedList = [...faq, ...newFAQ];
      await persistFAQ(updatedList, "FAQs Added Successfully!");
      setIsAddFAQModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save FAQs.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFAQFromModal = (indexToDelete) => {
    if (newFAQ.length === 1) {
      toast.error("At least one FAQ entry is required.");
      return;
    }
    const updatedFAQ = newFAQ.filter((_, index) => index !== indexToDelete);
    setNewFAQ(updatedFAQ);
  };

  const handleOpenEditFAQ = (faqItem, index) => {
    if (index < 0) {
      return;
    }
    setEditIndex(index);
    setEditFAQ({ question: faqItem.question || "", answer: faqItem.answer || "" });
    setIsEditFAQModalOpen(true);
  };

  const handleCloseEditFAQ = () => {
    setIsEditFAQModalOpen(false);
    setEditIndex(null);
    setEditFAQ({ question: "", answer: "" });
  };

  const handleEditFAQChange = (event) => {
    setEditFAQ((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleUpdateFAQ = async () => {
    if (!editFAQ.question || !editFAQ.answer) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (editIndex === null || editIndex < 0) {
      return;
    }

    try {
      setIsSaving(true);
      const updatedList = faq.map((item, index) =>
        index === editIndex ? { question: editFAQ.question, answer: editFAQ.answer } : item
      );
      await persistFAQ(updatedList, "FAQ Updated Successfully!");
      handleCloseEditFAQ();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update FAQ.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDeleteFAQ = (_faqItem, index) => {
    if (index < 0) {
      return;
    }
    setDeleteIndex(index);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteFAQ = () => {
    setIsDeleteDialogOpen(false);
    setDeleteIndex(null);
  };

  const handleConfirmDeleteFAQ = async () => {
    if (deleteIndex === null || deleteIndex < 0) {
      return;
    }

    try {
      setIsSaving(true);
      const updatedList = faq.filter((_, index) => index !== deleteIndex);
      await persistFAQ(updatedList, "FAQ Deleted Successfully!");
      handleCloseDeleteFAQ();
      if (page > 1 && updatedList.length <= (page - 1) * 10) {
        setPage(Math.max(1, page - 1));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete FAQ.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <>
      <Head>
        <title>FAQ | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
            {isLoading ? (
              <Loader page />
            ) : (
              <FAQTable
                actions={
                  <Button color="primary" onClick={handleOpenAddFAQModal} variant="contained">
                    Add FAQ
                  </Button>
                }
                items={faq}
                onDelete={handleOpenDeleteFAQ}
                onEdit={handleOpenEditFAQ}
                onPageChange={handlePageChange}
                page={page}
              />
            )}
          </Stack>
        </Container>
      </Box>

      {/* Add FAQ Modal */}
      <Modal open={isAddFAQModalOpen} onClose={handleCloseAddFAQModal}>
        <Box sx={responsiveModalSx}>
          <Typography sx={{ mb: 2 }} variant="h6">
            Add FAQ
          </Typography>
          <Box sx={{ maxHeight: { xs: "50vh", sm: "400px" }, overflowY: "auto" }}>
            {newFAQ.map((item, index) => (
              <Stack
                key={index}
                alignItems={{ xs: "stretch", sm: "flex-start" }}
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ mb: 2.5 }}
              >
                <Stack flex={1} spacing={1} sx={{ width: "100%" }}>
                  <TextField
                    fullWidth
                    label={`Question ${index + 1}`}
                    name="question"
                    onChange={(e) => handleFAQChange(index, e)}
                    value={item.question}
                  />
                  <TextField
                    fullWidth
                    label={`Answer ${index + 1}`}
                    multiline
                    minRows={3}
                    name="answer"
                    onChange={(e) => handleFAQChange(index, e)}
                    value={item.answer}
                  />
                </Stack>
                {newFAQ.length > 1 && (
                  <Stack alignItems="center" justifyContent="center">
                    <IconButton
                      aria-label={`Delete Question ${index + 1}`}
                      color="error"
                      onClick={() => handleDeleteFAQFromModal(index)}
                      size="small"
                    >
                      <TrashIcon width={24} />
                    </IconButton>
                  </Stack>
                )}
              </Stack>
            ))}
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
            <Button color="primary" fullWidth onClick={handleAddFAQ} variant="outlined">
              Add Another
            </Button>
            <Button
              color="primary"
              disabled={isSaving}
              fullWidth
              onClick={handleSaveFAQ}
              variant="contained"
            >
              {isSaving ? <Loader color="#fff" inline size="xs" /> : "Save"}
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Edit FAQ Modal */}
      <Modal open={isEditFAQModalOpen} onClose={handleCloseEditFAQ}>
        <Box sx={responsiveModalSx}>
          <Typography sx={{ mb: 2 }} variant="h6">
            Edit FAQ
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Question"
              name="question"
              onChange={handleEditFAQChange}
              value={editFAQ.question}
            />
            <TextField
              fullWidth
              label="Answer"
              multiline
              minRows={4}
              name="answer"
              onChange={handleEditFAQChange}
              value={editFAQ.answer}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
            <Button color="inherit" fullWidth onClick={handleCloseEditFAQ} variant="outlined">
              Cancel
            </Button>
            <Button
              color="primary"
              disabled={isSaving}
              fullWidth
              onClick={handleUpdateFAQ}
              variant="contained"
            >
              {isSaving ? <Loader color="#fff" inline size="xs" /> : "Update"}
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteFAQ}>
        <DialogTitle>Delete FAQ</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this FAQ? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={isSaving} onClick={handleCloseDeleteFAQ}>
            Cancel
          </Button>
          <Button
            color="error"
            disabled={isSaving}
            onClick={handleConfirmDeleteFAQ}
            variant="contained"
          >
            {isSaving ? <Loader color="#fff" inline size="xs" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default Page;
