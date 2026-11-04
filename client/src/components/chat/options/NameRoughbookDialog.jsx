import { useState } from "react";

const MAX = 30; // same as RB_NAME_MAX in pages/Roughbooks/rules.js

export default function NameRoughbookDialog({ note, onCreate, onCancel }) {
  const [name, setName] = useState("");
  const clean = name.replace(/\s+/g, " ").trim().slice(0, MAX);

  const submit = (e) => {
    e.preventDefault();
    if (clean) onCreate(clean);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-zinc-900 p-5 shadow-xl"
      >
        <h2 className="mb-3 text-lg font-bold">New roughbook</h2>
        <input
          autoFocus
          value={name}
          maxLength={MAX}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-500"
        />
        {note && <p className="mt-2 text-xs text-zinc-500">{note}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!clean}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}