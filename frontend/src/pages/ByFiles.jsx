import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import "./ByFiles.css";

const API_BASE_URL = "http://localhost:8000/api";

// ✅ List with IDs and readable names
const clothingTypes = [
  { id: 1, name: "T-shirt" },
  { id: 2, name: "Shirt" },
  { id: 3, name: "Blouse" },
  { id: 4, name: "Tank top" },
  { id: 5, name: "Sweater" },
  { id: 6, name: "Hoodie" },
  { id: 7, name: "Jacket" },
  { id: 8, name: "Coat" },
  { id: 9, name: "Vest" },
  { id: 10, name: "Jeans" },
  { id: 11, name: "Shorts" },
  { id: 12, name: "Skirt" },
  { id: 13, name: "Dress" },
  { id: 14, name: "Leggings" },
  { id: 15, name: "Socks" },
  { id: 16, name: "Hat" },
  { id: 17, name: "Scarf" },
  { id: 18, name: "Gloves" },
  { id: 19, name: "Belt" },
  { id: 20, name: "Shoes" },
  { id: 21, name: "Sneakers" },
  { id: 22, name: "Boots" },
  { id: 23, name: "Sandals" },
];

const formalityOptions = [
  { id: 1, name: "Casual" },
  { id: 2, name: "Formal" },
  { id: 3, name: "Business Casual" },
  { id: 4, name: "Sporty" },
  { id: 5, name: "Bohemian" },
  { id: 6, name: "Minimalist" },
  { id: 7, name: "Streetwear" },
  { id: 8, name: "Vintage" },
  { id: 9, name: "Romantic" },
  { id: 10, name: "Chic" },
  { id: 11, name: "Smart Casual" },
  { id: 12, name: "Beachwear" },
  { id: 13, name: "Evening Wear" },
  { id: 14, name: "Athletic" },
  { id: 15, name: "Workwear" },
  { id: 16, name: "Preppy" },
  { id: 17, name: "Gothic" },
  { id: 18, name: "Punk" },
  { id: 19, name: "Retro" },
  { id: 20, name: "Eco-Friendly" },
];

const mainColorOptions = [
  "White", "Off White", "Ivory", "Cream", "Beige", "Sand", "Taupe", "Gray", "Light Gray", "Charcoal", "Black",
  "Navy", "Midnight Blue", "Royal Blue", "Blue", "Sky Blue", "Light Blue", "Baby Blue", "Turquoise", "Teal", "Denim Blue", "Indigo",
  "Olive", "Army Green", "Khaki Green", "Sage", "Mint", "Emerald", "Forest Green", "Moss Green", "Dark Green",
  "Brown", "Light Brown", "Caramel", "Camel", "Tan", "Mocha", "Chocolate", "Coffee", "Rust", "Copper",
  "Purple", "Lavender", "Lilac", "Violet", "Mauve", "Orchid", "Plum", "Eggplant",
  "Red", "Crimson", "Burgundy", "Wine", "Maroon", "Rose", "Pink", "Light Pink", "Hot Pink", "Salmon", "Coral", "Peach",
  "Yellow", "Mustard", "Gold", "Amber", "Orange", "Burnt Orange", "Apricot",
  "Silver", "Bronze", "Copper", "Metallic Gray"
];

// ✅ Validation schema
const validationSchema = Yup.object().shape({
  type: Yup.number()
    .required("Type is required")
    .typeError("Type is required"),
  formality: Yup.number()
    .nullable()
    .typeError("Invalid formality"),
  main_color: Yup.string().nullable(),
  secondary_colors: Yup.array(),
  photo_file: Yup.mixed()
    .required("Image is required")
    .test("fileSize", "Image too large (max 15MB)", (value) => !value || value.size <= 15 * 1024 * 1024)
    .test("fileType", "Only .png, .jpg, .jpeg, .webp allowed", (value) =>
      !value || ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(value.type)
    ),
});

