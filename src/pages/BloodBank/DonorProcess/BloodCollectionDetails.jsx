import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";  
import Input from "../../../components/formComponent/Input";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import LabeledInput from "../../../components/formComponent/LabeledInput";
import { EDPBloodBankMasterLoadBloodBag } from "../../../networkServices/blooadbankApi";
import { handleReactSelectDropDownOptions } from "../../../utils/utils";

export default function BloodCollectionDetails({
  handleChangeModel,
  inputData,
}) {
      const [dropDownState, setDropDownState] = useState({
          BloodBagType: [],
         
      })
  const [t] = useTranslation();

  const initial={
       Reaction:  {label:"No",value:"0"},
  }
  const [values, setValues] = useState({...inputData,...initial}); 


  useEffect(() => {
    handleChangeModel(values);
  }, [values]);

 

  const handleChange = (e) => {
    
    if(e.target?.name==="PoorShocked"){
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.checked }));

    }
    else{
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    }
  };  

  
  const handleSelect = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };


    const DonationCompleted = [
        
    { value: "select", label: t("select") },
    { value: "0", label: t("No") },
    { value: "1", label: t("Yes") },
  ];
  
  const bloodBag=async()=>{
try {
  const response=await EDPBloodBankMasterLoadBloodBag()
  if(response?.success){
 setDropDownState((val) => ({
                    ...val,
                    // Value me bag ka NAAM (ID nahi) - bb_collection_details.BagType me naam hi
                    // jaata hai aur Component Creation "single" naam se hi pehchanta hai.
                    BloodBagType: handleReactSelectDropDownOptions(
                        response?.data,
                        "BagType",
                        "BagType"
                    ),
                }));
  }
  else{
    console.log("error",response?.message)
  }
} catch (error) {
  console.log("Error",error)
}
  }
 useEffect(()=>{
bloodBag()
 },[])
  return (
    <>
<div className="d-flex align-items-baseline w-100">
    <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3 w-100">
       <div className="col mb-1 ">
      <LabeledInput label={t("Donor ID")} value={inputData?.Visitor_ID} />
    </div>
    <div className="col mb-1">
      <LabeledInput label={t("Name")} value={inputData?.Name} />
    </div>
    <div className="col mb-1">
      <LabeledInput label={t("Sex")} value={inputData?.Gender} />
    </div>
    <div className="col mb-1">
      <LabeledInput label={t("Blood Group")} value={inputData?.BloodGroup} />
    </div>
    <div className="col mb-1">
      <LabeledInput label={t("Bag Type")} value={inputData?.BagType} />
    </div>
    <div className="col mb-1">
      <LabeledInput label={t("Qty")} value={inputData?.Quantity} />
    </div>
    <div className="col mb-1">
      <LabeledInput label={t("Entry Date")} value={inputData?.dtEntry} />
    </div>
    </div>
    </div>
   <div className="d-flex align-items-baseline w-100">
  <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3 w-100">
    {/* Static Input Fields */}
   

    {/* Editable Input Fields */}
    {/* <div className="col mb-1">
      <Input
        type="text"
        className="form-control"
        id="VisitorId"
        name="VisitorId"
        value={values?.VisitorId || ""}
        onChange={handleChange}
        lable={t("Visitor ID")}
      />
    </div> */}

    <div className="col mb-1">
         <ReactSelect
            placeholderName={t("Donation Completed")}
            id={"DonationCompleted"}
            searchable={true}
            removeIsClearable={true}
            dynamicOptions={DonationCompleted}
            handleChange={handleSelect}
            value={`${values?.DonationCompleted?.value}`}
            name={"DonationCompleted"}
          />
    </div>

    <div className="col mb-1">
      <Input
        type="text"
        className="form-control"
        id="remark"
        name="remark"
        value={values?.remark || ""}
        onChange={handleChange}
        lable={t("Remark")}
      />
    </div> 

    {values?.DonationCompleted?.value=="1" ?<>
      <div className="col mb-1">
         <ReactSelect
              placeholderName={t("Bag Type ")}
              id={"Type"}
              searchable={true}
              removeIsClearable={true} 
            // Bag Type Master (bb_BagType_master, active) se - pehle Single/Double/Triple hard-coded the.
            dynamicOptions={[
              { label: t("Select"), value: "0" },
              ...(dropDownState?.BloodBagType ?? []),
            ]}
              handleChange={handleSelect}
              value={`${values?.Type?.value}`}
              name={"Type"}
            />
    </div>
    {
      values?.Type?.value !=="0" && <div className="col mb-1">
         <ReactSelect
              placeholderName={t("Volume")}
              id={"Volume"}
              searchable={true}
              removeIsClearable={true} 
            dynamicOptions={
              [
                {
                  label:t("100 ml"),value:"100 ml"
                },
                {
                  label:t("150 ml"),value:"150 ml"
                },
                {
                  label:t("200 ml"),value:"200 ml"
                },
                {
                  label:t("250 ml"),value:"250 ml"
                },
                {
                  label:t("300 ml"),value:"300 ml"
                },
                {
                  label:t("350 ml"),value:"350 ml"
                },
                {
                  label:t("400 ml"),value:"400 ml"
                },
                {
                  label:t("450 ml"),value:"450 ml"
                },
                {
                  label:t("500 ml"),value:"500 ml"
                },
              ]
            }
              handleChange={handleSelect}
              value={`${values?.Volume?.value}`}
              name={"Volume"}
            />
    </div>
    }
    <div className="col mb-1">
      <Input
        type="text"
        className="form-control"
        id="tubeNo"
        name="tubeNo"
        value={values?.tubeNo || ""}
        onChange={handleChange}
        lable={t("Tube No")}
      />
    </div> 
    
    </>:
    ""
    }
{
  values?.DonationCompleted?.value==="0" &&

  <>
   <div className="col mb-1">
         <ReactSelect
            placeholderName={t("Reaction")}
            id={"Reaction"}
            searchable={true}
            removeIsClearable={true}
            dynamicOptions={[
              {label:t("Yes"),value:"1"},
              {label:t("No"),value:"0"},
            ]}
            handleChange={handleSelect}
            value={`${values?.Reaction?.value}`}
            name={"Reaction"}
          />
    </div>
    {
      values?.Reaction?.value==="1"&& <div className="col mb-1">
      <Input
        type="text"
        className="form-control"
        id="reactionRemarks"
        name="reactionRemarks"
        value={values?.reactionRemarks || ""}
        onChange={handleChange}
        lable={t("Reaction Remarks")}
      />
    </div> 
    }
  </>
}
{
  values?.DonationCompleted?.value=="0"  && <div className="col mb-1 d-flex ">
      <Input
        type="checkbox"
        name={"PoorShocked"}
        onChange={handleChange}
       
      />
      <label className="ml-1" > {t("Poor/Shocked Collection")}</label>
    </div>
}

   
  </div>
  
</div>

    </>
  );
}

