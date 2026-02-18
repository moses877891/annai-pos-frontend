import { useEffect, useState } from "react";
import api from "../utils/api";

export default function CreateProduct() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    code: "",
    name: "",
    category: "",
    price: ""
  });

  const [toast, setToast] = useState("");

  async function loadCategories() {
    const { data } = await api.get("/categories");
    setCategories(data);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function createProd(e) {
    e.preventDefault();
    try {
      await api.post("/products", form);
      setToast("Product Created");
      setTimeout(() => setToast(""), 2000);

      setForm({ code: "", name: "", category: "", price: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Error saving");
    }
  }

  return (
    <div className="p-4 space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 bg-rose-600 text-white px-4 py-2 rounded shadow animate-fade">
          {toast}
        </div>
      )}

      <h1 className="text-lg font-semibold">Create Product</h1>

      <form onSubmit={createProd} className="bg-white p-4 border rounded space-y-3">

        <input
          name="code"
          className="border p-2 w-full"
          placeholder="Product Code"
          value={form.code}
          onChange={handleChange}
        />

        <input
          name="name"
          className="border p-2 w-full"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
        />

        <select
          name="category"
          className="border p-2 w-full"
          value={form.category}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          name="price"
          type="number"
          className="border p-2 w-full"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
        />

        <button className="bg-rose-600 text-white px-4 py-2 rounded">
          Save Product
        </button>

      </form>
    </div>
  );
}