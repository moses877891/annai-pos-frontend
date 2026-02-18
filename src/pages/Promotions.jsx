import { useEffect, useState } from "react";
import api from "../utils/api";

export default function Promotions() {
    const [list, setList] = useState([]);

    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(null);

    const [form, setForm] = useState({
        code: "",
        type: "PERCENT",
        note: "",
        active: true,
        startAt: "",
        endAt: "",

        trigger: {
            kind: "ANY",
            productCode: "",
            categoryName: "",
            minQty: 1,
            minPurchase: 0,
        },

        reward: {
            type: "DISCOUNT",
            percent: "",
            amount: "",
            maxDiscount: "",
            buyQty: "",
            getQty: "",
            rewardProductCode: "",
            rewardQty: "",
        },
    });

    const [toast, setToast] = useState("");
    function notify(msg) {
        setToast(msg);
        setTimeout(() => setToast(""), 2000);
    }

    async function load() {
        const { data } = await api.get("/promos/manage");
        setList(data);
    }

    useEffect(() => {
        load();
    }, []);

    function resetForm() {
        setForm({
            code: "",
            type: "PERCENT",
            note: "",
            active: true,
            startAt: "",
            endAt: "",
            trigger: {
                kind: "ANY",
                productCode: "",
                categoryName: "",
                minQty: 1,
                minPurchase: 0,
            },
            reward: {
                type: "DISCOUNT",
                percent: "",
                amount: "",
                maxDiscount: "",
                buyQty: "",
                getQty: "",
                rewardProductCode: "",
                rewardQty: "",
            },
        });
    }

    function updateField(path, value) {
        const parts = path.split(".");
        const updated = { ...form };
        let pointer = updated;

        for (let i = 0; i < parts.length - 1; i++) {
            pointer[parts[i]] = { ...pointer[parts[i]] };
            pointer = pointer[parts[i]];
        }
        pointer[parts[parts.length - 1]] = value;
        setForm(updated);
    }


    async function createPromo(e) {
        e.preventDefault();
        try {
            const payload = toPayload(form);
            await api.post("/promos/manage", payload);
            notify("Promo Created");
            setShowCreate(false);
            resetForm();
            load();
        } catch (e) {
            alert(e.response?.data?.message || "Error creating promo");
        }
    }



    async function updatePromo(e) {
        e.preventDefault();
        try {
            const payload = toPayload(form);
            await api.put(`/promos/manage/${showEdit._id}`, payload);
            notify("Promo Updated");
            setShowEdit(null);
            resetForm();
            load();
        } catch (e) {
            alert("Error updating promo");
        }
    }


    async function deletePromo(id) {
        const yes = confirm("Delete this promotion?");
        if (!yes) return;
        await api.delete(`/promos/manage/${id}`);
        notify("Promo Deleted");
        load();
    }

    // When opening edit modal → load values
    function openEdit(promo) {
        setShowEdit(promo);
        setForm({
            code: promo.code,
            type: promo.type,
            note: promo.note || "",
            active: promo.active,
            startAt: promo.startAt ? promo.startAt.substring(0, 16) : "",
            endAt: promo.endAt ? promo.endAt.substring(0, 16) : "",
            trigger: {
                kind: promo.trigger?.kind || "ANY",
                productCode: promo.trigger?.productCode || "",
                categoryName: promo.trigger?.categoryName || "",
                minQty: promo.trigger?.minQty || 1,
                minPurchase: promo.trigger?.minPurchase || 0,
            },
            reward: {
                type: promo.reward?.type || "DISCOUNT",
                percent: promo.reward?.percent || "",
                amount: promo.reward?.amount || "",
                maxDiscount: promo.reward?.maxDiscount || "",
                buyQty: promo.reward?.buyQty || "",
                getQty: promo.reward?.getQty || "",
                rewardProductCode: promo.reward?.rewardProductCode || "",
                rewardQty: promo.reward?.rewardQty || "",
            },
        });
    }

    function toPayload(form) {
        const toISOorNull = (v) => v ? new Date(v).toISOString() : null;
        const num = (v) => (v === "" || v === null || v === undefined ? undefined : Number(v));

        return {
            code: (form.code || "").toUpperCase().trim(),
            type: form.type,
            note: form.note || "",
            active: !!form.active,
            startAt: toISOorNull(form.startAt),
            endAt: toISOorNull(form.endAt),
            trigger: {
                kind: form.trigger.kind,
                productCode: form.trigger.kind === "PRODUCT" ? num(form.trigger.productCode) : undefined,
                categoryName: form.trigger.kind === "CATEGORY" ? (form.trigger.categoryName || "") : undefined,
                minQty: (form.type === "PERCENT" || form.type === "AMOUNT") ? undefined : num(form.trigger.minQty ?? 1),
                minPurchase: (form.type === "PERCENT" || form.type === "AMOUNT") ? num(form.trigger.minPurchase ?? 0) : undefined,
            },
            reward: {
                type: form.type === "PERCENT" || form.type === "AMOUNT" ? "DISCOUNT" : form.reward.type || "DISCOUNT",
                percent: form.type === "PERCENT" ? num(form.reward.percent) : undefined,
                amount: form.type === "AMOUNT" ? num(form.reward.amount) : undefined,
                maxDiscount: form.type === "PERCENT" ? num(form.reward.maxDiscount) : undefined,
                buyQty: form.type === "BOGO" ? num(form.reward.buyQty) : undefined,
                getQty: form.type === "BOGO" ? num(form.reward.getQty) : undefined,
                rewardProductCode: form.type === "ITEM_FREE" ? num(form.reward.rewardProductCode) : undefined,
                rewardQty: form.type === "ITEM_FREE" ? num(form.reward.rewardQty) : undefined,
            }
        };
    }

    return (
        <div className="p-4 space-y-4">

            {toast && (
                <div className="fixed top-4 right-4 bg-rose-600 text-white px-4 py-2 rounded shadow animate-fade">
                    {toast}
                </div>
            )}

            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">Promotions</h1>

                <button
                    className="bg-rose-600 text-white px-4 py-2 rounded"
                    onClick={() => {
                        resetForm();
                        setShowCreate(true);
                    }}
                >
                    + Create Promotion
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white p-4 border rounded">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left border-b">Code</th>
                            <th className="p-2 text-left border-b">Type</th>
                            <th className="p-2 text-left border-b">Active</th>
                            <th className="p-2 text-left border-b">Start</th>
                            <th className="p-2 text-left border-b">End</th>
                            <th className="p-2 text-right border-b">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {list.map((p) => (
                            <tr key={p._id} className="hover:bg-rose-50">
                                <td className="p-2 border-b">{p.code}</td>
                                <td className="p-2 border-b">{p.type}</td>
                                <td className="p-2 border-b">{p.active ? "Yes" : "No"}</td>
                                <td className="p-2 border-b">
                                    {p.startAt ? new Date(p.startAt).toLocaleString() : "-"}
                                </td>
                                <td className="p-2 border-b">
                                    {p.endAt ? new Date(p.endAt).toLocaleString() : "-"}
                                </td>
                                <td className="p-2 border-b text-right space-x-3">
                                    <button
                                        className="text-blue-600 underline"
                                        onClick={() => openEdit(p)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="text-rose-600 underline"
                                        onClick={() => deletePromo(p._id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {!list.length && (
                            <tr>
                                <td className="p-3" colSpan="6">
                                    No promotions created.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* CREATE MODAL */}
            {showCreate && (
                <PromotionModal
                    title="Create Promotion"
                    form={form}
                    setForm={setForm}
                    updateField={updateField}
                    onClose={() => setShowCreate(false)}
                    onSubmit={createPromo}
                />
            )}

            {/* EDIT MODAL */}
            {showEdit && (
                <PromotionModal
                    title="Edit Promotion"
                    form={form}
                    setForm={setForm}
                    updateField={updateField}
                    onClose={() => setShowEdit(null)}
                    onSubmit={updatePromo}
                />
            )}

        </div>
    );
}

/* -------------------- PROMOTION MODAL COMPONENT -------------------- */

function PromotionModal({ title, form, updateField, onClose, onSubmit }) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[450px] max-h-[85vh] overflow-auto p-4 rounded shadow relative">

                <button className="absolute right-3 top-2" onClick={onClose}>
                    ✕
                </button>

                <h2 className="text-lg font-semibold mb-4">{title}</h2>

                <form onSubmit={onSubmit} className="space-y-4">

                    {/* CODE */}
                    <div>
                        <label className="text-sm">Promo Code</label>
                        <input
                            required
                            className="border p-2 w-full"
                            value={form.code}
                            onChange={(e) => updateField("code", e.target.value.toUpperCase())}
                        />
                    </div>

                    {/* TYPE */}
                    <div>
                        <label className="text-sm">Type</label>
                        <select
                            className="border p-2 w-full"
                            value={form.type}
                            onChange={(e) => updateField("type", e.target.value)}
                        >
                            <option value="PERCENT">Percent Discount</option>
                            <option value="AMOUNT">Flat Amount Discount</option>
                            <option value="BOGO">Buy X Get Y Free</option>
                            <option value="ITEM_FREE">Buy X → Get Item Free</option>
                        </select>
                    </div>

                    {/* ACTIVE */}
                    <div>
                        <label className="text-sm">Active</label>
                        <select
                            className="border p-2 w-full"
                            value={form.active}
                            onChange={(e) => updateField("active", e.target.value === "true")}
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>

                    {/* DATE RANGE */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-sm">Start At</label>
                            <input
                                type="datetime-local"
                                className="border p-2 w-full"
                                value={form.startAt}
                                onChange={(e) => updateField("startAt", e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-sm">End At</label>
                            <input
                                type="datetime-local"
                                className="border p-2 w-full"
                                value={form.endAt}
                                onChange={(e) => updateField("endAt", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* TRIGGER CONFIG */}
                    <div className="border p-3 rounded">
                        <div className="font-semibold mb-2">Trigger Conditions</div>

                        <label className="text-sm">Trigger Type</label>
                        <select
                            className="border p-2 w-full mb-2"
                            value={form.trigger.kind}
                            onChange={(e) => updateField("trigger.kind", e.target.value)}
                        >
                            <option value="ANY">ANY</option>
                            <option value="PRODUCT">Specific Product</option>
                            <option value="CATEGORY">Specific Category</option>
                        </select>

                        {form.trigger.kind === "PRODUCT" && (
                            <input
                                className="border p-2 w-full mb-2"
                                placeholder="Product Code"
                                value={form.trigger.productCode}
                                onChange={(e) =>
                                    updateField("trigger.productCode", e.target.value)
                                }
                            />
                        )}

                        {form.trigger.kind === "CATEGORY" && (
                            <input
                                className="border p-2 w-full mb-2"
                                placeholder="Category Name"
                                value={form.trigger.categoryName}
                                onChange={(e) =>
                                    updateField("trigger.categoryName", e.target.value)
                                }
                            />
                        )}

                        <div>
                            <label className="text-sm">Minimum Quantity / Purchase</label>
                            <input
                                className="border p-2 w-full"
                                value={
                                    form.type === "PERCENT" || form.type === "AMOUNT"
                                        ? form.trigger.minPurchase
                                        : form.trigger.minQty
                                }
                                type="number"
                                onChange={(e) => {
                                    if (form.type === "PERCENT" || form.type === "AMOUNT")
                                        updateField("trigger.minPurchase", Number(e.target.value));
                                    else
                                        updateField("trigger.minQty", Number(e.target.value));
                                }}
                            />
                        </div>
                    </div>

                    {/* REWARD CONFIG */}
                    <div className="border p-3 rounded">
                        <div className="font-semibold mb-2">Reward</div>

                        {form.type === "PERCENT" && (
                            <>
                                <input
                                    className="border p-2 w-full mb-2"
                                    placeholder="Percent"
                                    value={form.reward.percent}
                                    onChange={(e) =>
                                        updateField("reward.percent", e.target.value)
                                    }
                                />

                                <input
                                    className="border p-2 w-full"
                                    placeholder="Max Discount (optional)"
                                    value={form.reward.maxDiscount}
                                    onChange={(e) =>
                                        updateField("reward.maxDiscount", e.target.value)
                                    }
                                />
                            </>
                        )}

                        {form.type === "AMOUNT" && (
                            <input
                                className="border p-2 w-full"
                                placeholder="Flat Amount"
                                value={form.reward.amount}
                                onChange={(e) => updateField("reward.amount", e.target.value)}
                            />
                        )}

                        {form.type === "BOGO" && (
                            <>
                                <input
                                    className="border p-2 w-full mb-2"
                                    placeholder="Buy Qty"
                                    value={form.reward.buyQty}
                                    onChange={(e) =>
                                        updateField("reward.buyQty", e.target.value)
                                    }
                                />

                                <input
                                    className="border p-2 w-full"
                                    placeholder="Get Qty"
                                    value={form.reward.getQty}
                                    onChange={(e) =>
                                        updateField("reward.getQty", e.target.value)
                                    }
                                />
                            </>
                        )}

                        {form.type === "ITEM_FREE" && (
                            <>
                                <input
                                    className="border p-2 w-full mb-2"
                                    placeholder="Reward Product Code"
                                    value={form.reward.rewardProductCode}
                                    onChange={(e) =>
                                        updateField("reward.rewardProductCode", e.target.value)
                                    }
                                />

                                <input
                                    className="border p-2 w-full"
                                    placeholder="Reward Qty"
                                    value={form.reward.rewardQty}
                                    onChange={(e) =>
                                        updateField("reward.rewardQty", e.target.value)
                                    }
                                />
                            </>
                        )}
                    </div>

                    {/* NOTE */}
                    <div>
                        <label className="text-sm">Note</label>
                        <textarea
                            className="border p-2 w-full"
                            value={form.note}
                            onChange={(e) => updateField("note", e.target.value)}
                        />
                    </div>

                    <button className="bg-rose-600 text-white w-full py-2 rounded">
                        Save
                    </button>
                </form>
            </div>
        </div>
    );
}