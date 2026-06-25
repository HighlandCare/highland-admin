import { React, useState, useEffect } from "react";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Head from "next/head";

import { Box, Button, Container, Stack, Typography, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import Loader from "../components/Loader";
import { getPrivacy, addPrivacy } from "../Services/Auth.service";

// const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
const ReactQuill = typeof window === "object" ? require("react-quill") : () => false;
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";
import {
  formActionsSx,
  pageContainerSx,
  pageMainSx,
  pageTitleSx,
  richTextEditorSx,
  richTextFormSx,
} from "../utils/pageLayout";
const Page = () => {
  const [privacy, serPrivacy] = useState([]);
  const [newTitle, setNewTitle] = useState(privacy.title || "");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      setIsLoading(true);
      return router.push("auth/login");
    }
  }, []);

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        setIsLoading(true);
        const response = await getPrivacy();

        setNewTitle(response.data.title || "");
        serPrivacy(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };

    fetchPrivacy();
  }, []);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await addPrivacy("privacy", newTitle);
      const response = await getPrivacy();

      serPrivacy(response.data.title || "");
      toast.success("Privacy Updated Sucessfully!");
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };
  return (
    <>
      <Head>
        <title>Privacy | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Stack direction="row" justifyContent="space-between">
              <Stack spacing={1}>
                <Typography sx={pageTitleSx} variant="h4">
                  Privacy Policy
                </Typography>
              </Stack>
            </Stack>
            {isLoading ? (
              <Loader page />
            ) : (
              <Stack sx={richTextFormSx}>
                <Box sx={richTextEditorSx}>
                  <ReactQuill value={newTitle} onChange={(value) => setNewTitle(value)} />
                </Box>
                <Box sx={formActionsSx}>
                  <Button disabled={isLoading} variant="contained" onClick={handleSave}>
                    {isLoading ? <Loader inline size="xs" /> : "Save"}
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
