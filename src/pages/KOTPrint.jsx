import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { withPrintPageSize } from '../utils/printPageSize';
import api from "../utils/api";

/**
 * KOTPrint
 * Route: /kot/:invoiceNo
 * - Prints a Kitchen Order Ticket on 80mm x 80mm paper
 * - No prices, grouped items, variant shown
 * - Shows INVOICE NO.
 * - Injects @page size for 80x80 dynamically; uses body.print-kot to scope print CSS
 * - Auto prints and then attempts to close the tab
 */
export default function KOTPrint() {
    const { invoiceNo } = useParams();
    const [sale, setSale] = useState(null);
    const [error, setError] = useState("");

    // Load the sale by invoice number
    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get(`/sales/${invoiceNo}`);
                setSale(data);
            } catch (e) {
                setError("Unable to load order");
            }
        })();
    }, [invoiceNo]);

    // Group items for kitchen (merge same code+variantId & sum qty)
    const groupedItems = useMemo(() => {
        if (!sale?.items) return [];
        const map = new Map();
        for (const it of sale.items) {
            // If you do NOT want freebies on KOT, skip price===0 lines:
            // if (it.price === 0) continue;

            const key = `${it.code}:${it.variantId || "base"}`;
            const prev = map.get(key);
            const qty = Number(it.qty || 1);
            if (prev) {
                prev.qty += qty;
            } else {
                map.set(key, {
                    code: it.code,
                    name: it.name,
                    variantName: it.variantName || null,
                    qty
                });
            }
        }
        return [...map.values()];
    }, [sale]);

    // Utility: inject a temporary @page { size: ... } just for this print

    // When sale is ready, set KOT print mode → print → cleanup
    useEffect(() => {
        if (!sale) return;
        document.body.classList.add('print-kot');

        const params = new URLSearchParams(window.location.search);
        const sizeParam = params.get('size'); // '80x80' | '80' | '58'
        let pageSize = '80mm 80mm'; // default

        if (sizeParam === '80') pageSize = '80mm auto';
        else if (sizeParam === '58') pageSize = '58mm auto';
        else if (sizeParam === '80x80') pageSize = '80mm 80mm';

        const t = setTimeout(() => {
            // 👇 Choose the size you want
            withPrintPageSize('80mm auto', () => window.print());
            // or: withPrintPageSize('80mm auto', () => window.print());
            // or: withPrintPageSize('58mm auto', () => window.print());
        }, 30);

        const done = () => {
            document.body.classList.remove('print-kot');
            window.removeEventListener('afterprint', done);
            try { window.close(); } catch (_) { }
        };
        window.addEventListener('afterprint', done, { once: true });

        return () => {
            clearTimeout(t);
            document.body.classList.remove('print-kot');
            window.removeEventListener('afterprint', done);
            document.querySelectorAll('style[data-print-pagesize]').forEach(s => s.remove());
        };
    }, [sale]);

    if (error) return <div className="p-4">{error}</div>;
    if (!sale) return <div className="p-4">Loading KOT...</div>;

    return (
        <div className="p-3">
            {/* KOT content — ONLY this should print */}
            <div id="kot-print-area">
                <div className="text-center font-extrabold text-base">Annai Fastfood</div>

                {/* ✅ Invoice Number included here */}
                <div className="text-center text-[11px] font-semibold">
                    Invoice: {sale.invoiceNo}
                </div>

                <div className="text-center text-[11px] mb-2">
                    {new Date(sale.datetime).toLocaleString()}
                </div>

                <div className="text-[10px]">--------------------------------</div>

                {groupedItems.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                        <span>{i.name}{i.variantName ? ` (${i.variantName})` : ""}</span>
                        <span>x{i.qty}</span>
                    </div>
                ))}

                <div className="text-[10px] mt-2">--------------------------------</div>

                {/* Optional: if you store KOT notes on Sale */}
                {sale.kotNote && (
                    <div className="text-sm mt-2 font-semibold">
                        Notes: {sale.kotNote}
                    </div>
                )}

                <div className="text-center text-xs mt-2">Thank you! Visit again</div>
            </div>
        </div>
    );
}