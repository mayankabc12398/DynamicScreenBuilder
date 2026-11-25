import moment from "moment";
import { GetBindDoctorDept, GetLoadOPD_All_ItemsLabAutoComplete, ReceiptDetailnew } from "../../networkServices/opdserviceAPI"
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { formatCurrency } from "../../utils/ustil2"
import { GetDepartment, RoomType } from "../../networkServices/BillingsApi";

const userData = useLocalStorage("userData", "get");

// Function to calculate similarity percentage between two strings
function getSimilarity(str1, str2) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;

    const editDistance = levenshteinDistance(longer, shorter);
    return ((longerLength - editDistance) / longerLength);
}
// Levenshtein Distance algorithm
function levenshteinDistance(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}


export const chatbotAIPayload = (inputValue) => {
    return {
        "data": `From user input, extract intent and return in this format only:
         - If about a test or package → TestName:TESTNAME (e.g., complete blood count→CBC).
         - If about doctor availability OR If the user asks about their symptoms or describes symptoms/problems related to an illness that map to a department → availability:DEPARTMENT.
         - If about patient receipt or bill or histroy → Report.
         - If about patient id like similar MOH/25/0000262 → patientID:MOH/25/0000262.
         - If about panel, health insurance, or scheme present → panel
         - If about panel name, health insurance name, or scheme present name → panelName:name (e.g., panelName:XYZ Health Insurance).
         - If the user asks about pricing, doctors, or departments OR Asking about doctors → department.
         - If the user inquires about room availability for the patient → room.
         - If nothing relevant → NO_MATCH.
         Normalize to standard forms (e.g., complete blood count→CBC, liver function test→LFT, kidney test→KFT, thyroid profile, diabetes package). Output must be exactly in the format above, nothing else. User:`,
        "prompt": inputValue,
        "temperature": 0.7,
        "max_tokens": 300
    }
}

export const getLabTestDetail = async (value) => {
    const enqPayload = {
        "searchType": 1,
        "prefix": value,
        "type": "100",
        "categoryID": "0",
        "subCategoryID": "0",
        "itemID": "",
        "doctorID": "",
        "PanelID": 1
    }
    let text = ""
    const getenquiry = await GetLoadOPD_All_ItemsLabAutoComplete(enqPayload)
    if (getenquiry?.success) {
        if (getenquiry?.data?.length === 0) {
            text = `I'm sorry, I couldn't find any tests or packages matching your request. Could you please provide more details or specify a different test?`
        } else {
            getenquiry?.data?.forEach(item => {
                text += `💉 <strong>Test Details:</strong> <br/>
                    Test Name: <strong>${item?.typeName}</strong><br/>
                    Category: <strong>${item?.SubCategory}</strong><br/>
                    Rate: <strong>${formatCurrency(item?.Rate, userData?.centreCurrency)}</strong> <br/>
                   
                   📌 This test helps evaluate your overall health and detect a wide range of disorders.
                   <hr/>`
            })
            //  Tax: ${item?.SalesTaxGroupName} <strong>${item?.SaleTaxPercentage ? item?.SaleTaxPercentage : 0}%</strong><br/> 
            // text += `<span >✅ Would you like me to proceed with booking this Consultation for you?</span>`
        }

    } else {
        text = `I'm sorry, I couldn't find any tests or packages matching your request. Could you please provide more details or specify a different test?`
    }
    return {
        text: text,
        sender: 'bot',
        animated: true,
        isHTML: true
    };
}

export const getDoctorDepListBot = async (dept = "") => {
    let apiResp = await GetDepartment()
    let text = ""
    if (apiResp?.success) {
        let list = apiResp?.data.filter(obj => getSimilarity(obj.Name, dept) >= 0.5)
        if (dept === "") {
            list = apiResp?.data
        }
        if (list?.length === 0) {
            text = `<strong> <i>I'm sorry, I couldn't find any department matching your request. However, here is the list of all available departments. Please select one that best fits your needs:</i></strong> <br/><br/>`
            list = apiResp?.data
        } else {
            text = `<strong> <i> Your request has been processed; ${list?.length} departments have been identified. Below is the list for your reference:</i></strong> <br/><br/>`
        }
        list?.map((item, index) => {
            text += `<strong  > <span>${index + 1}. </span>  <span class="pat_chatbot_clickable-text"> <i class="" id=${`deparment-btn_${item?.ID}`} data-department="${item?.Name}"> ${item?.Name}</i> </span></strong> <br/> <hr/>`
        })
    } else {
        text = "<strong>Departments not found!!</strong>"
    }
    return {
        text: text,
        sender: 'bot',
        animated: true,
        isHTML: true
    };
}


