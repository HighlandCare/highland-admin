import { useCallback, useState } from "react";
import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { adminLogin, formatApiErrorMessage } from "../../Services/Auth.service";
import Loader from "../../components/Loader";
import {
  Alert,
  Box,
  Button,
  FormHelperText,
  Link,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import { Layout as AuthLayout } from "../../layouts/auth/layout";

const Page = () => {
  const router = useRouter();
  // const auth = useAuth();
  const [method, setMethod] = useState("email");
  const [isLoading, setIsLoading] = useState(false);

  const getDeviceToken = () => {
    const storageKey = "deviceToken";
    let deviceToken = localStorage.getItem(storageKey);

    if (!deviceToken) {
      deviceToken =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(storageKey, deviceToken);
    }

    return deviceToken;
  };

  const handleLogin = async (email, password, setSubmitError) => {
    try {
      setIsLoading(true);
      setSubmitError?.(undefined);

      const data = {
        email,
        password,
        userType: "admin",
        deviceType: "web",
        deviceToken: getDeviceToken(),
      };
      const response = await adminLogin(data);

      if (response.status && response.data) {
        const { password: _, token, ...user } = response.data;

        localStorage.setItem("isLogin", JSON.stringify(true));
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", JSON.stringify(token));
        toast.success(response.message || "Logged in successfully");
        return router.push("/");
      }

      const errorMessage = formatApiErrorMessage(response.message) || "Invalid email or password.";
      setSubmitError?.(errorMessage);
      toast.error(errorMessage);
    } catch (err) {
      const errorMessage = err.message || "Unable to sign in. Please try again.";
      setSubmitError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      email: "admin@admin.com",
      password: "123456",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Must be a valid email").max(255).required("Email is required"),
      password: Yup.string().max(255).required("Password is required"),
    }),
    onSubmit: async (values, helpers) => {
      await handleLogin(values.email, values.password, (message) => {
        helpers.setStatus({ success: false });
        helpers.setErrors({ submit: message });
        helpers.setSubmitting(false);
      });
    },
  });

  const handleMethodChange = useCallback((event, value) => {
    setMethod(value);
  }, []);

  return (
    <>
      <Head>
        <title>Login | Cura</title>
      </Head>
      <Box
        sx={{
          backgroundColor: "background.paper",
          flex: "1 1 auto",
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            maxWidth: 550,
            px: { xs: 2, sm: 3 },
            py: { xs: 4, sm: 8, md: 12 },
            width: "100%",
          }}
        >
          <div>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }} variant="h4">
                Login
              </Typography>
            </Stack>
            <Tabs onChange={handleMethodChange} sx={{ mb: 3 }} value={method}>
              <Tab label="Email" value="email" />
              {/* <Tab label="Phone Number" value="phoneNumber" /> */}
            </Tabs>
            {method === "email" && (
              <form noValidate onSubmit={formik.handleSubmit}>
                <Stack spacing={3}>
                  <TextField
                    error={!!(formik.touched.email && formik.errors.email)}
                    fullWidth
                    helperText={formik.touched.email && formik.errors.email}
                    label="Email Address"
                    name="email"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    type="email"
                    value={formik.values.email}
                  />
                  <TextField
                    error={!!(formik.touched.password && formik.errors.password)}
                    fullWidth
                    helperText={formik.touched.password && formik.errors.password}
                    label="Password"
                    name="password"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    type="password"
                    value={formik.values.password}
                  />
                </Stack>

                {formik.errors.submit && (
                  <Typography color="error" sx={{ mt: 3 }} variant="body2">
                    {formik.errors.submit}
                  </Typography>
                )}
                <Button
                  fullWidth
                  color="primary"
                  size="large"
                  sx={{ mt: 3 }}
                  type="submit"
                  variant="contained"
                  onClick={formik.handleSubmit}
                >
                  {isLoading ? <Loader inline size="xs" /> : "Login"}
                </Button>
              </form>
            )}
          </div>
        </Box>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default Page;
