import { toast } from "react-toastify";
import { APIBaseURL } from "../axiosInstance";



/* Print ka naya tab khulwana.

   Pehle yahan sirf window.open tha aur uska nateeja kahin pakda nahi jaata tha.
   Browser us tab ko rok de to window.open null lautata hai - aur kuch na hone ke
   kaaran screen par koi nishaan nahi chhodta: na tab, na galti ka message. Bill
   ban chuka hota hai, screen saaf ho jaati hai, bas print gayab.

   Browser aisa kab karta hai: jab khulne ka hukm user ke click se seedha na jude.
   Pharmacy Issue me Save aur print ke beech teen API call aati hain (bill, hash,
   PDF), aur itni der me browser ka "abhi click hua tha" wala hisaab khatm ho
   chuka hota hai - isliye wahan ye sabse zyada hota hai.

   Ab tab ruk jaye to user ko ek message dikhta hai jise daba kar wo print khol
   sakta hai.

   Tab theek khul jaye to kuch nahi badalta - ye poora hissa tabhi chalta hai jab
   pehle chup-chaap kuch na hota. */
export const RedirectURL = (url) => {
  const finalUrl = `${APIBaseURL}/${url}`;

  let printTab = null;
  try {
    printTab = window.open(finalUrl, "_blank");
  } catch (error) {
    printTab = null;
  }

  /* Ruka hua tab in teenon me se kisi bhi roop me aata hai - browser ke hisaab se
     alag-alag. Teeno ko ek saath dekhna padta hai. */
  const blocked =
    !printTab || printTab.closed || typeof printTab.closed === "undefined";

  if (blocked) {
    /* Toast par click KHUD ek click hai, isliye usse khula tab kabhi nahi rukta -
       yahi is upaay ki poori jaan hai.

       autoClose: false jaan-bujh kar. Ye apne aap gayab ho gaya to user ke paas
       print kholne ka koi raasta hi nahi bachega. */
    toast.warn(
      "The browser blocked the print tab. Click here to open the print, or allow pop-ups for this site.",
      {
        autoClose: false,
        closeOnClick: false,
        style: { cursor: "pointer" },
        onClick: () => {
          window.open(finalUrl, "_blank");
        },
      },
    );
    return null;
  }

  window.focus();
  return printTab;
};




