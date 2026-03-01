import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import { withPrintPageSize } from "../utils/printPageSize";

export default function ReceiptPrint() {
  const { invoiceNo } = useParams();
  const [sale, setSale] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/sales/${invoiceNo}`);
        setSale(data);
      } catch (e) {
        setError("Unable to load receipt");
      }
    })();
  }, [invoiceNo]);

  useEffect(() => {
    if (!sale) return;

    // 1) Enter "print-receipt" mode so only #receipt-print is visible
    document.body.classList.add("print-receipt");

    // 2) Let the DOM settle, inject @page { size: 80mm auto }, then print
    const t = setTimeout(() => {
      withPrintPageSize("80mm auto", () => window.print());
    }, 30);

    // 3) Close the tab after printing (and clean up body class)
    const done = () => {
      document.body.classList.remove("print-receipt");
      window.removeEventListener("afterprint", done);
      try { window.close(); } catch (_) {}
    };
    window.addEventListener("afterprint", done, { once: true });

    // 4) Fallback: if 'afterprint' doesn't fire (some Safari/Edge cases),
    //    close after ~2 seconds (adjust if needed).
    const fallback = setTimeout(done, 2000);

    return () => {
      clearTimeout(t);
      clearTimeout(fallback);
      document.body.classList.remove("print-receipt");
      window.removeEventListener("afterprint", done);
    };
  }, [sale]);

  if (error) return <div className="p-4">{error}</div>;
  if (!sale) return <div className="p-4">Loading receipt…</div>;

  const hasPromo = !!sale.promoCode && Number(sale.discountTotal) > 0;
  const hasTax = Number(sale.taxTotal) > 0;
  const theoretical = Number(sale.subTotal || 0) - Number(sale.discountTotal || 0) + Number(sale.taxTotal || 0);
  const roundOff = Math.round((Number(sale.grandTotal || 0) - theoretical) * 100) / 100;

  return (
    <div className="p-3">
      <div id="receipt-print" className="text-sm p-2">
        <div className="text-center font-bold">Annai Restaurant</div>
        <div className="text-center text-xs">Invoice: {sale.invoiceNo}</div>
        <div className="text-center text-xs">{new Date(sale.datetime).toLocaleString()}</div>

        <div className="text-xs mt-2">--------------------------------</div>

        {sale.items?.map((i, idx) => (
          <div key={idx} className="flex justify-between text-xs">
            <span>
              {i.name}{i.variantName ? ` (${i.variantName})` : ""} x{i.qty}
              {Number(i.price) === 0 ? " (FREE)" : ""}
            </span>
            <span>₹{(Number(i.qty) * Number(i.price)).toFixed(2)}</span>
          </div>
        ))}

        <div className="text-xs mt-2">--------------------------------</div>

        <div className="flex justify-between text-xs">
          <span>Subtotal</span>
          <span>₹{Number(sale.subTotal || 0).toFixed(2)}</span>
        </div>

        {hasPromo && (
          <>
            <div className="flex justify-between text-xs text-green-700">
              <span>Promo ({sale.promoCode})</span>
              <span>-₹{Number(sale.discountTotal).toFixed(2)}</span>
            </div>
            {Array.isArray(sale.promoBreakdown) && sale.promoBreakdown.length > 0 && (
              <div className="text-[10px] text-green-700 mt-1 ml-1">
                {sale.promoBreakdown.map((b, i) => (
                  <div key={i}>
                    • {b.label}{b.amount ? `: -₹${Number(b.amount).toFixed(2)}` : ""}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {hasTax && (
          <div className="flex justify-between text-xs">
            <span>Tax</span>
            <span>₹{Number(sale.taxTotal).toFixed(2)}</span>
          </div>
        )}

        {!!roundOff && Math.abs(roundOff) >= 0.01 && (
          <div className="flex justify-between text-xs">
            <span>Round-off</span>
            <span>{roundOff > 0 ? "₹" : "-₹"}{Math.abs(roundOff).toFixed(2)}</span>
          </div>
        )}

        <div className="text-xs mt-2">--------------------------------</div>

        <div className="flex justify-between text-xs font-semibold">
          <span>Total</span>
          <span>₹{Number(sale.grandTotal || 0).toFixed(2)}</span>
        </div>

        {/*
        {sale.paymentMode && (
          <div className="text-xs mt-1">Payment: {sale.paymentMode}</div>
        )}
        */}

        
        <div className="text-center text-xs mt-3">Thank you! Visit again</div>
      </div>
    </div>
  );
}
