import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import ReactSelect from '../formComponent/ReactSelect';
import DatePicker from '../formComponent/DatePicker';
import Input from '../formComponent/Input';
import Tables from '../UI/customTable';
import Heading from '../UI/Heading';
import TextAreaInput from '../formComponent/TextAreaInput';
import { notify } from '../../utils/ustil2';
import { BindMultipleDataByID, PCIBindData, SavePostPCI, UpdatePostPCI } from '../../networkServices/nursingWardAPI';
import moment from 'moment';

function PostPCIForm({ data }) {
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const initialvalues = {
    id: "",
    site: "",
    color: "",
    temperature: "",
    sensation: "",
    bleeding: null,
    hematoma: null,
    pulsePresent: "",
    radial: "",
    patientEducation: "",
    nursingInterventions: "",
    sheathRemoval: "",
    nurseName1: "",
    nurseName2: "",
    date1: "",
    date2: "",
  };

  const YES_NO = [
    { label: t("Yes"), value: "1" },
    { label: t("No"), value: "0" },
  ];

  const timeColumns = [
    '0 min', '15 min', '30 min', '45 min', '60 min', '1.5 hr',
    '2 hr', '3 hr', '4 hr', '5 hr', '6 hr', '7 hr', '8 hr', '9 hr', '10 hr', '11 hr', '12 hr'
  ];

  const THEAD = [
    ...timeColumns.map(col => ({
      name: t(col),
      className: 'bg-light-green text-center'
    })),
    { name: t('Time'), className: 'bg-light-green text-vertical' },
    { name: t('Eg.'), className: 'bg-light-green text-vertical' },
  ];

  const rowDefinitions = [
    { lable: t('Real Time'), example: '1520', key: 'realTime' },
    { lable: t('Blood Pressure'), example: '120/62', key: 'bp' },
    { lable: t('Site'), example: 'R. Femoral', key: 'site' },
    { lable: t('Color'), example: 'WNL', key: 'color' },
    { lable: t('Temperature'), example: 'Cold', key: 'temp' },
    { lable: t('Pulses'), example: '1+/0', key: 'pulses' },
    { lable: t('Sensation'), example: 'WNL', key: 'sensation' },
    { lable: t('Bleeding'), example: 'No', key: 'bleeding' },
    { lable: t('Hematoma'), example: 'No', key: 'hematoma' },
    { lable: t('Initial'), example: '', key: 'initial' },
  ];

  const [values, setValues] = useState(initialvalues);
  const [tabeldata, setTabledata] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowIds, setRowIds] = useState({}); // Store IDs for each row

  const isPatientExist = tabeldata?.find(
    item => item?.PatientID === data?.patientID
  );
  /*  const parseApiDate = (dateStr) => {
     if (!dateStr) return null;
     return new Date(dateStr);
   }; */

  const thead = [
    { name: t("SrNo"), width: "4%" },
    { name: t("UHID") },
    { name: t("entered bY") },
    { name: t("Action"), width: "3%" },
  ];

  // Initialize dynamic table fields
  useEffect(() => {
    const initializeTableValues = () => {
      const updatedValues = { ...initialvalues };
      rowDefinitions.forEach(row => {
        timeColumns.forEach(col => {
          const sanitizedCol = col.replace(/\s+/g, '_').replace(/\./g, '_');
          const fieldName = `${row.key}_${sanitizedCol}`;
          updatedValues[fieldName] = "";
        });
      });
      setValues(updatedValues);
    };
    initializeTableValues();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleReactSelectChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const getPCIBindData = async () => {
    try {
      setLoading(true);
      const response = await PCIBindData(data?.patientID, data?.transactionID);
      if (response.success) {
        setTabledata(response.data);
      }
    } catch (error) {
      notify(error?.message || "Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data?.patientID && data?.transactionID) {
      getPCIBindData();
    }
  }, [data?.patientID, data?.transactionID]);

  const handleEdit = async (id) => {
    try {
      const response = await BindMultipleDataByID(id);

      if (response.success) {
        const tableDataArray = response.data;
        const newValues = { ...initialvalues };
        const newRowIds = {};

        tableDataArray.forEach(item => {
          const timeKey = item.Times?.toLowerCase().replace(/\s+/g, '');

          let rowKey = '';
          switch (timeKey) {
            case 'realtime': rowKey = 'realTime'; break;
            case 'bloodpressure': rowKey = 'bp'; break;
            case 'site': rowKey = 'site'; newValues.site = item.Zero || ""; break;
            case 'color': rowKey = 'color'; newValues.color = item.Zero || ""; break;
            case 'temperature': rowKey = 'temp'; newValues.temperature = item.Zero || ""; break;
            case 'pulses': rowKey = 'pulses'; break;
            case 'sensation': rowKey = 'sensation'; newValues.sensation = item.Eg || ""; break;
            case 'bleeding':
              rowKey = 'bleeding';
              newValues.bleeding = (item.Zero === "Yes" || item.Zero === "1")
                ? YES_NO.find(opt => opt.value === "1")
                : YES_NO.find(opt => opt.value === "0");
              break;
            case 'hematoma':
              rowKey = 'hematoma';
              newValues.hematoma = (item.Zero === "Yes" || item.Zero === "1")
                ? YES_NO.find(opt => opt.value === "1")
                : YES_NO.find(opt => opt.value === "0");
              break;
            case 'initial': rowKey = 'initial'; break;
            default: return;
          }

          // Store the ID for this row
          newRowIds[rowKey] = item.Id || "";

          timeColumns.forEach(col => {
            const sanitizedCol = col.replace(/\s+/g, '_').replace(/\./g, '_');
            const fieldName = `${rowKey}_${sanitizedCol}`;

            let apiProperty = '';
            switch (col) {
              case '0 min': apiProperty = 'Zero'; break;
              case '15 min': apiProperty = 'Fifteen_Mins'; break;
              case '30 min': apiProperty = 'Thirty'; break;
              case '45 min': apiProperty = 'Fourty_Five'; break;
              case '60 min': apiProperty = 'Sixty'; break;
              case '1.5 hr': apiProperty = 'OnePointFive_Hr'; break;
              case '2 hr': apiProperty = 'Two'; break;
              case '3 hr': apiProperty = 'Three'; break;
              case '4 hr': apiProperty = 'Four'; break;
              case '5 hr': apiProperty = 'Five'; break;
              case '6 hr': apiProperty = 'Six'; break;
              case '7 hr': apiProperty = 'Seven'; break;
              case '8 hr': apiProperty = 'Eight'; break;
              case '9 hr': apiProperty = 'Nine'; break;
              case '10 hr': apiProperty = 'Ten'; break;
              case '11 hr': apiProperty = 'Eleven'; break;
              case '12 hr': apiProperty = 'Twelve'; break;
              default: apiProperty = sanitizedCol;
            }

            newValues[fieldName] = item[apiProperty] || "";
          });
        });

        // Load main form data
        const mainResponse = await PCIBindData(data?.patientID, data?.transactionID);
        if (mainResponse.success && mainResponse.data?.[0]) {
          const val = mainResponse.data[0];
          debugger
          newValues.id = val?.Id || "";
          newValues.site = val?.Site || "";
          newValues.temperature = val?.Temperature || "";
          newValues.color = val?.Color || "";
          newValues.sensation = val?.Sensation || "";
          newValues.bleeding = val?.Bleeding === "1" ? YES_NO[0] : YES_NO[1];
          newValues.hematoma = val?.Hematoma === "1" ? YES_NO[0] : YES_NO[1];
          newValues.pulsePresent = val?.PlusePresent || "";
          newValues.radial = val?.Radial || "";
          newValues.patientEducation = val?.PatientEducation || "";
          newValues.nursingInterventions = val?.Nursing_Interventions || "";
          newValues.sheathRemoval = val?.SneathRemoval || "";
          newValues.nurseName1 = val?.NurseName_1 || "";
          newValues.nurseName2 = val?.NurseName_2 || "";
          newValues.date1 = new Date(val?.Date1) || "";
          newValues.date2 = new Date(val?.Date2) || "";
        }
        setRowIds(newRowIds);
        setValues(newValues);
      }
    } catch (error) {
      notify(error?.message || "Failed to load data", "error");
    }
  };

  // Build MultipleData from table inputs
  const buildMultipleData = () => {
    return rowDefinitions.map(row => {
      const rowObj = {
        Id: rowIds[row.key] || "0", // Include the ID for updates
        Time: "",
        Eg: row.example || "",
        PatientID: data?.patientID || "",
        TransactionID: data?.transactionID || "",
      };

      switch (row.key) {
        case 'realTime': rowObj.Time = "Real Time"; break;
        case 'bp': rowObj.Time = "Blood Pressure"; break;
        case 'site': rowObj.Time = "Site"; break;
        case 'color': rowObj.Time = "Color"; break;
        case 'temp': rowObj.Time = "Temperature"; break;
        case 'pulses': rowObj.Time = "Pulses"; break;
        case 'sensation': rowObj.Time = "Sensation"; break;
        case 'bleeding': rowObj.Time = "Bleeding"; break;
        case 'hematoma': rowObj.Time = "Hematoma"; break;
        case 'initial': rowObj.Time = "Initial"; break;
        default: rowObj.Time = row.key;
      }

      // Map each time column
      timeColumns.forEach(col => {
        const sanitizedCol = col.replace(/\s+/g, '_').replace(/\./g, '_');
        const fieldName = `${row.key}_${sanitizedCol}`;
        const value = values[fieldName] || "";

        let apiProperty = '';
        switch (col) {
          case '0 min': apiProperty = 'Zero'; break;
          case '15 min': apiProperty = 'Fifteen_Mins'; break;
          case '30 min': apiProperty = 'Thirty'; break;
          case '45 min': apiProperty = 'Fourty_Five'; break;
          case '60 min': apiProperty = 'Sixty'; break;
          case '1.5 hr': apiProperty = 'OnePointFive_Hr'; break;
          case '2 hr': apiProperty = 'Two'; break;
          case '3 hr': apiProperty = 'Three'; break;
          case '4 hr': apiProperty = 'Four'; break;
          case '5 hr': apiProperty = 'Five'; break;
          case '6 hr': apiProperty = 'Six'; break;
          case '7 hr': apiProperty = 'Seven'; break;
          case '8 hr': apiProperty = 'Eight'; break;
          case '9 hr': apiProperty = 'Nine'; break;
          case '10 hr': apiProperty = 'Ten'; break;
          case '11 hr': apiProperty = 'Eleven'; break;
          case '12 hr': apiProperty = 'Twelve'; break;
          default: apiProperty = sanitizedCol;
        }

        rowObj[apiProperty] = value;
      });

      return rowObj;
    });
  };

  const handleSave = async () => {
    if (!data?.patientID || !data?.transactionID) {
      notify(t("Patient ID or Transaction ID is missing"), "error");
      return;
    }

    try {
      setLoading(true);
      const mainData = {
        id: values?.id || 0,
        site: values.site || "",
        color: values.color || "",
        temperature: values.temperature || "",
        sensation: values.sensation || "",
        bleeding: values.bleeding?.value === "1" ? "1" : "0",
        hematoma: values.hematoma?.value === "1" ? "1" : "0",
        plusePresent: values.pulsePresent || "",
        radial: values.radial || "",
        patientEducation: values.patientEducation || "",
        nursingInterventions: values.nursingInterventions || "",
        SneathRemoval: values.sheathRemoval || "",
        nurseName1: values.nurseName1 || "",
        nurseName2: values.nurseName2 || "",
        patientID: data?.patientID || "",
        transactionID: data?.transactionID || "",
        Date1: values.date1 ? moment(values?.date1).format("DD-MMM-YYYY") : "",
        Date2: values.date2 ? moment(values?.date2).format("DD-MMM-YYYY") : "",
      };

      const multipleData = buildMultipleData();
      const payload = {
        data: [mainData],
        MultipleData: multipleData
      };

      let response;
      if (isPatientExist?.Id) {
        response = await UpdatePostPCI(payload);
      } else {
        response = await SavePostPCI(payload);
      }
      if (response.success) {
        notify(response.message || "Saved successfully", "success");
        await getPCIBindData();
        setValues({ ...initialvalues })
      } else {
        notify(response.message || "Failed to save", "error");
      }
    } catch (error) {
      notify(error?.message || "An error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  // Table body generation (unchanged)
  const tbody = rowDefinitions.map(row => {
    const rowData = timeColumns.reduce((acc, col) => {
      const sanitizedCol = col.replace(/\s+/g, '_').replace(/\./g, '_');
      const fieldName = `${row.key}_${sanitizedCol}`;

      acc[col] = (
        <Input
          type="text"
          className="form-control"
          id={fieldName}
          name={fieldName}
          onChange={handleChange}
          value={values[fieldName] || ''}
          placeholder=""
          respclass="col-12"
        />
      );
      return acc;
    }, {});

    return {
      ...rowData,
      [t('Time')]: row.lable,
      [t('Eg.')]: row.example,
    };
  });

  return (
    <>
      {/* Entire return JSX remains unchanged */}
      <form className="card patient_registration border mt-1">
        <Heading title={t("Over Time Request")} isBreadcrumb={true} />

        <div className="row p-2">
          <div className="col-12">
            <div className="row g-3">
              <Input type="text" className="form-control" id="site" name="site" onChange={handleChange} value={values?.site || ''} lable={t("Site")} placeholder="" respclass="col-xl-2 col-md-4 col-sm-6 col-12" />
              <Input type="text" className="form-control" id="color" name="color" onChange={handleChange} value={values?.color || ''} lable={t("Color")} placeholder="" respclass="col-xl-2 col-md-4 col-sm-6 col-12" />
              <Input type="text" className="form-control" id="temperature" name="temperature" onChange={handleChange} value={values?.temperature || ''} lable={t("Temperature")} placeholder="" respclass="col-xl-2 col-md-4 col-sm-6 col-12" />
              <Input type="text" className="form-control" id="sensation" name="sensation" onChange={handleChange} value={values?.sensation || ''} lable={t("Sensation")} placeholder="" respclass="col-xl-2 col-md-4 col-sm-6 col-12" />
              <ReactSelect placeholderName={t("Bleeding")} searchable respclass="col-xl-2 col-md-4 col-sm-6 col-12" id="bleeding" name="bleeding" value={values?.bleeding} removeIsClearable={false} dynamicOptions={YES_NO} handleChange={handleReactSelectChange} />
              <ReactSelect placeholderName={t("Hematoma")} searchable respclass="col-xl-2 col-md-4 col-sm-6 col-12" id="hematoma" name="hematoma" value={values?.hematoma} removeIsClearable={false} dynamicOptions={YES_NO} handleChange={handleReactSelectChange} />
              <Input type="text" className="form-control" id="pulsePresent" name="pulsePresent" onChange={handleChange} value={values?.pulsePresent || ''} lable={t("Pulse Present")} placeholder="" respclass="col-xl-2 col-md-4 col-sm-6 col-12" />
              <Input type="text" className="form-control" id="radial" name="radial" onChange={handleChange} value={values?.radial || ''} lable={t("Radial Pulse")} placeholder="" respclass="col-xl-2 col-md-4 col-sm-6 col-12" />

              <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                <TextAreaInput className="form-control" lable={t("Patient Education")} placeholder="" name="patientEducation" id="patientEducation" rows={4} value={values?.patientEducation || ""} onChange={handleChange} />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                <TextAreaInput className="form-control" lable={t("Nursing Interventions")} placeholder="" name="nursingInterventions" id="nursingInterventions" rows={4} value={values?.nursingInterventions || ""} onChange={handleChange} />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                <TextAreaInput className="form-control" lable={t("Sheath Removal")} placeholder="" name="sheathRemoval" id="sheathRemoval" rows={4} value={values?.sheathRemoval || ""} onChange={handleChange} />
              </div>
            </div>
          </div>
        </div>

        <div className="my-4">
          <Tables thead={THEAD} tbody={tbody} />
        </div>

        <div className="card my-4">
          <div className="row p-3 g-3 align-items-end">
            <Input type="text" className="form-control" id="nurseName1" name="nurseName1" onChange={handleChange} value={values?.nurseName1 || ''} lable={t("Nurse's Name")} placeholder="" respclass="col-xl-3 col-md-4 col-sm-6 col-12" />
            <Input type="text" className="form-control" id="nurseName2" name="nurseName2" onChange={handleChange} value={values?.nurseName2 || ''} lable={t("Nurse's Name")} placeholder="" respclass="col-xl-3 col-md-4 col-sm-6 col-12" />
            <DatePicker className="custom-calendar" id="date1" name="date1" lable={t("Date")} placeholder={VITE_DATE_FORMAT} respclass="col-xl-3 col-md-4 col-sm-6 col-12" value={values?.date1} handleChange={handleDateChange} />
            <DatePicker className="custom-calendar" id="date2" name="date2" lable={t("date")} placeholder={VITE_DATE_FORMAT} respclass="col-xl-3 col-md-4 col-sm-6 col-12" value={values?.date2} handleChange={handleDateChange} />

            <div className="col-12 text-end">
              <div className='text-right'>
                <button className={`btn btn-sm btn-success mx-2 ${loading ? 'disabled' : ''} ${isPatientExist ? 'd-none' : ''}`} type="button" onClick={handleSave} disabled={loading}>
                  {loading ? t("Loading...") : (isPatientExist ? "" : t("Save"))}
                </button>
                <button className={`btn btn-sm btn-success mx-2 ${loading ? 'disabled' : ''} ${isPatientExist && values?.id ? '' : 'd-none'}`} type="button" onClick={handleSave} disabled={loading}>
                  {loading && t("Loading...")}
                  {!loading && isPatientExist && values?.id && t("Update")}
                </button>
                <button className="btn btn-sm btn-primary mx-2" type="button">
                  {t("Print")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="text-center p-3">
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      ) : tabeldata && tabeldata.length > 0 ? (
        <>
          <Heading title={t("Search Results")} isBreadcrumb={false} />
          <Tables
            thead={thead}
            tbody={tabeldata.map((val, index) => ({
              "S.No": index + 1,
              uhid: val?.PatientID,
              enteredBy: val?.EmployeeName,
              action: (
                <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(val?.Id)} disabled={loading}>
                  <i className="fa fa-edit" aria-hidden="true" />
                </button>
              ),
            }))}
          />
        </>
      ) : null}
    </>
  );
}

export default PostPCIForm;