const ByFilesScreen = ({ itemId = null, token = null, onSuccess = null }) => {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const navigate = useNavigate();

  const getToken = () => token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const initialValues = {
    type: "",
    formality: "",
    main_color: "",
    secondary_colors: [],
    new_secondary_color: "",
    photo_file: null,
  };

  const submitForm = async (values, { setSubmitting, resetForm, setStatus }) => {
    setError(""); setLoading(true); setStatus(null);
    const access = getToken();

    if (!access) {
      setError("Please log in before uploading clothes.");
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("type", values.type);
      if (values.formality) fd.append("formality", values.formality);
      if (values.main_color) fd.append("main_color", values.main_color);
      if (values.secondary_colors.length)
        values.secondary_colors.forEach((c) => fd.append("secondary_colors", c));
      if (values.photo_file) fd.append("photo_file", values.photo_file);
      console.log(access)
      const url = itemId
        ? `${API_BASE_URL}/clothing-items/${itemId}/upload-photo/`
        : `${API_BASE_URL}/clothing-items/create/`;

      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}` },
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Request failed");
      }

      const data = await res.json();
      setPopupMessage("✅ Clothing item successfully created!");
      resetForm();
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
      if (onSuccess) onSuccess(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setError("");
    setLoading(false);
    navigate("/closet");
  };

  return (
    <Layout>
      <section className="byfiles-screen">
        <h2 className="byfiles-title">
          {itemId ? "Upload image / Update item" : "Add clothing item from file"}
        </h2>

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={submitForm}>
          {({ values, setFieldValue, isSubmitting, handleSubmit, setFieldTouched, status }) => (
            <Form className="byfiles-form" onSubmit={handleSubmit}>
              <div className="form-grid">

                {/* TYPE */}
                <label>
                  Type:
                  <Field as="select" name="type" className="dropdown">
                    <option value="">-- Select --</option>
                    {clothingTypes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Field>
                  <ErrorMessage name="type" component="div" className="error-message" />
                </label>

                {/* FORMALITY */}
                <label>
                  Formality:
                  <Field as="select" name="formality" className="dropdown">
                    <option value="">-- Select --</option>
                    {formalityOptions.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </Field>
                  <ErrorMessage name="formality" component="div" className="error-message" />
                </label>

                {/* MAIN COLOR */}
                <label>
                  Main color:
                  <Field as="select" name="main_color" className="dropdown">
                    <option value="">-- Select --</option>
                    {mainColorOptions.map((c, idx) => (
                      <option key={idx} value={c}>{c}</option>
                    ))}
                  </Field>
                  <ErrorMessage name="main_color" component="div" className="error-message" />
                </label>

                {/* SECONDARY COLORS */}
                <div className="secondary-colors">
                  <label>Secondary colors:</label>
                  <div className="add-color-row">
                    <Field
                      name="new_secondary_color"
                      placeholder="Add color"
                      value={values.new_secondary_color}
                      onChange={(e) => setFieldValue("new_secondary_color", e.target.value)}
                    />
                    <button
                      type="button"
                      className="add-btn"
                      onClick={() => {
                        const v = (values.new_secondary_color || "").trim();
                        if (!v) return;
                        setFieldValue("secondary_colors", [...values.secondary_colors, v]);
                        setFieldValue("new_secondary_color", "");
                        setFieldTouched("secondary_colors", true);
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="chips">
                    {values.secondary_colors.length ? (
                      values.secondary_colors.map((c, idx) => (
                        <span key={idx} className="chip">
                          {c}
                          <button
                            type="button"
                            onClick={() => {
                              const arr = [...values.secondary_colors];
                              arr.splice(idx, 1);
                              setFieldValue("secondary_colors", arr);
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <small>No secondary colors</small>
                    )}
                  </div>
                </div>

                {/* FILE UPLOAD */}
                <div className="file-section">
                  <label htmlFor="fileInput" className="choose-btn">📁 Choose Image</label>
                  <input
                    id="fileInput"
                    name="photo_file"
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const selected = e.currentTarget.files[0];
                      if (!selected) return;
                      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
                      if (!validTypes.includes(selected.type)) {
                        setError("Only .png, .jpg, .jpeg or .webp files allowed");
                        setFieldValue("photo_file", null);
                        return;
                      }
                      setError("");
                      setFieldValue("photo_file", selected);
                      const url = URL.createObjectURL(selected);
                      if (preview) URL.revokeObjectURL(preview);
                      setPreview(url);
                    }}
                  />
                  <ErrorMessage name="photo_file" component="div" className="error-message" />
                </div>

                {/* PREVIEW */}
                {preview && (
                  <div className="preview-section">
                    <img src={preview} alt="preview" className="preview-image" />
                    <div className="action-buttons">
                      <button
                        type="button"
                        onClick={() => {
                          setFieldValue("photo_file", null);
                          if (preview) { URL.revokeObjectURL(preview); setPreview(null); }
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ERRORS */}
              {error && <div className="error-message">{error}</div>}
              {status && status.type === "success" && <div className="success-message">{status.message}</div>}
              {status && status.type === "error" && <div className="error-message">{status.message}</div>}

              {/* BUTTONS */}
              <div className="form-actions">
                <button type="submit" disabled={isSubmitting || loading}>
                  {loading || isSubmitting ? "⏳ Uploading..." : "Create item"}
                </button>
                <button type="button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>

        {popupMessage && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h3>{popupMessage}</h3>
              <button className="popup-btn" onClick={() => setPopupMessage("")}>OK</button>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default ByFilesScreen;
