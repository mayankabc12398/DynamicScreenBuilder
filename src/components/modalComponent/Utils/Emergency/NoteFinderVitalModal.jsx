import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "@app/components/formComponent/Input";
import FullTextEditor from "../../../../utils/TextEditor";

export default function NoteFinderVitalModal({ handleChangeModel, inputData }) {
    debugger
  const [t] = useTranslation();
  const [inputs, setInputs] = useState(inputData);

  /* useEffect(() => {
    setInputs(inputData);
  }, [inputData]); */

  /* useEffect(() => {
    handleChangeModel(inputs);
  }, [inputs, handleChangeModel]);

  const handlechange = (e) => {
    const { name, value } = e.target;
    setInputs((val) => ({ ...val, [name]: value }));
  }; */

  return (
    <div className="row p-2">
      <FullTextEditor
        value={inputData}
        /* setValue={(value) =>
          setState((prev) => ({ ...prev, editorValue: value }))
        }
        EditTable={state?.EditTable}
        setEditTable={(value) =>
          setState((prev) => ({ ...prev, EditTable: value }))
        }
        clear={state?.clear} */
      />
    </div>
  );
}
