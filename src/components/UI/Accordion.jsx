import React, { useEffect, useRef, useState } from "react";
import "./Accordion.css";
import Heading from "./Heading";

const Accordion = ({ title, children, defaultValue, isBreadcrumb, secondTitle }) => {
  const [isOpen, setIsOpen] = useState(defaultValue);
  const cardRef = useRef(null);

  const storageKey = `cardFieldMinW:${title || "card"}`;
  const [fieldMinW] = useState(
    () => Number(localStorage.getItem(storageKey)) || 165
  );

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.setProperty("--field-min-w", `${fieldMinW}px`);
    }
  }, [fieldMinW]);

  const toggleAccordion = () => setIsOpen(!isOpen);

  return (
    <div
      ref={cardRef}
      className={`card patient_registration_card ${isOpen ? "open" : ""}`}
      style={{ "--field-min-w": `${fieldMinW}px` }}
    >
      <Heading
        title={title}
        onClick={toggleAccordion}
        isBreadcrumb={isBreadcrumb}
        secondTitle={secondTitle}
      />
      <div className={`collapse ${isOpen ? "show" : ""}`}>{children}</div>
    </div>
  );
};

export default Accordion;
