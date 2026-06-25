import { React, useState, useEffect, useRef } from "react";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Head from "next/head";
import { Box, Button, Container, Stack, Typography, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import Loader from "../components/Loader";
import { getTerms, addTerms } from "../Services/Auth.service";
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
  const [_document, set_document] = useState(null);

  const [terms, setTerms] = useState([]);
  const [newTitle, setNewTitle] = useState(terms.title || "");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const quillRef = useRef(null);

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      setIsLoading(true);
      return router.push("auth/login");
    }
  }, []);
  useEffect(() => {
    set_document(document);
  }, []);
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true);
        const response = await getTerms();
        console.log(response.data);

        setNewTitle(response.data.title || "");
        setTerms(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };

    fetchTerms();
  }, []);

  const customImageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];

      try {
        const data = await addTerms(newTitle, file);
        const imageURL = data.imageURL;
        const range = ReactQuill.Quill.getSelection();
        ReactQuill.Quill.insertEmbed(range.index, "image", imageURL);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    };
  };

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const toolbar = quill.getModule("toolbar");
      toolbar.addHandler("image", customImageHandler);
    }
  }, [quillRef]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await addTerms("terms", newTitle);
      const response = await getTerms();
      setTerms(response.data.title || "");
      toast.success("Terms Updated Sucessfully!");
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };
  var toolbarOptions = [
    ["bold", "italic", "underline", "strike"], // toggled buttons
    ["blockquote", "code-block"],

    [{ header: 1 }, { header: 2 }], // custom button values
    [{ list: "ordered" }, { list: "bullet" }],
    [{ script: "sub" }, { script: "super" }], // superscript/subscript
    [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
    [{ direction: "rtl" }], // text direction

    [{ size: ["small", false, "large", "huge"] }], // custom dropdown
    [{ header: [1, 2, 3, 4, 5, 6, false] }],

    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ font: [] }],
    [{ align: [] }],

    ["clean"], // remove formatting button
  ];
  return (
    <>
      <Head>
        <title>Terms | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Stack direction="row" justifyContent="space-between">
              <Stack spacing={1}>
                <Typography sx={pageTitleSx} variant="h4">
                  Terms & Condition
                </Typography>
              </Stack>
            </Stack>
            {isLoading ? (
              <Loader page />
            ) : (
              <Stack sx={richTextFormSx}>
                <Box sx={richTextEditorSx}>
                  <ReactQuill
                    ref={quillRef}
                    value={newTitle}
                    onChange={(value) => setNewTitle(value)}
                  />
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
