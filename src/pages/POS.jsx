import { useEffect, useState } from "react";
import api from "../utils/api";
import { usePOSStore } from "../store/usePOSStore";
import classNames from "classnames";

export default function POS() {
    const {
        products,
        setProducts,
        cart,
        addToCart,
        removeFromCart,
        inc,
        dec,
        search,
        setSearch,
        clear
    } = usePOSStore();

    const [loading, setLoading] = useState(false);
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [invoice, setInvoice] = useState(null);
    const [confirmPay, setConfirmPay] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);

    // Toast & sound
    const [toast, setToast] = useState("");
    const successSound = new Audio("/sounds/success.mp3");

    // Categories
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState("All");

    // Add-to-cart popup
    const [modalProd, setModalProd] = useState(null);
    const [modalQty, setModalQty] = useState(1);
    const [modalVariantId, setModalVariantId] = useState(null);

    // Promo code system
    const [promoCode, setPromoCode] = useState("");
    const [promoResult, setPromoResult] = useState(null);
    const [promoError, setPromoError] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [search, activeCategory]);

    async function fetchCategories() {
        const { data } = await api.get("/categories");

        // Add ALL category
        const full = [{ name: "All" }, ...data];
        setCategories(full);

        if (!activeCategory) setActiveCategory("All");
    }

    async function fetchProducts() {
        setLoading(true);
        const { data } = await api.get("/products", { params: { q: search } });

        const filtered =
            activeCategory === "All"
                ? data
                : data.filter((p) => p.category === activeCategory);

        setProducts(filtered);
        setLoading(false);
    }

    function showToast(msg) {
        setToast(msg);
        setTimeout(() => setToast(""), 2000);
    }

    // When selecting any product → open modal
    function handleSelectProduct(p) {
        setModalProd(p);
        setModalQty(1);
        if (p.variants?.length > 0) {
            setModalVariantId(p.variants[0]._id);
        } else {
            setModalVariantId(null);
        }
    }

    // Remove promo when cart changes
    useEffect(() => {
        setPromoResult(null);
        setPromoCode("");
        setPromoError("");
    }, [cart]);

    async function applyPromo() {
        setPromoError("");
        setPromoResult(null);

        if (!promoCode.trim()) {
            setPromoError("Enter a promo code");
            return;
        }

        const payloadItems = cart.map((c) => ({
            code: c.code,
            name: c.name,
            qty: c.qty,
            price: c.price,
            variantId: c.variantId || null,
            variantName: c.variantName || null,
        }));

        try {
            const { data } = await api.post("/promos/apply", {
                code: promoCode.trim(),
                items: payloadItems,
            });

            if (!data.valid) {
                setPromoError(data.message || "Invalid code");
                return;
            }

            setPromoResult(data);
        } catch (e) {
            setPromoError("Could not apply code");
        }
    }

    // Totals
    const subTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const discount = promoResult?.discountAmount || 0;
    const grandTotal = Math.max(0, subTotal - discount);

    async function payFinal() {
        const payload = {
            items: cart.map((c) => ({
                code: c.code,
                name: c.name,
                qty: c.qty,
                price: c.price,
                variantId: c.variantId || null,
                variantName: c.variantName || null,
            })),
            paymentMode,
            invoicePrefix: "ANN",
            promoCode: promoResult?.code || promoCode.trim() || null,
        };

        const { data } = await api.post("/sales", payload);

        setInvoice(data);
        setShowReceipt(true);
        successSound.play();
        showToast("Order Successful");
        clear();
        setPromoCode("");
        setPromoResult(null);
    }

    return (
        <div className="p-4 grid grid-cols-12 gap-4">

            {/* TOAST */}
            {toast && (
                <div className="fixed top-4 right-4 bg-rose-600 text-white px-4 py-2 rounded shadow animate-fade z-[200]">
                    {toast}
                </div>
            )}

            {/* LEFT SIDEBAR — CATEGORIES */}
            <div className="col-span-2 border-r pr-2">
                <h2 className="font-semibold mb-3">Categories</h2>

                <div className="flex flex-col gap-2 max-h-[75vh] overflow-auto">
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            className={classNames(
                                "text-left px-3 py-2 rounded border",
                                activeCategory === cat.name
                                    ? "bg-rose-600 text-white"
                                    : "bg-white hover:bg-rose-50"
                            )}
                            onClick={() => {
                                setActiveCategory(cat.name);
                                setSearch("");
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* PRODUCT GRID */}
            <div className="col-span-5">
                <div className="flex mb-3">
                    <input
                        className="border p-2 flex-1"
                        placeholder="Search in this category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {products.map((p) => (
                            <button
                                key={p._id}
                                className="border rounded p-2 text-left hover:bg-rose-50"
                                onClick={() => handleSelectProduct(p)}
                            >
                                <div className="text-xs text-gray-500">[{p.code}]</div>
                                <div className="font-medium">{p.name}</div>

                                {p.variants?.length ? (
                                    <div className="text-xs text-gray-600 mt-1">
                                        {p.variants.map((v) => v.name).join(" / ")}
                                    </div>
                                ) : (
                                    <div className="text-sm">₹{p.price}</div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* CART */}
            <div className="col-span-5">
                <div className="border p-3 rounded bg-white">

                    <h2 className="font-semibold mb-2">Cart</h2>

                    <div className="space-y-2 max-h-[45vh] overflow-auto">
                        {cart.map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div>{item.name}</div>
                                    {item.variantName && (
                                        <div className="text-xs text-gray-500">
                                            ({item.variantName})
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button className="border px-2" onClick={() => dec(item.key)}>
                                        -
                                    </button>
                                    <span>{item.qty}</span>
                                    <button className="border px-2" onClick={() => inc(item.key)}>
                                        +
                                    </button>
                                </div>

                                <div className="w-20 text-right">
                                    ₹{(item.qty * item.price).toFixed(2)}
                                </div>

                                <button
                                    onClick={() => removeFromCart(item.key)}
                                    className="text-rose-600 ml-2"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {!cart.length && (
                            <div className="text-sm text-gray-500">No items...</div>
                        )}
                    </div>

                    {/* PROMO CODE */}
                    <div className="mt-3 space-y-2">
                        <div className="flex gap-2">
                            <input
                                className="border p-2 flex-1"
                                placeholder="Promo code"
                                value={promoCode}
                                onChange={(e) =>
                                    setPromoCode(e.target.value.toUpperCase())
                                }
                            />
                            <button
                                onClick={applyPromo}
                                className="bg-gray-800 text-white px-3 rounded"
                            >
                                Apply
                            </button>
                        </div>
                        {promoError && (
                            <div className="text-xs text-rose-600">{promoError}</div>
                        )}
                        {promoResult && (
                            <div className="text-xs text-green-700">
                                Applied <b>{promoResult.code}</b>
                                {promoResult.breakdown?.length ? (
                                    <ul className="list-disc ml-4">
                                        {promoResult.breakdown.map((b, idx) => (
                                            <li key={idx}>
                                                {b.label}
                                                {b.amount ? `: -₹${b.amount.toFixed(2)}` : ""}
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                                {promoResult.freeItems?.length ? (
                                    <div className="mt-1">
                                        Free:{" "}
                                        {promoResult.freeItems
                                            .map((f) => `${f.name} x${f.qty}`)
                                            .join(", ")}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* TOTALS */}
                    <div className="mt-3 border-t pt-3 space-y-1">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₹{subTotal.toFixed(2)}</span>
                        </div>

                        {discount > 0 && (
                            <div className="flex justify-between text-green-700">
                                <span>Promo Discount</span>
                                <span>-₹{discount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>₹{grandTotal.toFixed(2)}</span>
                        </div>

                        <div className="flex gap-2 mt-2">
                            <select
                                className="border p-2"
                                value={paymentMode}
                                onChange={(e) => setPaymentMode(e.target.value)}
                            >
                                <option>Cash</option>
                                <option>UPI</option>
                                <option>Card</option>
                            </select>

                            <button
                                disabled={!cart.length}
                                className="bg-rose-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                onClick={() => setConfirmPay(true)}
                            >
                                Pay
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONFIRM PAYMENT */}
            {confirmPay && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 w-72 rounded shadow space-y-3">
                        <h2 className="font-semibold text-lg">Confirm Payment?</h2>

                        <div className="flex justify-end gap-3">
                            <button
                                className="px-3 py-1 bg-gray-200"
                                onClick={() => setConfirmPay(false)}
                            >
                                No
                            </button>
                            <button
                                className="px-3 py-1 bg-rose-600 text-white"
                                onClick={() => {
                                    setConfirmPay(false);
                                    payFinal();
                                }}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD TO CART POPUP */}
            {modalProd && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-96 p-4 rounded shadow relative">

                        <button
                            className="absolute top-2 right-2 text-gray-500"
                            onClick={() => setModalProd(null)}
                        >
                            ✕
                        </button>

                        <h2 className="text-lg font-semibold mb-3">
                            {modalProd.name}
                        </h2>

                        {/* VARIANTS */}
                        {modalProd.variants?.length > 0 ? (
                            <div className="space-y-2 mb-4">
                                {modalProd.variants.map((v) => (
                                    <label
                                        key={v._id}
                                        className="border p-2 rounded flex justify-between cursor-pointer"
                                    >
                                        <span>
                                            <input
                                                type="radio"
                                                name="variant"
                                                checked={modalVariantId === v._id}
                                                onChange={() => setModalVariantId(v._id)}
                                            />
                                            <span className="ml-2">{v.name}</span>
                                        </span>
                                        <span>₹{v.price}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="mb-3 text-sm">
                                Price: <b>₹{modalProd.price}</b>
                            </div>
                        )}

                        {/* QTY */}
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                className="border px-3 py-1"
                                onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                            >
                                –
                            </button>
                            <span className="text-lg font-semibold">{modalQty}</span>
                            <button
                                className="border px-3 py-1"
                                onClick={() => setModalQty((q) => q + 1)}
                            >
                                +
                            </button>
                        </div>

                        {/* ADD TO CART */}
                        <button
                            className="w-full bg-rose-600 text-white py-2 rounded"
                            onClick={() => {
                                let price = modalProd.price;
                                let variantName = null;

                                if (modalProd.variants?.length > 0) {
                                    const v = modalProd.variants.find(
                                        (x) => x._id === modalVariantId
                                    );
                                    price = v.price;
                                    variantName = v.name;
                                }

                                addToCart({
                                    code: modalProd.code,
                                    name: modalProd.name,
                                    price,
                                    qty: modalQty,
                                    variantId: modalVariantId,
                                    variantName,
                                });

                                setModalProd(null);
                            }}
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            )}

            {/* RECEIPT MODAL */}
            {showReceipt && invoice && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white p-4 w-80 rounded shadow relative">

                        <button
                            className="absolute top-2 right-2"
                            onClick={() => setShowReceipt(false)}
                        >
                            ✕
                        </button>

                        <div id="receipt-area" className="text-sm p-2">

                            <div className="text-center font-bold">Annai Restaurant</div>
                            <div className="text-center text-xs">Invoice: {invoice.invoiceNo}</div>

                            <div className="text-xs mt-2">--------------------------------</div>

                            {/* ITEMS */}
                            {invoice.items.map((i, idx) => (
                                <div key={idx} className="flex justify-between text-xs">
                                    <span>
                                        {i.name}
                                        {i.variantName ? ` (${i.variantName})` : ""} x{i.qty}
                                        {i.price === 0 ? " (FREE)" : ""}
                                    </span>
                                    <span>₹{(i.qty * i.price).toFixed(2)}</span>
                                </div>
                            ))}

                            <div className="text-xs mt-2">--------------------------------</div>

                            {/* SUBTOTAL */}
                            <div className="flex justify-between text-xs">
                                <span>Subtotal</span>
                                <span>₹{invoice.subTotal.toFixed(2)}</span>
                            </div>

                            {/* PROMO CODE LINE */}
                            {invoice.promoCode && (
                                <div className="flex justify-between text-xs text-green-700">
                                    <span>Promo ({invoice.promoCode})</span>
                                    <span>-₹{invoice.discountTotal.toFixed(2)}</span>
                                </div>
                            )}

                            {/* OPTIONAL BREAKDOWN */}
                            {invoice.promoBreakdown?.length > 0 && (
                                <div className="text-green-700 text-[10px] mt-1 ml-1">
                                    {invoice.promoBreakdown.map((b, i) => (
                                        <div key={i}>• {b.label}{b.amount ? `: -₹${b.amount}` : ""}</div>
                                    ))}
                                </div>
                            )}

                            <div className="text-xs mt-2">--------------------------------</div>

                            {/* GRAND TOTAL */}
                            <div className="flex justify-between text-xs font-semibold">
                                <span>Total</span>
                                <span>₹{invoice.grandTotal.toFixed(2)}</span>
                            </div>

                            <div className="text-center text-xs mt-3">Thank you! Visit again</div>

                        </div>

                        <button
                            className="mt-3 w-full bg-rose-600 py-2 text-white rounded"
                            onClick={() => window.print()}
                        >
                            Print
                        </button>
                        <button
                            className="mt-2 w-full bg-gray-800 text-white py-2 rounded"
                            onClick={() => window.open(`/kot/${invoice.invoiceNo}`, "_blank")}
                        >
                            Print KOT
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}