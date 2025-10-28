import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "./Signup.css";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const Signup = () => {
  const navigate = useNavigate();
  const initialValues = {
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  const validationSchema = Yup.object({
    fullName: Yup.string()
      .min(2, "Name must have at least 2 characters")
      .required("Name is required"),
    email: Yup.string()
      .email("Enter a valid e-mail address")
      .required("E-mail is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[A-Za-z]/, "Password must contain at least one letter")
      .matches(/\d/, "Password must contain at least one number")
      .matches(/^[A-Za-z0-9]+$/, "Password must be alphanumeric (letters and numbers only)")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Please confirm your password"),
  });

  const handleSubmit = async (values, { setSubmitting, setStatus, resetForm }) => {
    setStatus(null);

    const payload = {
      email: values.email,
      name: values.fullName,
      password: values.password,
      password_confirm: values.confirmPassword,
    };

    try {

      console.log("Payload to be sent:", payload); // Debug log

      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      console.log("Response data:", data); // Debug log

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.message ||
          (typeof data === "object" ? Object.values(data)[0] : null) ||
          "Unable to create an account. Please review the information provided.";
        throw new Error(message);
      }

      const successMessage =
        data?.message || "Account created successfully! You can now sign in.";
      const userEmail = values.email;
      resetForm();
      navigate("/login", {
        replace: true,
        state: { signupSuccess: successMessage, signupEmail: userEmail },
      });
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
      contentClassName="signup-content"
    >
      <div className="signup-page">
        <div className="signup-card">
          <header className="signup-header">
            <h1 className="signup-title">
              <span className="signup-brand-highlight">Outfit</span>
              Lab
            </h1>
            <p>Join the lab and craft your personal style</p>
          </header>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, status }) => (
              <Form className="signup-form">
                <h2 className="signup-subtitle">Create your account</h2>

                {status && (
                  <div
                    className={`form-status ${
                      status.type === "error" ? "form-status-error" : "form-status-success"
                    }`}
                  >
                    {status.message}
                  </div>
                )}

                <label htmlFor="fullName">
                  Full name
                  <Field
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="Jane Doe"
                  />
                  <ErrorMessage name="fullName" component="div" className="form-error" />
                </label>

                <label htmlFor="email">
                  E-mail
                  <Field
                    type="email"
                    id="email"
                    name="email"
                    placeholder="example@email.com"
                  />
                  <ErrorMessage name="email" component="div" className="form-error" />
                </label>

                <label htmlFor="password">
                  Password
                  <Field
                    type="password"
                    id="password"
                    name="password"
                    placeholder="********"
                  />
                  <ErrorMessage name="password" component="div" className="form-error" />
                </label>

                <label htmlFor="confirmPassword">
                  Confirm password
                  <Field
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="********"
                  />
                  <ErrorMessage name="confirmPassword" component="div" className="form-error" />
                </label>

                <button
                  type="submit"
                  className="signup-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating account..." : "Sign up"}
                </button>
              </Form>
            )}
          </Formik>

          <footer className="signup-footer">
            <p>
              Already have an account? <a href="/login">Sign in</a>
            </p>
          </footer>
        </div>
      </div>
    </Layout>
  );
};

export default Signup;
