/* eslint-disable react/jsx-max-props-per-line */
import { React, useState, useEffect } from "react";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Head from "next/head";

import { Box, Button, Container, Stack, Typography, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import Loader from "../components/Loader";
import { getAbout, addAbout } from "../Services/Auth.service";
// import ReactQuill from "react-quill";
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
  //   const [page, setPage] = useState(1);
  const [about, setAbout] = useState([]);
  const [newTitle, setNewTitle] = useState(about.title || "");
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
    const fetchAbout = async () => {
      try {
        setIsLoading(true);
        const response = await getAbout();
        console.log(response.data);
        // Set newTitle here after getting the actual title from the API
        setNewTitle(response.data.title || "");
        setAbout(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };

    fetchAbout();
  }, []);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await addAbout("about", newTitle);
      const response = await getAbout();

      setAbout(response.data.title || "");
      toast.success("About Updated Sucessfully!");
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };
  return (
    <>
      <Head>
        <title>About | Cura</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Stack direction="row" justifyContent="space-between">
              <Stack spacing={1}>
                <Typography sx={pageTitleSx} variant="h4">
                  About
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
                  <Button variant="contained" onClick={handleSave}>
                    Save
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
