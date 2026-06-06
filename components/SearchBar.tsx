"use client";

import { useState } from "react";

type SearchBarProps = {
  placeholder: string;
};

export default function SearchBar({ placeholder }: SearchBarProps) {
  const [query, setQuery] = useState("");

  return (
    <label className="block">
      <span className="sr-only">Search</span>
      <input
        className="h-11 w-full rounded-md border border-zinc-300 bg-white px-4 text-sm text-zinc-950 outline-none ring-red-700/20 placeholder:text-zinc-500 focus:border-red-700 focus:ring-4"
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={query}
      />
    </label>
  );
}
