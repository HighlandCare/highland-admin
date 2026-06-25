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
  Table,
  Modal,
  TextField,
  IconButton,
  Card,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddFAQModalOpen, setIsAddFAQModalOpen] = useState(false);
  const [newFAQ, setNewFAQ] = useState([{ question: "Question 1", answer: "Answer 1" }]);
  const router = useRouter();

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      setIsLoading(true);
      return router.push("auth/login");
    }
  }, []);

  const fetchFAQ = async () => {
    try {
      setIsLoading(true);
      const response = await getFAQ();
      console.log(JSON.stringify(response.data, null, 2));
      setFAQ(response.data.item);
      console.log(faq);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching faq:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQ();
  }, []);

  const handleOpenAddFAQModal = () => {
    setIsAddFAQModalOpen(true);
    // Prepopulate the modal fields with existing FAQ data
    setNewFAQ([...faq.map((item) => ({ question: item.question, answer: item.answer }))]);
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
    // Check if any of the fields (questions or answers) are empty
    const isEmptyField = newFAQ.some((faqItem) => !faqItem.question || !faqItem.answer);

    if (isEmptyField) {
      // Display an error message or perform an action if fields are empty
      toast.error("Some fields are empty. Please fill in all fields.");
      return;
    }
    try {
      setIsLoading(true);
      // Call the addFAQ function with the new FAQ items
      await addFAQ("faq", newFAQ);
      // Fetch the updated FAQ data
      const response = await getFAQ();
      setFAQ(response.data.item);
      setIsAddFAQModalOpen(false);
      toast.success("FAQs Added Successfully!");
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleDeleteFAQ = (indexToDelete) => {
    const updatedFAQ = newFAQ.filter((item, index) => index !== indexToDelete);
    setNewFAQ(updatedFAQ);
  };
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <>
      <Head>
        <title>FAQ | Cura</title>
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
                {index > 0 && (
                  <Stack alignItems="center" justifyContent="center">
                    <IconButton
                      aria-label={`Delete Question ${index + 1}`}
                      color="error"
                      onClick={() => handleDeleteFAQ(index)}
                      size="small"
                    >
                      <TrashIcon width={30} />
                    </IconButton>
                  </Stack>
                )}
              </Stack>
            ))}
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
            <Button color="primary" fullWidth onClick={handleAddFAQ} variant="outlined">
              Add FAQ
            </Button>
            <Button
              color="primary"
              disabled={isLoading}
              fullWidth
              onClick={handleSaveFAQ}
              variant="contained"
            >
              {isLoading ? <Loader inline size="xs" /> : "Save"}
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default Page;
