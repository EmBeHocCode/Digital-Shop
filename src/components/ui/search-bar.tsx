"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-3 rounded-full border border-white/80 bg-white/90 px-4 py-3 shadow-sm ${
        compact ? "w-full max-w-md" : "w-full"
      }`}
    >
      <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4 text-muted" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Tìm VPS, cloud, gift card, thẻ game..."
        className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
      />
    </form>
  );
}
