import store from "../store/store";
export const isLabNoLabel = () => {
  const resources = store.getState()?.CommonSlice?.GetGlobalResources;
  const list = Array.isArray(resources) ? resources : resources?.data;
  return (
    Array.isArray(list) &&
    String(
      list.find((item) => item?.Name === "ShowLabNoInsteadOfBarcode")?.Value ?? "",
    ).trim() === "1"
  );
};

export const labLabel = (text) => {
  if (typeof text !== "string" || !isLabNoLabel()) return text;
  return text.replace(/bar\s*code(\s*no\.?)?/gi, "Lab No");
};