// import React, { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import Input from "../../../components/formComponent/Input";
// import ReactSelect from "../../../components/formComponent/ReactSelect";
// import LabeledInput from "../../../components/formComponent/LabeledInput";
// import { BloodBankComponentAResult } from "../../../networkServices/BloodBank/BloodBank";
// import Tables from "../../../components/UI/customTable";
// import WrapTranslate from "../../../components/WrapTranslate";
// import CustomSelect from "../../../components/formComponent/CustomSelect";

// export default function BloodCollectionDetails({
//   handleChangeModel,
//   inputData,
// }) {
//   const [bodyData, setBodyData] = useState([])
//   const [t] = useTranslation();
//   const [values, setValues] = useState(inputData);
//   const getData = async () => {

//     const payload = {
//       "bagType": inputData?.BagType,
//       "collectionId": inputData?.Bloodcollection_id,
//       "bagTypeLabel": inputData?.BagType,
//     }
//     try {
//       const response = await BloodBankComponentAResult(payload);
//       if (response.success) {
//         setBodyData(response?.data)
//       } else {
//         console.error(
//           "API returned success as false or invalid response:",
//           response
//         );
//         setBodyData([])
//       }
//     } catch (error) {
//       console.error("Error fetching department data:", error);
//       setBodyData([])
//     }
//   };
//   useEffect(() => {
//     handleChangeModel({
//    values: values,
//    bodyData: bodyData
// });

