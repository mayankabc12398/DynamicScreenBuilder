import React, { useState, useEffect, useRef } from "react";
import "./Chatbot.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { ChatBotAIAPI } from "../../networkServices/chatAPI";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { formatCurrency, notify } from "../../utils/ustil2";
import moment from "moment";
import {
  GetBindDoctorDept,
  GetBindLabInvestigationRate,
  GetDoctorAppointmentTimeSlotConsecutive,
  GetLoadOPD_All_ItemsLabAutoComplete,
  PatientSearchbyBarcode,
  ReceiptDetailnew,
} from "../../networkServices/opdserviceAPI";
import { handleModifiedDoctorSlotData } from "../../utils/utils";
import {
  BindRoomBed,
  CommonReceiptPdf,
} from "../../networkServices/BillingsApi";
import { RedirectURL } from "../../networkServices/PDFURL";
import {
  chatbotAIPayload,
  geRoomAvlBot,
  getDoctorAvailability,
  getDoctorDepListBot,
  getLabTestDetail,
  getNomatchDetails,
  getPatientPanelList,
  getPatientReceiptDetails,
  getTextForReport,
} from "./chatbotfunctons";
import { getBindPanelList } from "../../store/reducers/common/CommonExportFunction";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { withAiFeature } from "@app/utils/aiSettings";
import { useTranslation } from "react-i18next";

