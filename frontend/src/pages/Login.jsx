import React, { useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import "./Login.css";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const signupSuccessMessage = location.state?.signupSuccess;
  const signupEmail = location.state?.signupEmail;

  useEffect(() => {
    if (signupSuccessMessage || signupEmail) {
      navigate("/login", { replace: true, state: null });
    }
  }, [signupSuccessMessage, signupEmail, navigate]);

  const initialValues = {
    email: signupEmail || "",
    password: "",
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Enter a valid e-mail address")
      .required("E-mail is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const handleSubmit = async (values, { setSubmitting, setStatus, resetForm }) => {
  setStatus(null);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values), // { email, password }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data?.detail ||
        data?.message ||
        (typeof data === "object" ? Object.values(data)[0] : null) ||
        "Unable to sign in. Please verify your credentials.";
      throw new Error(message);
    }

    
    const { access, refresh, user } = data;

    
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("currentUser", JSON.stringify(user));
    }

    setStatus({
      type: "success",
      message: "Login successful!",
    });

    

   
    navigate("/home", { replace: true });
    resetForm();

  } catch (error) {
    setStatus({
      type: "error",
      message: error.message || "Unexpected error. Please try again.",
    });
  } finally {
    setSubmitting(false);
  }
};

  return (
    <Layout
      showTopBar={false}
      showNavbar={false}
      contentClassName="login-content"
    >
      <div className="login-page">
        <div className="login-card">
          <header className="login-header">
            <h1 className="login-title">
              <span className="login-brand-highlight">Outfit</span>
              Lab
            </h1>
            <p>Your closet, your style laboratory</p>
          </header>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            initialStatus={
              signupSuccessMessage
                ? {
                    type: "success",
                    message: signupSuccessMessage,
                  }
                : null
            }
          >
            {({ isSubmitting, status }) => (
              <Form className="login-form">
                <h2 className="login-subtitle">Welcome back</h2>

                {status && (
                  <div
                    className={`form-status ${
                      status.type === "error" ? "form-status-error" : "form-status-success"
                    }`}
                  >
                    {status.message}
                  </div>
                )}

                <label htmlFor="email">
                  E-mail
                  <Field
                    type="email"
                    id="email"
                    name="email"
                    placeholder="example@email.com"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="form-error"
                  />
                </label>

                <label htmlFor="password">
                  Password
                  <Field
                    type="password"
                    id="password"
                    name="password"
                    placeholder="********"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="form-error"
                  />
                </label>

                <button
                  type="submit"
                  className="login-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </button>
              </Form>
            )}
          </Formik>

          <footer className="login-footer">
            <p>
              First time here? <a href="/signup">Sign up</a>
            </p>
          </footer>
        </div>
      </div>
    </Layout>
  );
};

export default Login;