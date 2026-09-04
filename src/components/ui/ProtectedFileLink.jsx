import React from "react";

export default function ProtectedFileLink({ href, children, className = "outline" }) {
  async function open() {
    const response = await fetch(href, { headers: { Authorization: `Bearer ${sessionStorage.getItem("signfix_token") || ""}` } });
    if (!response.ok) return;
    const url = URL.createObjectURL(await response.blob());
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  return <button type="button" className={className} onClick={open}>{children}</button>;
}
