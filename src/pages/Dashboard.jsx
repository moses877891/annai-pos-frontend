import { useEffect, useState } from "react";
import api from "../utils/api";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Dashboard() {
  const [daily, setDaily] = useState({ total: 0, bills: 0 });
  const [yesterday, setYesterday] = useState({ total: 0, bills: 0, date: "" });
  const [monthly, setMonthly] = useState({ total: 0, bills: 0 });
  const [top, setTop] = useState([]);
  const [cancelled, setCancelled] = useState([]);

  async function loadData() {
    const d = await api.get("/reports/daily");
    const y = await api.get("/reports/yesterday");
    const m = await api.get("/reports/monthly");
    const t = await api.get("/reports/top-items");
    const c = await api.get("/reports/cancelled");

    setDaily(d.data);
    setYesterday(y.data);
    setMonthly(m.data);
    setTop(t.data);
    setCancelled(c.data.list);
  }

  useEffect(() => {
    loadData();
  }, []);

  const chartData = {
    labels: top.map((t) => t.name),
    datasets: [
      {
        label: "Qty",
        data: top.map((t) => t.qty),
        backgroundColor: "#f43f5e"
      }
    ]
  };

  return (
    <div className="p-4 space-y-4">

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* TODAY */}
        <div className="bg-white p-4 rounded border shadow-sm">
          <div className="text-sm text-gray-500">Today's Sales</div>
          <div className="text-2xl font-semibold">₹{daily.total.toFixed(2)}</div>
          <div className="text-xs">Bills: {daily.bills}</div>
        </div>

        {/* YESTERDAY */}
        <div className="bg-white p-4 rounded border shadow-sm">
          <div className="text-sm text-gray-500">
            Yesterday ({yesterday.date})
          </div>
          <div className="text-2xl font-semibold">₹{yesterday.total.toFixed(2)}</div>
          <div className="text-xs">Bills: {yesterday.bills}</div>
        </div>

        {/* MONTHLY */}
        <div className="bg-white p-4 rounded border shadow-sm">
          <div className="text-sm text-gray-500">Monthly Sales</div>
          <div className="text-2xl font-semibold">₹{monthly.total.toFixed(2)}</div>
          <div className="text-xs">Bills: {monthly.bills}</div>
        </div>

      </div>

      {/* TOP ITEMS */}
      <div className="bg-white p-4 rounded border shadow-sm">
        <div className="font-semibold mb-2">Top Items (This Month)</div>
        {top.length ? <Bar data={chartData} /> : <div>No data</div>}
      </div>

      {/* Cancelled Orders
      
      <div className="bg-white p-4 rounded border shadow-sm">
        <div className="font-semibold mb-2">Cancelled Orders (Today)</div>

        {!cancelled.length ? (
          <div className="text-sm text-gray-500">No cancelled orders</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2 border-b">Invoice</th>
                  <th className="text-left p-2 border-b">Time</th>
                  <th className="text-left p-2 border-b">Payment Mode</th>
                  <th className="text-left p-2 border-b">Reason</th>
                  <th className="text-right p-2 border-b">Amount</th>
                </tr>
              </thead>

              <tbody>
                {cancelled.map((c) => (
                  <tr key={c.invoiceNo} className="hover:bg-rose-50">
                    <td className="p-2 border-b">{c.invoiceNo}</td>
                    <td className="p-2 border-b">
                      {new Date(c.datetime).toLocaleTimeString()}
                    </td>
                    <td className="p-2 border-b">{c.paymentMode}</td>
                    <td className="p-2 border-b">{c.cancelReason || "-"}</td>
                    <td className="p-2 border-b text-right">
                      ₹{c.grandTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div> 
        */}
    </div>
  );
}