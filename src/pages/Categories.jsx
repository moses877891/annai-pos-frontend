import { useEffect, useState } from "react";
import api from "../utils/api";

export default function Categories() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [list, setList] = useState([]);
  const [toast, setToast] = useState("");

  async function load() {
    const { data } = await api.get("/categories");
    setList(data);
  }

  async function createCategory(e) {
    e.preventDefault();
    try {
      await api.post("/categories", { name, description });
      setToast("Category Created");
      setTimeout(() => setToast(""), 2000);

      setName("");
      setDescription("");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating category");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 bg-rose-600 text-white px-4 py-2 rounded shadow animate-fade">
          {toast}
        </div>
      )}

      <h1 className="text-lg font-semibold">Product Categories</h1>

      <form onSubmit={createCategory} className="bg-white border p-4 space-y-3 rounded">
        <input
          required
          className="border p-2 w-full"
          placeholder="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button className="bg-rose-600 text-white px-4 py-2 rounded">
          Create Category
        </button>
      </form>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Existing Categories</h2>

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left border-b">Name</th>
              <th className="p-2 text-left border-b">Description</th>
            </tr>
          </thead>

          <tbody>
            {list.map((cat) => (
              <tr key={cat._id} className="hover:bg-rose-50">
                <td className="p-2 border-b">{cat.name}</td>
                <td className="p-2 border-b">{cat.description}</td>
              </tr>
            ))}

            {!list.length && (
              <tr>
                <td className="p-2" colSpan="2">
                  No categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}