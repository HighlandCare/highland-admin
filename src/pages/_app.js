import Head from "next/head";
import { CacheProvider } from "@emotion/react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import AuthGuard from "../components/auth-guard";
import { useNProgress } from "../hooks/use-nprogress";
import { createTheme } from "../theme";

import { createEmotionCache } from "../utils/create-emotion-cache";
import "simplebar-react/dist/simplebar.min.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/google-places.css";
import "../styles/live-ops-map.css";
const clientSideEmotionCache = createEmotionCache();

const App = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  useNProgress();

  const getLayout = Component.getLayout ?? ((page) => page);

  const theme = createTheme();

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>Highland Care</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" type="image/png" href="/assets/logo.png" />
      </Head>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={true}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            theme="light"
          />
          <AuthGuard>{getLayout(<Component {...pageProps} />)}</AuthGuard>
        </ThemeProvider>
      </LocalizationProvider>
    </CacheProvider>
  );
};

export default App;
