import React, { useEffect, useState } from "react";

export default function ProtectedImage({ src, alt, ...props }) {
  const [url, setUrl] = useState(src);
  useEffect(() => {
    if (!src?.startsWith("/api/")) {
      setUrl(src);
      return undefined;
    }
    let active = true;
    let objectUrl;
    fetch(src, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("signfix_token") || ""}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Image unavailable");
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setUrl("");
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);
  return url ? <img src={url} alt={alt} {...props} /> : <span>Image unavailable</span>;
}