//   }, [values,bodyData]);
//   useEffect(() => {
   
//     getData()
//   }, [values]);
// useEffect(() => {
//   if (bodyData?.length > 0) {
//     setBodyData((prev) =>
//       prev.map((item) => ({
//         ...item,
//         isChecked: item.isChecked || false,
//       }))
//     );
//   }
// }, [bodyData.length]);

//  const thead = [
//   { name: "S.No.", width: "2%" },
//   { name: "Check", width: "5%" },   // <-- NEW COLUMN
//   { name: "Component" },
//   { name: "Bag Type" },
//   { name: "Volume", width: "12%" },
//   { name: "Collection Date", width: "20%" },
//   { name: "Expiry Date", width: "20%" }
// ];
// const handleCheck = (index, e) => {
//   const updated = [...bodyData];
//   updated[index].isChecked = e.target.checked;
//   setBodyData(updated);
// };

 
//   const handleCustomInput = (index, name, e) => {
//     console.log("e", e)
//     const data = JSON.parse(JSON.stringify(bodyData));
//     data[index][name] = e;
//     setBodyData(data);
//   };


//   const getRowClass = (val) => {
//     if (val?.dtExpiry === "") {
//       return "color-indicator-23-bg";
//     }


//   };

//   return (
//     <>
//       <div className="d-flex align-items-baseline w-100">
//         <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3 w-100">
//           {/* Static Input Fields */}
//           <div className="col mb-1 ">
//             <LabeledInput label={t("Donor ID")} value={inputData?.Visitor_ID} />
//           </div>
//           <div className="col mb-1">
//             <LabeledInput label={t("Name")} value={inputData?.Name} />
//           </div>
//           <div className="col mb-1">
//             <LabeledInput label={t("Sex")} value={inputData?.Gender} />
//           </div>
//           <div className="col mb-1">
//             <LabeledInput label={t("Blood Group")} value={inputData?.BloodGroup} />
//           </div>
//           <div className="col mb-1">
//             <LabeledInput label={t("Bag Type")} value={inputData?.BagType} />
//           </div>
//           <div className="col mb-1">
//             <LabeledInput label={t("Qty")} value={inputData?.Quantity} />
//           </div>
//           <div className="col mb-1">
//             <LabeledInput label={t("Entry Date")} value={inputData?.dtEntry} />
//           </div>
//         </div>
//       </div>
//       <Tables thead={WrapTranslate(thead, "name")}
//         style={{ height: "70vh" }}
//         tbody={bodyData?.map((val, index) => ({
//           SNo: index + 1,
//            Check: (
//     <input
//       type="checkbox"
//       checked={val?.isChecked || false}
//       onChange={(e) => handleCheck(index, e)}
//     />
//   ),
//           componentName: val?.componentName,
//           BagType: val?.BagType,

//           Value: <Input
//             type="text"
//             className="table-input"
//             respclass={"w-100"}
//             removeFormGroupClass={true}
//             name={"Value"}
//             value={val?.Value ? val?.Value : ""}
//             onChange={(e) => { handleCustomInput(index, "Value", e?.target.value) }}
//           />,
//           dtCreate: val?.dtCreate,
//           dtExpiry: val?.dtExpiry,

//         }))}
//         getRowClass={getRowClass}
//       />
//     </>
//   );
// }
