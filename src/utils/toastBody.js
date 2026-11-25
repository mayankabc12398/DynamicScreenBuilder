import React from "react";

const TYPE_TITLES = {
  success: "Success",
  warn: "Warning",
  error: "Warning",
  // error: "Error",
  info: "Info",
};

// Two-line toast body: bold title + muted message (no JSX — this is a .js file).
// Modern view only — legacy keeps the plain message it always had (unchanged).
export const toastBody = (type, message) => {
  if (document.documentElement.dataset.design !== "modern") {
    return message;
  }
  return React.createElement(
    "div",
    { className: "app-toast-body" },
    React.createElement(
      "div",
      { className: "app-toast-title" },
      TYPE_TITLES[type] || TYPE_TITLES.info,
    ),
    React.createElement(
      "div",
      { className: "app-toast-message" },
      message == null ? "" : String(message),
    ),
  );
};
