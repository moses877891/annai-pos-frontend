import { useEffect, useState } from "react";
import api from "../utils/api";

export default function Products() {
  const [list, setList] = useState([]);
  const [editProd, setEditProd] = useState(null);
  
  const [varProd, setVarProd] = useState(null);
  const [varName, setVarName] = useState("");
  const [varPrice, setVarPrice] = useState("");

  const [toast, setToast] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  async function load() {
    const { data } = await api.get("/products");
    setList(data);
  }

  async function saveEdit(e) {
    e.preventDefault();
    await api.put(`/products/${editProd._id}`, editProd);
    showToast("Product Updated");
    setEditProd(null);
    load();
  }

  async function deleteProduct(id) {
    const yes = confirm("Delete this product?");
    if (!yes) return;

    await api.delete(`/products/${id}`);
    showToast("Product Deleted");
    load();
  }

  async function addVariant() {
    if (!varName || !varPrice) return;

    await api.post(`/products/${varProd._id}/variants`, {
      name: varName,
      price: Number(varPrice),
    });

    setVarName("");
    setVarPrice("");
    load();

    const refreshed = await api.get(`/products/${varProd._id}`);
    setVarProd(refreshed.data);

    showToast("Variant Added");
  }

  async function deleteVariant(variantId) {
    await api.delete(`/products/${varProd._id}/variants/${variantId}`);
    showToast("Variant Deleted");

    const refreshed = await api.get(`/products/${varProd._id}`);
    setVarProd(refreshed.data);
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

      <h1 className="text-lg font-semibold">Products</h1>

      <div className="bg-white border rounded p-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left border-b">Code</th>
              <th className="p-2 text-left border-b">Name</th>
              <th className="p-2 text-left border-b">Category</th>
              <th className="p-2 text-right border-b">Base Price</th>
              <th className="p-2 text-right border-b">Actions</th>
            </tr>
          </thead>

          <tbody>
            {list.map((p) => (
              <tr key={p._id} className="hover:bg-rose-50">
                <td className="p-2 border-b">{p.code}</td>
                <td className="p-2 border-b">{p.name}</td>
                <td className="p-2 border-b">{p.category}</td>
                <td className="p-2 border-b text-right">
                  {p.price ? `₹${p.price}` : "-"}
                </td>

                <td className="p-2 border-b text-right space-x-2">
                  <button
                    className="text-blue-600 underline"
                    onClick={() => setEditProd(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-purple-600 underline"
                    onClick={() => setVarProd(p)}
                  >
                    Variants
                  </button>
                  <button
                    className="text-rose-600 underline"
                    onClick={() => deleteProduct(p._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {!list.length && (
              <tr><td className="p-2" colSpan="5">No products</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT PRODUCT MODAL */}
      {editProd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-96 p-4 rounded relative">

            <button className="absolute right-2 top-2" onClick={() => setEditProd(null)}>✕</button>

            <h2 className="font-semibold text-lg mb-3">Edit Product</h2>

            <form onSubmit={saveEdit} className="space-y-3">
              <input
                className="border p-2 w-full"
                value={editProd.name}
                onChange={(e) => setEditProd({ ...editProd, name: e.target.value })}
              />

              <input
                className="border p-2 w-full"
                value={editProd.category}
                onChange={(e) => setEditProd({ ...editProd, category: e.target.value })}
              />

              <input
                className="border p-2 w-full"
                type="number"
                value={editProd.price}
                onChange={(e) => setEditProd({ ...editProd, price: e.target.value })}
                placeholder="Base Price (optional)"
              />

              <button className="w-full bg-rose-600 text-white py-2 rounded">
                Save
              </button>
            </form>

          </div>
        </div>
      )}

      {/* VARIANT MODAL */}
      {varProd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-96 p-4 rounded relative">

            <button className="absolute right-2 top-2" onClick={() => setVarProd(null)}>✕</button>

            <h2 className="font-semibold text-lg mb-3">{varProd.name} — Variants</h2>

            {/* Add Variant */}
            <div className="space-y-2 mb-4">
              <input
                className="border p-2 w-full"
                placeholder="Variant Name (Quarter / Half / Full)"
                value={varName}
                onChange={(e) => setVarName(e.target.value)}
              />
              <input
                className="border p-2 w-full"
                placeholder="Price"
                type="number"
                value={varPrice}
                onChange={(e) => setVarPrice(e.target.value)}
              />
              <button
                className="w-full bg-blue-600 text-white py-2 rounded"
                onClick={addVariant}
              >
                Add Variant
              </button>
            </div>

            {/* Existing Variants */}
            <div className="space-y-2">
              {varProd.variants?.map(v => (
                <div key={v._id} className="border p-2 rounded flex justify-between">
                  <div>
                    <div className="font-medium">{v.name}</div>
                    <div className="text-sm text-gray-600">₹{v.price}</div>
                  </div>

                  <button
                    className="text-rose-600 underline"
                    onClick={() => deleteVariant(v._id)}
                  >
                    Delete
                  </button>
                </div>
              ))}

              {!varProd.variants?.length && (
                <div className="text-sm text-gray-500">No variants added</div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}