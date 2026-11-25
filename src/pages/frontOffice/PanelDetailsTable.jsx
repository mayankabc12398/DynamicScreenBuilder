import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { bindPanelByPatientID } from '../../networkServices/opdserviceAPI'
import Tables from '../../components/UI/customTable'
import WrapTranslate from '../../components/WrapTranslate'
import Heading from '../../components/UI/Heading'
import moment from 'moment'
import AttachDoumentModal from '../../components/modalComponent/Utils/AttachDoumentModal'
import { SavePatientPanelDocument } from '../../store/reducers/common/CommonExportFunction'
import { notify } from '../../utils/utils'

// `isOpdServiceBooking` is set only by OPD Service Booking. On that screen the visit is
// being created on the same page, so panel documents uploaded here cannot be filed
// against a visit yet - the server would answer "No visit found for this patient. Book
// the visit first, then upload the panel documents." We skip the save call there and
// close the popup without an error; the files are picked up again by the booking save
// alongside the visit's TransactionID.
const PanelDetailsTable = ({ singlePatientData, selectedPanel, setSelectedPanel, testAddingTableState, showDocumentUpload = false, isOpdServiceBooking = false, onPendingDocuments }) => {

    const [t] = useTranslation()
    const [panelDetails, setPanelDetails] = useState([])
    // panel row whose "Upload Patient Document" popup is open
    const [uploadPanel, setUploadPanel] = useState(null)

    const saveDocuments = async (docs) => {
        const panelDocuments = []
        docs?.forEach((doc) => {
            if (!doc?.image) return
            const expiry = doc?.clearenceForm ? moment(doc.clearenceForm) : null
            const images = Array.isArray(doc?.files) && doc.files.length > 0
                ? doc.files.map((f) => f?.image).filter(Boolean)
                : [doc?.image]
            images.forEach((image) => panelDocuments.push({
                panelID: Number(uploadPanel?.PanelID) || 0,
                documentID: Number(doc?.DocumentID) || 0,
                documentName: doc?.Document ?? "",
                documentBase64: image,
                expiryDate: expiry && expiry.isValid() && expiry.year() > 1900 ? expiry.format("YYYY-MM-DD") : "",
            }))
        })
        if (panelDocuments.length === 0) {
            notify(t("Please upload at least one document"), "error")
            return
        }
        // OPD Service Booking: the visit does not exist yet, so skip the save call (and
        // its "No visit found ..." error). The documents are handed to the booking page,
        // which files them once the booking save returns its TransactionID.
        if (isOpdServiceBooking) {
            onPendingDocuments?.(String(uploadPanel?.PanelID), panelDocuments)
            notify(t("Documents attached. They will be saved with the booking."), "success")
            setUploadPanel(null)
            return
        }
        try {
            const apiResp = await SavePatientPanelDocument({
                transactionID: "",
                patientID: String(singlePatientData?.PatientID),
                panelDocuments,
            })
            notify(apiResp?.message, apiResp?.success ? "success" : "error")
            if (apiResp?.success) setUploadPanel(null)
        } catch (error) {
            console.error(error)
            notify(error?.message || "Could not save the documents", "error")
        }
    }
    const BindPaneDetails = async (PatientID) => {
        try {
            const response = await bindPanelByPatientID(PatientID)
            if (response?.success) {
                setPanelDetails(response?.data)
                const defaultPanel = response?.data?.find(
                    item => item?.isDefaultPanel === 1 || item?.isDefaultPanel === true
                )
                if (defaultPanel) {
                    setSelectedPanel(defaultPanel)
                }
            }
        } catch (error) {
            console.log("error", error)
        }
    }

    useEffect(() => {
        if (singlePatientData?.PatientID) {
            BindPaneDetails(singlePatientData?.PatientID)
        }
    }, [singlePatientData])

    const thead = [
        { name: "Select", width: "5%" },
        { name: "S.No.", width: "2%" },
        { name: "PanelGroup", width: "22%" },
        { name: "ParentPanel", width: "22%" },
        ...(panelDetails?.some(item => item?.CorporareName)
            ? [{ name: "Corporare", width: "12%" }]
            : []),
        // { name: "Corporare", width: "12%" },
        { name: "SchemeMode", width: "12%" },
        { name: "PolicyNo", width: "12%" },
        { name: "PolicyExpiry", width: "12%" },
        ...(showDocumentUpload ? [{ name: "Document", width: "5%" }] : []),
    ]
    const handleChangePanel = (val) => {
        // const data=[...panelDetails]
        setSelectedPanel(val)
    }
    console.log("panelDetails", panelDetails)
    console.log("selectedPanel12", selectedPanel)
    return (
        <div>{
            singlePatientData?.PatientID && <Heading title={t("Panel Details")} isBreadcrumb={false} />
            }
     
            <Tables
                thead={WrapTranslate(thead, "name")}
                tbody={panelDetails?.map((val, index) => ({
                    Select: (
                        <input
                            type="radio"
                            name="panelSelect"
                            checked={selectedPanel?.PanelID === val?.PanelID}
                            onChange={() => handleChangePanel(val)}
                            // onChange={() => setSelectedPanel(val)}
                            disabled={testAddingTableState?.length > 0 ? true : false}
                        />
                    ),
                    SNo: index + 1,
                    PanelGroup: val?.PanelGroup,
                    ParentPanel: val?.ParentPanel,
                    ...(panelDetails?.some(item => item?.CorporareName)
                        ? { CorporareName: val?.CorporareName }
                        : {}),
                    // CorporareName: val?.CorporareName,
                    SchemeMode: val?.PanelName,
                    PolicyNo: val?.PolicyNo,
                    PolicyExpiry: val?.PolicyExpiry,
                    ...(showDocumentUpload
                        ? {
                            Document: (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-info text-white"
                                    title={t("Upload Patient Document")}
                                    onClick={() => setUploadPanel(val)}
                                >
                                    <i className="fa fa-upload" />
                                </button>
                            ),
                        }
                        : {}),
                }))}
            />
            {uploadPanel && (
                <AttachDoumentModal
                    isuploadOpen={!!uploadPanel}
                    setIsuploadOpen={(open) => !open && setUploadPanel(null)}
                    isCalender={true}
                    values={{}}
                    modelHeader={t("Upload Patient Document")}
                    allowMultipleFiles
                    handleAPI={saveDocuments}
                />
            )}
        </div>
    )
}

export default PanelDetailsTable
