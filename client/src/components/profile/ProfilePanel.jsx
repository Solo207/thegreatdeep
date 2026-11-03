import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle";
import { getProfile } from "../../lib/api/account";

const ROWS = [
  ["Email", "email"],
  ["Username", "userName"],
  ["Phone number", "phone"],
  ["Department", "department"],
  ["School", "school"],
  ["Level", "level"],
];

export default function ProfilePanel() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  if (!params.has("profile")) return null;

  const close = () => {
    // we pushed an entry when opening, so go back; fresh tab/deep link just drops the param
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("profile");
          return next;
        },
        { replace: true },
      );
  };

  return <ProfileView onClose={close} />;
}

function Avatar({ image, name }) {
  const [broken, setBroken] = useState(false);
  if (image && !broken) {
    return (
      <img
        src={image}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="h-24 w-24 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500 text-3xl font-bold text-white">
      {(name || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}

function ProfileView({ onClose }) {
  usePageTitle("Profile");
  const [state, setState] = useState({ status: "loading", profile: null });
  const [attempt, setAttempt] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    let ignore = false;
    setState({ status: "loading", profile: null });
    getProfile()
      .then((profile) => !ignore && setState({ status: "ready", profile }))
      .catch(() => !ignore && setState({ status: "error", profile: null }));
    return () => {
      ignore = true;
    };
  }, [attempt]);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 220);
  };

  const { status, profile } = state;

  return (
    <div
      className="absolute inset-0 z-20 overflow-y-auto bg-zinc-900"
      style={{ animation: closing ? "profile-out 220ms ease-in forwards" : "profile-in 250ms ease-out" }}
    >
      <div className="flex h-[60px] items-center gap-2 px-3">
        <button
          type="button"
          onClick={close}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">Profile</h1>
      </div>

      <div className="mx-auto w-full max-w-md px-4 pb-10">
        <div className="flex justify-center py-6">
          {status === "ready" ? (
            <Avatar image={profile.image} name={profile.userName} />
          ) : (
            <div className="h-24 w-24 animate-pulse rounded-full bg-zinc-800" />
          )}
        </div>

        {status === "error" ? (
          <div className="text-center">
            <p className="mb-3 text-sm text-red-400">Couldn't load your profile.</p>
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold hover:bg-zinc-700"
            >
              Try again
            </button>
          </div>
        ) : (
          <dl className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {ROWS.map(([label, key]) => (
              <div key={key} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <dt className="shrink-0 text-sm text-zinc-500">{label}</dt>
                <dd className="min-w-0 break-words text-right">
                  {status === "loading" ? (
                    <span className="inline-block h-4 w-28 animate-pulse rounded bg-zinc-800" />
                  ) : (
                    profile[key] || "—"
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}