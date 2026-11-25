import React, { useEffect, useState } from "react";

/* Patient photo thumbnail: click to see it large (click / Esc closes). No photo, or a
   photo that fails to load -> the user icon instead of a placeholder picture. */
const PatientPhotoZoom = ({ src, size = 46, rounded = true, title = "Patient" }) => {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!src || broken)
    return <i className="fa fa-user-circle" style={{ fontSize: size, color: "#cbd5e1", lineHeight: 1 }} />;

  return (
    <>
      <img
        src={src}
        alt={title}
        title="Click to zoom"
        onError={() => setBroken(true)}
        onClick={() => setOpen(true)}
        style={{
          width: size, height: size, objectFit: "cover", flexShrink: 0, cursor: "zoom-in",
          borderRadius: rounded ? "50%" : 6, border: "1px solid #dde4eb",
        }}
      />
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,.75)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out",
          }}
        >
          <img
            src={src}
            alt={title}
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, background: "#fff", boxShadow: "0 8px 30px rgba(0,0,0,.4)" }}
          />
          <i
            className="fa fa-times"
            title="Close"
            style={{ position: "absolute", top: 18, right: 24, color: "#fff", fontSize: 26, cursor: "pointer" }}
          />
        </div>
      )}
    </>
  );
};

export default PatientPhotoZoom;
