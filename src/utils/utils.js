import { toast } from "react-toastify";
import { toastBody } from "./toastBody";
const isMobile = window.innerWidth <= 768;
// Serial error-toast queue: show one error at a time. When several APIs fail
// together, the first error toast shows; the next only appears once it closes.
// Identical messages are de-duped so the same failure can't stack.
const errorQueue = [];
let errorActive = false;
let activeErrorMsg = null;

const showNextError = () => {
  if (errorQueue.length === 0) {
    errorActive = false;
    activeErrorMsg = null;
    return;
  }
  errorActive = true;
  activeErrorMsg = errorQueue.shift();
  toast.error(toastBody("error", activeErrorMsg), {
    autoClose: 4000,
    onClose: showNextError, // advance only after this toast is gone
  });
};

const enqueueError = (message) => {
  const msg = message == null ? "" : String(message);
  // Skip if the same message is already showing or waiting in the queue.
  if (msg === activeErrorMsg || errorQueue.includes(msg)) return;
  errorQueue.push(msg);
  if (!errorActive) showNextError();
};

export const notify = (message, type = "success") => {
  if (type === "success") {
    toast.success(toastBody(type, message), { autoClose: 1000 });
  } else if (type === "warn") {
    toast.warn(toastBody(type, message), { autoClose: 3000 });
  } else if (type === "error") {
     toast.warn(toastBody(type, message), { autoClose: 3000 });
  }else if(type === "internalerror"){
    enqueueError(message);
  }
};







export const handleReactSelectDropDownOptions = (data, labelKey, valueKey) => {

  const state = data ? data : [];
  return state?.map((ele, index) => {
    if (typeof ele === "object") {
      return {
        ...ele,
        label: ele[labelKey],
        value: ele[valueKey],
      };
    } else {
      return {
        label: ele,
        value: ele,
      };
    }
  });
};




export const isArrayFunction = (params) => {
  return Array.isArray(params) ? params : [];
};







export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};
























































































export const handleModifiedDoctorSlotData = (apiResponse, key, secondKey) => {
  const objData = apiResponse.reduce((acc, current, index) => {
    if (acc[current[key]]) {
      if (acc[current[key]][current[secondKey]]) {
        acc[current[key]][current[secondKey]] = [
          ...acc[current[key]][current[secondKey]],
          current,
        ];
      } else {
        acc[current[key]][current[secondKey]] = [current];
      }
    } else {
      acc[current[key]] = {
        ...acc[current[key]],
        [current[secondKey]]: [current],
      };
    }

    return acc;
  }, {});

  return objData;
};