const Chatbot = () => {
  const [t] = useTranslation();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const containerRef = useRef(null);
  const dispatch = useDispatch();
  const { getBindPanelListData } = useSelector((state) => state.CommonSlice);
  useEffect(() => {
    if (getBindPanelListData?.length === 0) {
      dispatch(getBindPanelList({ PanelGroup: "ALL" }));
    }
  }, []);

  const userData = useLocalStorage("userData", "get");

  const [messages, setMessages] = useState([
    {
      text: "Welcome to your <strong>Health Assistant</strong>!",
      sender: "bot",
      isHTML: true,
    },
    {
      text: `Hey! 😊 I’m here to help with:<br>🔬 Lab tests & checkup packages<br>💰 Pricing & discounts<br>🏥 Doctor appointments & availability<br> If you have any questions or need more info, just let me know — I’m here to help!`,
      sender: "bot",
      isHTML: true,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Scroll to the bottom of the chat body whenever messages change
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // Auto-focus the input field when the chatbot is open
    if (isChatbotOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatbotOpen]);

  const handleClickGetMessageInfo = async (e) => {
    if (e.target.id && e.target.id.startsWith("booking-btn_")) {
      const id = e.target.id.split("_")[1]; // extract id
      const drName = e.target?.getAttribute("data-name");
      const drDept = e.target?.getAttribute("data-department");
      const newMessages = [
        ...messages,
        {
          text: `I want to view doctor availability and Consultaion Fee of <strong> ${drName} </strong>`,
          sender: "user",
          animated: true,
          isHTML: true,
        },
      ];
      setMessages(newMessages);
      const enqPayload = {
        searchType: 1,
        prefix: drName?.split("DR. ")[1],
        type: "100",
        categoryID: "0",
        subCategoryID: "0",
        itemID: "",
        doctorID: "",
        PanelID: 1,
      };
      const getenquiry = await GetLoadOPD_All_ItemsLabAutoComplete(enqPayload);
      let itemId;
      if (getenquiry?.success) {
        itemId = getenquiry?.data[0]?.item_ID;
      }
      // debugger
      const data = await GetBindLabInvestigationRate(
        1,
        String(itemId),
        "1",
        2,
        "",
        "",
        "1"
      );
      const apiResponse = await GetDoctorAppointmentTimeSlotConsecutive(
        id,
        moment(new Date(new Date().setDate(new Date().getDate() + 1))).format(
          "YYYY-MM-DD"
        )
      );
      let slot = "";
      if (apiResponse?.success) {
        const modifiedData = handleModifiedDoctorSlotData(
          apiResponse?.data?.filter((val) => val?.DoctorStatus === "Available"),
          "ShiftName",
          "SlotGroupTime"
        );
        Object.keys(modifiedData)?.map((val) => {
          slot += `${val} at <strong> ${Object.keys(modifiedData[val])?.join(",")}</strong>`;
        });
      }
      if (data?.success) {
        const botResponse = {
          text: `🩺 <strong> Doctor Consultation Fee </strong>: <br/>
                 Doctor Name: <strong>${drName}</strong> <br/>
                 Specialization: <strong>${drDept}</strong> <br/>
                 💵 Consultation Fee: <strong>${formatCurrency(data?.data?.Rate, userData?.centreCurrency ? userData?.centreCurrency : "INR")}</strong> <br/>
                 📅 Available for Consultation: ${slot ? slot : "<strong>Slot is not available !!</strong>"} <br/>`,
          sender: "bot",
          animated: true,
          isHTML: true,
        };
        setMessages((prevMessages) => [...prevMessages, botResponse]);
      } else {
        const botResponse = {
          text: `🩺 We are currently unable to retrieve the consultation fee for <strong>${drName} </strong> due to a technical issue. Kindly visit our hospital for further assistance. <br/>`,
          sender: "bot",
          animated: true,
          isHTML: true,
        };
        setMessages((prevMessages) => [...prevMessages, botResponse]);
      }
    } else if (e.target.id && e.target.id.startsWith("report-btn_")) {
      const id = e.target.id.split("_")[1];
      const reportResp = await CommonReceiptPdf({
        ledgerTransactionNo: "1929",
        isBill: 1,
        transactionID: String(id),
        receiptNo: "",
        duplicate: "",
        type: "OPD",
        supplierID: "",
        billNo: "",
        isEMGBilling: "",
        isOnlinePrint: "",
        isRefound: 0,
      });

      if (reportResp?.success) {
        RedirectURL(reportResp?.data?.pdfUrl);
      } else {
        notify(reportResp?.data?.message, "error");
      }
    } else if (e.target.id && e.target.id.startsWith("deparment-btn_")) {
      const id = e.target.id.split("_")[1];
      const drDept = e.target?.getAttribute("data-department");

      const newMessages = [
        ...messages,
        {
          text: `I would like to view the doctors in the <strong> ${drDept} </strong> department`,
          sender: "user",
          animated: true,
          isHTML: true,
        },
      ];
      setMessages(newMessages);

      console.log("Asdasd", id, drDept);
      const botResponse = await getDoctorAvailability(drDept, id);
      setMessages((prevMessages) => [...prevMessages, botResponse]);
    } else if (e.target.id && e.target.id.startsWith("bed-btn_")) {
      const id = e.target.id.split("_")[1];
      const roomname = e.target?.getAttribute("data-room");
      const newMessages = [
        ...messages,
        {
          text: `I would like to view the available bed in the  <strong> ${roomname} </strong> room`,
          sender: "user",
          animated: true,
          isHTML: true,
        },
      ];
      setMessages(newMessages);

      const avlbedPayload = {
        caseType: id,
        isDisIntimated: 0,
        type: "1",
        bookingDate: moment(new Date()).format("YYYY-MM-DD"),
      };
      const avlbed = await BindRoomBed(avlbedPayload);
      let text = `<strong> <i>I’ve found ${avlbed?.data?.length} bed of <strong>${roomname}</strong> room. Below is the list of hospital beds for your reference:</i></strong> <br/><br/>`;
      if (avlbed?.success) {
        avlbed?.data?.map((item, index) => {
          text += `<strong > ${index + 1}. <i class="fa fa-bed" > ${item?.Name}</i> </strong> <br/> <hr/>`;
        });
      } else {
        text = "Bed Not Availabe Today!!";
      }
      // debugger
      const newmessages = {
        text: text,
        sender: "bot",
        animated: true,
        isHTML: true,
      };
      setMessages((val) => [...val, newmessages]);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      const newMessages = [
        ...messages,
        { text: inputValue, sender: "user", animated: true },
      ];
      setMessages(newMessages);
      setInputValue("");
      setIsTyping(true);

      const apiResp = await ChatBotAIAPI(chatbotAIPayload(inputValue.trim()));
      let [name, value] = apiResp?.data?.split(":");
      value = value?.trim();

      if (!apiResp?.success) {
        notify(apiResp?.messages, "error");
        return;
      }
      // debugger
      if (name === "TestName") {
        const botResponse = await getLabTestDetail(value);
        setMessages((prevMessages) => [...prevMessages, botResponse]);
      } else if (name === "availability") {
        const botResponse = await getDoctorAvailability(value);
        setMessages((prevMessages) => [...prevMessages, botResponse]);
      } else if (apiResp?.data === "Report") {
        const botResponse = getTextForReport(value);
        setMessages((prevMessages) => [...prevMessages, botResponse]);
      } else if (name === "patientID") {
        const botResponse = await getPatientReceiptDetails(value);
        setMessages((prevMessages) => [...prevMessages, botResponse]);
      } else if (apiResp?.data === "panel" || name?.trim() === "panel") {
        const botResponse = getPatientPanelList(value, getBindPanelListData);
        setMessages((prevMessages) => [...prevMessages, botResponse]);
      } else if (
        apiResp?.data === "panelName" ||
        name?.trim() === "panelName"
      ) {
        const botResponse = getPatientPanelList(value, getBindPanelListData);
        setMessages((prevMessages) => [...prevMessages, botResponse]);
      } else if (apiResp?.data === "department" || name === "department") {
        const botResponse = await getDoctorDepListBot();
        setMessages((prevMessages) => [...prevMessages, botResponse]);
      } else if (apiResp?.data === "room" || name === "room") {
        const botResponse = await geRoomAvlBot();
        setMessages((prevMessages) => [...prevMessages, botResponse]);
      } else if (apiResp?.data === "NO_MATCH") {
        const botResponse = getNomatchDetails(value);
        setMessages((prevMessages) => [...prevMessages, botResponse]);
      }
      setIsTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCloseChatbot = () => {
    setIsChatbotOpen(false);
  };

  const handleOpenChatbot = () => {
    setIsChatbotOpen(true);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  if (!isChatbotOpen) {
    return (
      <>
        <div className="pat_chatbot_fab" onClick={handleOpenChatbot}>
          <i className="bi bi-chat-text-fill"></i>
        </div>
      </>
    );
  }

  return (
    <div className="pat_chatbot_container">
      <div className="pat_chatbot_header">
        <div className="pat_chatbot_header_left">
          <div className="pat_chatbot_logo">
            <i className="bi bi-heart-pulse-fill"></i>
          </div>
          <div className="pat_chatbot_title">{t("Health Assistant")}</div>
        </div>
        <div className="pat_chatbot_header_right" onClick={handleCloseChatbot}>
          <i className="bi bi-x-lg"></i>
        </div>
      </div>
      <div
        className="pat_chatbot_body"
        onClick={handleClickGetMessageInfo}
        ref={chatBodyRef}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`pat_chatbot_message ${msg?.sender === "bot" ? "pat_chatbot_message_left" : "pat_chatbot_message_right"} ${msg?.animated ? "pat_chatbot_message_animated" : ""}`}
          >
            {msg?.isHTML ? (
              <span dangerouslySetInnerHTML={{ __html: msg?.text }} />
            ) : (
              msg?.text
            )}
          </div>
        ))}
        {isTyping && (
          <div className="pat_chatbot_message pat_chatbot_message_left">
            <div className="pat_typing_indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>
      
      <div className="pat_chatbot_footer">
        <div className="pat_chatbot_input_container">
          <textarea
            ref={inputRef}
            className="pat_chatbot_input"
            placeholder={t("Type your message...")}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            rows={1}
          />
          {/* <i className="bi bi-mic-fill"></i> */}
          {/* <button className="pat_chatbot_send_button" onClick={handleSendMessage}> */}
          <i
            className="bi bi-send-fill cursor-pointer"
            onClick={handleSendMessage}
          ></i>
          {/* </button> */}
        </div>
      </div>
    </div>
  );
};

export default withAiFeature("chatbot", Chatbot);