export const getDoctorAvailability = async (value, id) => {
    const getenquiry = await GetBindDoctorDept(value)
    let text = ""
    // debugger
    if (getenquiry?.success) {
        if (getenquiry?.data?.length === 0) {
            if (!id) {
                const departmentMessage = await getDoctorDepListBot(value)
                return departmentMessage
            } else {
                text = `I'm sorry, I couldn't find any doctor matching your request. Could you please describe your symptoms/problems?`
            }
        } else {
            getenquiry?.data?.forEach(item => {
                text += `🩺 <strong>Doctor Availability:</strong> <br/>
              <span class="pointer-cursor" > 
                Doctor Name: <strong>${item?.Name}</strong> <br/>
                Specialization: <strong>${item?.Department}</strong>
                </span>
                <br/>
             📌 <span id=${`booking-btn_${item?.DoctorID}`} data-name="${item?.Name}" data-department="${item?.Department}" class="pat_chatbot_clickable-text">Click to view consultaion fee and Applointment slot > </span>
               <hr/>`
            })

        }

    } else {
        text = `I'm sorry, I couldn't find any doctor matching your request. Could you please describe your symptoms/problems?`
    }
    return {
        text: text,
        sender: 'bot',
        animated: true,
        isHTML: true
    }
}



export const getPatientReceiptDetails = async (value) => {
    const newValues = {
        fromDate: moment(new Date(new Date().setDate(new Date().getDate() - 90))).format("DD-MMM-YYYY"),
        toDate: moment(new Date()).format("DD-MMM-YYYY"),
        receiptNo: "",
        billNo: "",
        patientName: "",
        patientID: value,
        rblCon: "1",
        PrintType: "1",
    }
    const apiRespRpt = await ReceiptDetailnew(newValues)
    let text
    if (apiRespRpt?.success) {
        text = `<strong> <i>I found ${apiRespRpt?.data?.length} bill. Please select Bill Number to access it:</i></strong> <br/><br/>`
        apiRespRpt?.data?.forEach(item => {
            text += `<strong  >   <strong class="pat_chatbot_clickable-text"> <i class="fa fa-file" id=${`report-btn_${item?.TransactionID}`}> ${item?.ReceiptNo}</i> </strong></strong> <br/> <hr/>`
        })
    } else {
        text = "Report not found!! Please check your patient Id."
    }


    return {
        text: text,
        sender: 'bot',
        animated: true,
        isHTML: true
    };
}


export const getTextForReport = () => {
    return {
        text: `To fetch your medical bill, could you please provide your Patient ID? I'll ensure you get the information promptly`,
        sender: 'bot',
        animated: true,
        isHTML: true
    }
}
export const getNomatchDetails = () => {
    return {
        text: `Hey! 😊 I’m here to help with:<br>🔬 Lab tests & checkup packages<br>💰 Pricing & discounts<br>🏥 Doctor appointments & availability<br> If you have any questions or need more info, just let me know — I’m here to help!`,
        sender: 'bot',
        animated: true,
        isHTML: true
    };
}

export const getPatientPanelList = (value, panellist) => {
    let text = ""
    if (value !== undefined) {
        panellist = panellist.filter(obj => getSimilarity(obj.Company_Name, value) >= 0.7)
    }
    text = `<strong> <i>I’ve found ${panellist?.length ? panellist?.length : 0} panels. Below is the list of hospital panes for your reference:</i></strong> <br/><br/>`

    if (panellist?.length > 0) {
        panellist?.map((item, index) => {
            text += ` <strong> ${index + 1}. <i> ${item?.Company_Name}</i></strong> <br/> <hr/>`
        })
    } else {
        text = "Panel not found!!"
    }
    return {
        text: text,
        sender: 'bot',
        animated: true,
        isHTML: true
    };
}

export const geRoomAvlBot = async () => {

    const list = await RoomType()

    let text = `<strong> <i>I’ve found ${list?.data?.length} Room Type. Below is the list of hospital rooms for your reference:</i></strong> <br/><br/>`
    // if (list?.length > 0) {
    //     list?.map((item, index) => {
    //         text += `<strong>${index + 1}</strong>. Room Type: <strong> <i> ${item?.Name}</i></strong> <br/> <hr/>`
    //     })
    // } else {
    //     text = "Panel not found!!"
    // }

    if (list?.success) {
        list?.data?.map((item, index) => {
            text += `<strong>${index + 1}. </strong> <strong class="pat_chatbot_clickable-text"> <i class="fa fa-bed" data-room="${item?.Name}" id=${`bed-btn_${item?.IPDCaseTypeID}`}> ${item?.Name}</i> </strong> <br/> <hr/>`
        })
    } else {
        text = "Room Not Availabe Today!!"
    }


    return {
        text: text,
        sender: 'bot',
        animated: true,
        isHTML: true
    }

}