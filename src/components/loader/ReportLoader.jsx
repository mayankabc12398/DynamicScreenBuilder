"use client";

import { useState, useEffect } from "react";
import "./report-loader.css";
import { useLocation } from "react-router-dom";
import { RedirectURL } from "../../networkServices/PDFURL";
import { useTranslation } from "react-i18next";

function Card({ className = "", children, ...props }) {
  return (
    <div className={`report-loader-card-base ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardHeader({ className = "", children, ...props }) {
  return (
    <div
      className={`report-loader-card-header-wrapper ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function CardTitle({ className = "", children, ...props }) {
  return (
    <div className={`report-loader-card-title-text ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`report-loader-card-content-area ${className}`} {...props}>
      {children}
    </div>
  );
}

function Progress({ className = "", value = 0, ...props }) {
  return (
    <div className={`report-loader-progress-track ${className}`} {...props}>
      <div
        className="report-loader-progress-fill"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </div>
  );
}

export default function ReportLoader({ onComplete }) {
  const [t] = useTranslation();
  const query = new URLSearchParams(useLocation().search);
  const reportUrl = query.get("url");

  const [progress, setProgress] = useState(0);
  if (progress === 100) {
    RedirectURL(reportUrl);
  }
  const [currentMessage, setCurrentMessage] = useState("");

  const messages = [
    "Initializing report generation...",
    "10 rows fetched",
    "20 rows fetched",
    "30 rows fetched",
    "40 rows fetched",
    "50 rows fetched",
    "60 rows fetched",
    "70 rows fetched",
    "80 rows fetched",
    "90 rows fetched",
    "100 rows fetched",
    "110 rows fetched",
    "120 rows fetched",
    "Report completed!",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 100 / (messages.length - 1);

        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete?.();
          }, 1000);
          return 100;
        }

        return newProgress;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [onComplete, messages.length]);

  useEffect(() => {
    const messageIndex = Math.min(
      Math.floor((progress / 100) * (messages.length - 1)),
      messages.length - 1
    );
    setCurrentMessage(messages[messageIndex]);
  }, [progress, messages]);

  return (
    <div className="report-loader-main-container">
      <div className="report-loader-background-overlay"></div>
      <Card className="report-loader-primary-card">
        <CardHeader>
          <CardTitle>
            <div className="report-loader-title-icon">📊</div>
            {t("Generating Your Report")}
          </CardTitle>
          <div className="report-loader-subtitle">
            {t("Please wait while we process your data...")}
          </div>
        </CardHeader>
        <CardContent>
          <div className="report-loader-progress-wrapper">
            <Progress
              value={progress}
              className="report-loader-main-progress-bar"
            />
            <div className="report-loader-percentage-display">
              {Math.round(progress)}%
            </div>
          </div>

          <div className="report-loader-status-message-container">
            <div className="report-loader-status-icon">⚡</div>
            <div className="report-loader-message-text">{currentMessage}</div>
          </div>

          <div className="report-loader-animated-dots-container">
            <div className="report-loader-dot-one"></div>
            <div className="report-loader-dot-two"></div>
            <div className="report-loader-dot-three"></div>
          </div>

          {/* <div className="report-loader-stats-grid">
            <div className="report-loader-stat-item">
              <div className="report-loader-stat-value">{Math.round(progress * 1.2)}</div>
              <div className="report-loader-stat-label">Rows Processed</div>
            </div>
            <div className="report-loader-stat-item">
              <div className="report-loader-stat-value">{Math.round(progress / 10)}</div>
              <div className="report-loader-stat-label">Seconds Elapsed</div>
            </div>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
