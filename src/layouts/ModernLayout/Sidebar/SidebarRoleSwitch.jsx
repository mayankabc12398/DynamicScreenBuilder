import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { UserCog } from "lucide-react";
import SidebarTip, { makeTip } from "./SidebarTip";

import RoleChangeModal from "@app/layouts/header/role-change-modal/RoleChangeModal";
import {
  GetBindMenu,
  GetRoleListByEmployeeIDAndCentreID,
} from "@app/store/reducers/common/CommonExportFunction";
import { updateClaims } from "@app/networkServices/HeaderApi";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { useTheme } from "@app/hooks/useTheme";
import { broadcastSessionChange } from "@app/utils/tabSync";

export default function SidebarRoleSwitch({ collapsed, compact }) {
  const iconOnly = collapsed || compact;
  const btnRef = useRef(null);
  const [tip, setTip] = useState(null);

  const showTip = () => {
    setTip(makeTip(btnRef.current, tipContent, { placement: "side" }));
  };
  const { theme } = useTheme();
  const c = theme.colors;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const localData = useLocalStorage("userData", "get") || {};
  const { GetRoleList } = useSelector((s) => s?.CommonSlice || {});
  const [open, setOpen] = useState(false);

  const openPicker = () => {
    if (!GetRoleList?.length && localData?.employeeID) {
      dispatch(
        GetRoleListByEmployeeIDAndCentreID({
          employeeID: localData.employeeID,
          centreID: localData.defaultCentre,
        })
      );
    }
    setOpen(true);
  };

  // same claim/menu refresh flow as HeaderActionsPanel's Change Role tile
  const handleRoleSelect = useCallback(
    async (role) => {
      const value = role?.roleID;
      if (value === undefined || value === null) return;
      try {
        const data = await updateClaims(
          String(value),
          String(localData?.defaultCentre)
        );
        if (data?.success) {
          const {
            centreCurrency,
            centreID,
            centreName,
            defaultCentre,
            roleName,
            defaultRole,
            isStore,
          } = data?.data?.loginResponse;
          await useLocalStorage("userData", "set", {
            ...localData,
            centreCurrency,
            centreID,
            centreName,
            defaultCentre,
            roleName,
            defaultRole,
            isStore,
          });
          useLocalStorage("token", "set", data?.data?.token);
        }
        await dispatch(GetBindMenu({ RoleID: value }));
        useLocalStorage("userData", "set", {
          ...localData,
          defaultRole: value,
          roleName: data?.data?.loginResponse?.roleName,
        });
        if (data?.success) broadcastSessionChange("ROLE_CHANGED");
        navigate("/dashboard", { state: { data: "", actualUrl: "/dashboard" } });
      } catch (err) {
        console.error("Error occurred:", err);
      }
      setOpen(false);
    },
    [dispatch, navigate, localData]
  );

  const tipContent = (
    <>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: 0.3,
        }}
      >
        <UserCog size={12} style={{ color: c.accent }} />
        Change Role
      </span>
      {localData?.roleName && (
        <span
          style={{
            marginTop: 2,
            fontSize: 10,
            fontWeight: 600,
            color: "rgba(255,255,255,.65)",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: c.accent,
              boxShadow: `0 0 6px ${c.accent}`,
              flexShrink: 0,
            }}
          />
          Current: {localData.roleName}
        </span>
      )}
    </>
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          setTip(null);
          openPicker();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          width: compact && !collapsed ? 48 : "100%",
          alignSelf: "stretch",
          padding: iconOnly ? "6px 0" : "7px 10px",
          borderRadius: 10,
          border: `1px solid ${c.accent}33`,
          // background: c.accentSoft,
          color: c.text,
          cursor: "pointer",
          fontFamily: "inherit",
          justifyContent: iconOnly ? "center" : "flex-start",
          textAlign: "left",
          flexShrink: 0,
          transition: "background .2s, border-color .2s, box-shadow .2s",
        }}
        className="background-theme-colornew"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = c.accent + "1f";
          e.currentTarget.style.borderColor = c.accent + "66";
          e.currentTarget.style.boxShadow = `0 4px 14px -8px ${c.accent}`;
          showTip();
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = c.accentSoft;
          e.currentTarget.style.borderColor = c.accent + "33";
          e.currentTarget.style.boxShadow = "none";
          setTip(null);
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            // background: c.headerGradient,
            color: "#fff",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            boxShadow: `0 4px 10px -4px ${c.accent}`,
          }}
          className="datepicker-bgnew"
        >
          <UserCog size={15} />
        </span>
        {!iconOnly && (
          <span style={{ lineHeight: 1.15, flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: 11.5,
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Change Role
            </span>
            <span
              style={{
                display: "block",
                fontSize: 9.5,
                color: c.textMuted,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {localData?.roleName || "Switch your role"}
            </span>
          </span>
        )}
      </button>

      <SidebarTip tip={tip} />

      {createPortal(
        <RoleChangeModal
          show={open}
          GetRoleList={GetRoleList}
          onClose={() => setOpen(false)}
          onRoleSelect={handleRoleSelect}
        />,
        document.body
      )}
    </>
  );
}
