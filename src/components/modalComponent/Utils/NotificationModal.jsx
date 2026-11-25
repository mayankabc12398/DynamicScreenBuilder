import { useTranslation } from "react-i18next";

export default function NotificationModal({ messages }) {
    const [t] = useTranslation();
    return (
        <div className="row p-2 d-flex justify-content-center">
            <h2 style={{ fontWeight: "bold" }}>{t(messages ? messages : "All Data Notifications")}</h2>
        </div>
    )
}