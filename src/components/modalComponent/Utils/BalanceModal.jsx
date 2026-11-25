import React, { Fragment } from "react";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { useTranslation } from "react-i18next";

function BalanceModal({ balanceData }) {
  const [t] = useTranslation();
  // Get balances array (handle different data structures)
  const balances = balanceData?.data || balanceData?.balances || [];

  // Define gradient + accent mapping for different balance/transaction types
  const getTypeTheme = (type) => {
    const themeMap = {
      OPD: { from: "#6366F1", to: "#8B5CF6", soft: "#EEF0FF" },
      IPD: { from: "#0EA5E9", to: "#06B6D4", soft: "#E6F8FF" },
      DEPOSIT: { from: "#10B981", to: "#059669", soft: "#E7FBF2" },
      WITHDRAWAL: { from: "#EF4444", to: "#DC2626", soft: "#FEECEC" },
      TRANSFER: { from: "#3B82F6", to: "#2563EB", soft: "#E8F0FE" },
      PURCHASE: { from: "#F59E0B", to: "#D97706", soft: "#FEF4E2" },
      REFUND: { from: "#8B5CF6", to: "#7C3AED", soft: "#F1ECFE" },
      FEE: { from: "#6B7280", to: "#4B5563", soft: "#F1F2F4" },
      INTEREST: { from: "#06B6D4", to: "#0891B2", soft: "#E5F9FC" },
      BONUS: { from: "#EC4899", to: "#DB2777", soft: "#FDEAF4" },
    };
    return themeMap[type?.toUpperCase()] || { from: "#6366F1", to: "#8B5CF6", soft: "#EEF0FF" };
  };

  // Get icon based on transaction/balance type
  const getTypeIcon = (type) => {
    const iconMap = {
      OPD: "🩺",
      IPD: "🛏️",
      DEPOSIT: "💰",
      WITHDRAWAL: "💸",
      TRANSFER: "🔄",
      PURCHASE: "🛒",
      REFUND: "↩️",
      FEE: "⚡",
      INTEREST: "📈",
      BONUS: "🎁",
    };
    return iconMap[type?.toUpperCase()] || "💳";
  };

  // Format currency display
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "—";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return amount;

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  // A patient's outstanding can sit in more than one currency: bills raised before
  // the centre changed currency, or a panel that bills in its own. Amounts in
  // different currencies must never be added together, so they are grouped by
  // currency and each group is totalled on its own. A row that carries no currency
  // of its own is attributed to the centre's, which is what the flow bills in.
  const centreCurrency = useLocalStorage("userData", "get")?.centreCurrency;

  const readAmount = (itm) => {
    const raw = itm?.Balance ?? itm?.balance ?? itm?.amount ?? 0;
    const amount = typeof raw === "string" ? parseFloat(raw) : raw;
    return isNaN(amount) ? 0 : amount;
  };

  const readCurrency = (itm) =>
    String(itm?.BillCurrency || itm?.currency || centreCurrency || "").trim();

  // Built in the order the API returned, so a patient whose balances are all in
  // one currency renders exactly as before -- a single total and a flat card list.
  const currencyGroups = balances.reduce((groups, itm) => {
    const currency = readCurrency(itm);
    let group = groups.find((grp) => grp.currency === currency);
    if (!group) {
      group = { currency, total: 0, items: [] };
      groups.push(group);
    }
    group.total += readAmount(itm);
    group.items.push(itm);
    return groups;
  }, []);

  const isMultiCurrency = currencyGroups.length > 1;

  if (!balances || balances.length === 0) {
    return (
      <div className="balance-empty">
        <div className="balance-empty-icon">📊</div>
        <p className="balance-empty-text">{t("No balance data available")}</p>
      </div>
    );
  }

  return (
    <div className="balance-modal">
      {/* Total summary -- one line per currency, never a mixed-currency sum */}
      <div className="balance-summary">
        <div className="balance-summary-glow" />
        <span className="balance-summary-label">{t("Total Outstanding")}</span>
        {isMultiCurrency ? (
          <div className="balance-summary-split">
            {currencyGroups.map((group) => (
              <div
                className="balance-summary-split-row"
                key={group.currency || "unknown"}
              >
                {formatCurrency(group.total)}
                {group.currency && (
                  <span className="balance-summary-currency">
                    {group.currency}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="balance-summary-amount">
            {formatCurrency(currencyGroups[0]?.total ?? 0)}
            {currencyGroups[0]?.currency && (
              <span className="balance-summary-currency">
                {currencyGroups[0]?.currency}
              </span>
            )}
          </div>
        )}
        <span className="balance-summary-count">
          {balances.length} {t("account")}{balances.length > 1 ? "s" : ""}
          {isMultiCurrency ? ` across ${currencyGroups.length} currencies` : ""}
        </span>
      </div>

      {/* Balance cards, grouped under their currency when there is more than one */}
      <div className="balance-cards-container">
        {currencyGroups.map((group) => (
          <Fragment key={group.currency || "unknown"}>
            {isMultiCurrency && (
              <div className="balance-currency-heading">
                <span className="balance-currency-heading-name">
                  {group.currency || t("No currency")}
                </span>
                <span className="balance-currency-heading-total">
                  {formatCurrency(group.total)}
                </span>
              </div>
            )}

            {group.items.map((itm, idx) => {
              const type = itm?.TYPE || itm?.type || "BALANCE";
              const balance = readAmount(itm);
              const currency = group.currency;
              const theme = getTypeTheme(type);

              return (
                <div
                  key={`${group.currency}-${idx}`}
                  className="balance-card"
                  style={{
                    "--from": theme.from,
                    "--to": theme.to,
                    "--soft": theme.soft,
                    animationDelay: `${idx * 0.07}s`,
                  }}
                >
                  <div className="balance-card-icon">
                    <span>{getTypeIcon(type)}</span>
                  </div>

                  <div className="balance-card-content">
                    <span className="type-badge">{type}</span>
                    <div className="balance-card-amount">
                      <span className="amount-value">
                        {formatCurrency(balance)}
                      </span>
                      {currency && (
                        <span className="amount-currency">{currency}</span>
                      )}
                    </div>
                  </div>

                  <div className="balance-card-arrow">›</div>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      <style jsx>{`
        .balance-modal {
          padding: 0.25rem 0.15rem 0.5rem;
        }

        /* ---------- Total Summary ---------- */
        .balance-summary {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.1rem;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #9333ea 100%);
          box-shadow: 0 10px 24px -8px rgba(79, 70, 229, 0.55);
          color: #fff;
        }

        .balance-summary-glow {
          position: absolute;
          top: -40%;
          right: -10%;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.28), transparent 70%);
          pointer-events: none;
        }

        .balance-summary-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          opacity: 0.85;
        }

        .balance-summary-amount {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-top: 0.3rem;
          font-size: 2.1rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }

        .balance-summary-currency {
          font-size: 0.95rem;
          font-weight: 700;
          padding: 0.15rem 0.55rem;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(4px);
        }

        .balance-summary-count {
          display: inline-block;
          margin-top: 0.55rem;
          font-size: 0.72rem;
          font-weight: 600;
          opacity: 0.85;
        }

        /* ---------- Cards Container ---------- */
        .balance-cards-container {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          max-height: 360px;
          overflow-y: auto;
          padding: 0.15rem 0.35rem 0.15rem 0.15rem;
        }

        .balance-cards-container::-webkit-scrollbar {
          width: 5px;
        }
        .balance-cards-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .balance-cards-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .balance-cards-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* ---------- Individual Card ---------- */
        .balance-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem 1rem;
          background: #fff;
          border: 1px solid #eef1f6;
          border-radius: 16px;
          box-shadow: 0 4px 14px -10px rgba(15, 23, 42, 0.4);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 0.25s ease, border-color 0.25s ease;
          animation: cardIn 0.4s ease-out both;
          overflow: hidden;
        }

        .balance-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 5px;
          background: linear-gradient(180deg, var(--from), var(--to));
        }

        .balance-card:hover {
          transform: translateY(-2px);
          border-color: transparent;
          box-shadow: 0 14px 28px -14px rgba(15, 23, 42, 0.45);
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Card Icon */
        .balance-card-icon {
          width: 60px;
          height: 60px;
          flex-shrink: 0;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.9rem;
          background: var(--soft);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.03);
        }

        /* Card Content */
        .balance-card-content {
          flex: 1;
          min-width: 0;
        }

        .type-badge {
          display: inline-block;
          padding: 0.2rem 0.7rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: #fff;
          text-transform: uppercase;
          background: linear-gradient(135deg, var(--from), var(--to));
        }

        .balance-card-amount {
          display: flex;
          align-items: baseline;
          gap: 0.45rem;
          flex-wrap: wrap;
          margin-top: 0.45rem;
        }

        .amount-value {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .amount-currency {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          background: #f1f5f9;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
        }

        .balance-card-arrow {
          font-size: 1.5rem;
          font-weight: 700;
          color: #cbd5e1;
          flex-shrink: 0;
          transition: color 0.25s ease, transform 0.25s ease;
        }

        .balance-card:hover .balance-card-arrow {
          color: var(--from);
          transform: translateX(3px);
        }

        /* ---------- Multi-currency ---------- */
        .balance-summary-split {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          margin-top: 0.3rem;
        }

        .balance-summary-split-row {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.15;
        }

        .balance-currency-heading {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.5rem;
          margin: 0.35rem 0.15rem -0.15rem;
          padding-bottom: 0.3rem;
          border-bottom: 1px solid #e8edf5;
        }

        .balance-currency-heading-name {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #64748b;
        }

        .balance-currency-heading-total {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
        }

        /* ---------- Empty State ---------- */
        .balance-empty {
          text-align: center;
          padding: 2.5rem 1rem;
        }
        .balance-empty-icon {
          font-size: 3.5rem;
          margin-bottom: 0.75rem;
          opacity: 0.7;
        }
        .balance-empty-text {
          color: #94a3b8;
          font-size: 1rem;
          font-weight: 500;
        }

        /* ---------- Responsive ---------- */
        @media (max-width: 640px) {
          .balance-summary {
            padding: 1rem 1.15rem;
          }
          .balance-summary-amount {
            font-size: 1.65rem;
          }
          .balance-summary-split-row {
            font-size: 1.25rem;
          }
          .balance-card {
            gap: 0.8rem;
            padding: 0.8rem;
          }
          .balance-card-icon {
            width: 50px;
            height: 50px;
            font-size: 1.55rem;
            border-radius: 13px;
          }
          .amount-value {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}

export default BalanceModal;
