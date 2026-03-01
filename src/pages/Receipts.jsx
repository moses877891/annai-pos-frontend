import { useEffect, useState } from 'react';
import api from '../utils/api';
import dayjs from 'dayjs';
import Toast from '../components/toast';

export default function Receipts() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null); // selected sale
    const [toast, setToast] = useState("");
    const [cancelreceipt, setCancelReceipt] = useState(false);
    const [reason, setReason] = useState("");

    async function fetchReceipts() {
        setLoading(true);
        try {
            const { data } = await api.get('/sales', { params: { status: 'Created', limit: 200 } });
            setRows(data);
        } finally {
            setLoading(false);
        }
    }

    async function openReceipt(invoiceNo) {
        const { data } = await api.get(`/sales/${invoiceNo}`);
        setSelected(data);
    }

    async function cancelOrder() {
        if (!selected) return;
        await api.patch(`/sales/${selected.invoiceNo}/cancel`, { reason });
        setToast(`Order ${selected.invoiceNo} cancelled`);
        setTimeout(() => setToast(""), 2000);
        setSelected(null);
        setReason("");
        fetchReceipts(); // refresh to remove it from list
    }

    useEffect(() => { fetchReceipts(); }, []);

    return (
        <div className="p-4">
            <h1 className="text-lg font-semibold mb-3">Receipts (Created)</h1>

            {toast && (
                <div className="fixed top-4 right-4 bg-rose-600 text-white px-4 py-2 rounded shadow z-[200] animate-fade">
                    {toast}
                </div>
            )}

            <div className="bg-white border rounded">
                <div className="p-3 text-sm text-gray-600 border-b">
                    Showing receipts with status <b>Created</b>
                </div>

                <div className="overflow-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left p-2 border-b">Invoice No.</th>
                                <th className="text-left p-2 border-b">Created At</th>
                                <th className="text-left p-2 border-b">Payment Mode</th>
                                <th className="text-left p-2 border-b">Promo</th>
                                <th className="text-right p-2 border-b">Discount (₹)</th>
                                <th className="text-right p-2 border-b">Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td className="p-3" colSpan={4}>Loading...</td></tr>
                            )}
                            {!loading && rows.length === 0 && (
                                <tr><td className="p-3" colSpan={4}>No receipts</td></tr>
                            )}
                            {rows.map(r => (
                                <tr key={r.invoiceNo} className="hover:bg-rose-50">
                                    <td className="p-2 border-b">
                                        <button
                                            className="text-rose-700 underline"
                                            onClick={() => openReceipt(r.invoiceNo)}
                                        >
                                            {r.invoiceNo}
                                        </button>
                                    </td>
                                    <td className="p-2 border-b">
                                        {dayjs(r.datetime || r.createdAt).format('DD-MMM-YYYY HH:mm')}
                                    </td>
                                    <td className="p-2 border-b">{r.paymentMode}</td>
                                    <td className="p-2 border-b">{r.promoCode || '-'}</td>
                                    <td className="p-2 border-b text-right">{(Number(r.discountTotal) || 0).toFixed(2)}</td>
                                    <td className="p-2 border-b text-right">{Number(r.grandTotal).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Receipt preview modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white w-96 p-4 rounded shadow relative">
                        <button
                            className="absolute top-2 right-2 text-gray-500"
                            onClick={() => setSelected(null)}
                        >✕</button>

                        <div id="receipt-print" className="p-2 text-sm">
                            <div className="text-center font-bold">Annai Restaurant</div>
                            <div className="text-center text-xs">Invoice: {selected.invoiceNo}</div>
                            <div className="text-xs text-center">
                                {dayjs(selected.datetime).format('DD-MMM-YYYY HH:mm')}
                            </div>

                            <div className="text-xs mt-2">--------------------------------</div>

                            {/* Items */}
                            {selected.items?.map((i, idx) => (
                                <div key={idx} className="text-xs flex justify-between">
                                    <span>
                                        {i.name}{i.variantName ? ` (${i.variantName})` : ''} x{i.qty}
                                        {i.price === 0 ? ' (FREE)' : ''}
                                    </span>
                                    <span>₹{(i.qty * i.price).toFixed(2)}</span>
                                </div>
                            ))}

                            <div className="text-xs mt-2">--------------------------------</div>

                            {/* Subtotal */}
                            <div className="text-xs flex justify-between">
                                <span>Subtotal</span>
                                <span>₹{Number(selected.subTotal || 0).toFixed(2)}</span>
                            </div>

                            {/* Promo & Discount */}
                            {!!selected.promoCode && Number(selected.discountTotal) > 0 && (
                                <>
                                    <div className="text-xs flex justify-between text-green-700">
                                        <span>Promo ({selected.promoCode})</span>
                                        <span>-₹{Number(selected.discountTotal).toFixed(2)}</span>
                                    </div>
                                    {/* Optional detailed breakdown */}
                                    {Array.isArray(selected.promoBreakdown) && selected.promoBreakdown.length > 0 && (
                                        <div className="text-green-700 text-[10px] mt-1 ml-1">
                                            {selected.promoBreakdown.map((b, i) => (
                                                <div key={i}>• {b.label}{b.amount ? `: -₹${Number(b.amount).toFixed(2)}` : ''}</div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="text-xs mt-2">--------------------------------</div>

                            {/* Total */}
                            <div className="text-xs flex justify-between font-semibold">
                                <span>Total</span>
                                <span>₹{Number(selected.grandTotal || 0).toFixed(2)}</span>
                            </div>

                            <div className="text-center text-xs mt-2">Thank you! Visit again</div>
                        </div>

                        <div className="mt-3 space-y-2">
                            <button
                                className="w-full bg-rose-600 text-white py-2 rounded"
                                onClick={() => window.print()}
                            >
                                Print
                            </button>
                            <button
                                className="w-full bg-gray-700 text-white py-2 rounded"
                                onClick={() => window.open(`/kot/${selected.invoiceNo}`, "_blank")}
                            >
                                Print KOT
                            </button>

                            <div className="space-y-1">
                                <input
                                    className="border p-2 w-full"
                                    placeholder="Cancellation reason (optional)"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                />
                                <button
                                    className="w-full bg-gray-800 text-white py-2 rounded"
                                    onClick={() => setCancelReceipt(true)}
                                >
                                    Cancel Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Cancel receipt confirmation modal */}
            {cancelreceipt && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow space-y-4 w-72">
                        <h2 className="text-lg font-semibold">Cancel Receipt</h2>
                        <p>Are you sure you want to cancel this receipt?</p>

                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded"
                                onClick={() => setCancelReceipt(false)}
                            >
                                No
                            </button>

                            <button
                                className="px-4 py-2 bg-red-600 text-white rounded"
                                onClick={() => {
                                    cancelOrder(selected.invoiceNo, reason);
                                    setCancelReceipt(false);
                                    setSelected(null);
                                }}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {toast && <Toast message={toast} />}
        </div>
    );
}