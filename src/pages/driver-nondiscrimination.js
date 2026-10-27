import { React, useState, useEffect } from "react";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Head from "next/head";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import Loader from "../components/Loader";
import {
  getDriverNondiscriminationPolicy,
  addDriverNondiscriminationPolicy,
} from "../Services/Auth.service";

const ReactQuill = typeof window === "object" ? require("react-quill") : () => false;
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";
import {
  formActionsSx,
  pageContainerSx,
  pageMainSx,
  pageTitleSx,
  richTextFormSx,
} from "../utils/pageLayout";
import { compactRichTextEditorSx, normalizeRichTextSpacing } from "../utils/richTextUtils";

const Page = () => {
  const [policy, setPolicy] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      setIsLoading(true);
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setIsLoading(true);
        const response = await getDriverNondiscriminationPolicy();
        const rawTitle = response.data?.title || response.title || "";
        setNewTitle(normalizeRichTextSpacing(rawTitle));
        setPolicy(response.data || response);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const content = normalizeRichTextSpacing(newTitle);
      await addDriverNondiscriminationPolicy("driver-nondiscrimination", content);
      const response = await getDriverNondiscriminationPolicy();
      const rawTitle = response.data?.title || response.title || "";
      setNewTitle(normalizeRichTextSpacing(rawTitle));
      setPolicy(response.data || response);
      toast.success("Driver Nondiscrimination Policy updated successfully!");
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      toast.error("Unable to update Driver Nondiscrimination Policy");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Driver Nondiscrimination Policy | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Stack direction="row" justifyContent="space-between">
              <Stack spacing={1}>
                <Typography sx={pageTitleSx} variant="h4">
                  Driver Nondiscrimination Policy
                </Typography>
              </Stack>
            </Stack>
            {isLoading ? (
              <Loader page />
            ) : (
              <Stack sx={richTextFormSx}>
                <Box sx={compactRichTextEditorSx}>
                  <ReactQuill value={newTitle} onChange={(value) => setNewTitle(value)} />
                </Box>
                <Box sx={formActionsSx}>
                  <Button
                    disabled={isLoading}
                    onClick={handleSave}
                    sx={{ color: "#fff", "&.Mui-disabled": { color: "rgba(255,255,255,0.7)" } }}
                    variant="contained"
                  >
                    {isLoading ? <Loader color="#fff" inline size="xs" /> : "Save"}
                  </Button>
                </Box>
              </Stack>
            )}
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default Page;
