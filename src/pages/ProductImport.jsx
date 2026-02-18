import { useState } from "react";
import api from "../utils/api";

export default function ProductImport() {
  const [file, setFile] = useState(null);
  const [toast, setToast] = useState("");
  const [result, setResult] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  async function uploadCSV(e) {
    e.preventDefault();
    if (!file) {
      showToast("Please choose a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/import/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(data);
      showToast("Import Successful");
    } catch (err) {
      showToast("Error importing file");
    }
  }

  return (
    <div className="p-4 space-y-4">

      {toast && (
        <div className="fixed top-4 right-4 bg-rose-600 text-white px-4 py-2 rounded animate-fade">
          {toast}
        </div>
      )}

      <h1 className="text-lg font-semibold">Bulk Import Products + Variants</h1>

      <form
        onSubmit={uploadCSV}
        className="bg-white p-4 border rounded space-y-3"
      >
        <input
          type="file"
          accept=".csv"
          className="border p-2 w-full"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button className="bg-rose-600 text-white px-4 py-2 rounded w-full">
          Upload CSV
        </button>
      </form>

      {result && (
        <div className="bg-white p-4 border rounded">
          <h2 className="font-semibold mb-1">Import Result</h2>
          <p>Total imported: {result.totalImported}</p>
        </div>
      )}

      {/* Example CSV Format */}
      <div className="bg-white p-4 border rounded text-sm">
        <h2 className="font-semibold mb-2">CSV Format Example</h2>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
code,name,category,basePrice,variantName,variantPrice
401,Chicken Tandoori,Tandoori,0,Quarter,120
401,Chicken Tandoori,Tandoori,0,Half,220
401,Chicken Tandoori,Tandoori,0,Full,420
402,Chicken Kebab,Tandoori,150,,
        </pre>
      </div>
    </div>
  );
}