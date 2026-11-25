/**
 * useNfFileUrl(form) — the URL of a form's (or version snapshot's) uploaded file:
 *
 *   filePath   (since files moved to disk)  a same-origin object URL, fetched with login
 *   fileKey    (forms saved before that)    the anonymous File?key= URL
 *
 * "" while the file is loading or when there is none; `loading` tells them apart.
 */
import { useEffect, useState } from "react";
import { nfDocUrl, nfFileUrl } from "../../../networkServices/nursingFormBuilderApi";

export function useNfFileUrl(f) {
  const path = f?.filePath || "";
  const key = f?.fileKey || "";
  // a Replace may write the same path again: the form's save stamp makes it fetch anew
  const stamp = `${f?.modifiedOn || ""}|${f?.fileSize || ""}`;
  const [state, setState] = useState(() => ({ url: path ? "" : nfFileUrl(key), loading: !!path, error: "" }));
  useEffect(() => {
    if (!path) {
      setState({ url: nfFileUrl(key), loading: false, error: "" });
      return undefined;
    }
    let dead = false;
    setState({ url: "", loading: true, error: "" });
    nfDocUrl(path)
      .then((url) => !dead && setState({ url, loading: false, error: "" }))
      .catch((e) => !dead && setState({ url: "", loading: false, error: e?.message || "The file could not be loaded." }));
    return () => {
      dead = true;
    };
  }, [path, key, stamp]);
  return state;
}
