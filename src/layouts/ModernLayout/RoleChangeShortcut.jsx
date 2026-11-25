import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import RoleChangeModal from "@app/layouts/header/role-change-modal/RoleChangeModal";
import {
  GetBindMenu,
  GetRoleListByEmployeeIDAndCentreID,
} from "@app/store/reducers/common/CommonExportFunction";
import { updateClaims } from "@app/networkServices/HeaderApi";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { broadcastSessionChange } from "@app/utils/tabSync";

/**
 * Modern-view only: Ctrl/Cmd + D opens the Change Role modal.
 * Mirrors SidebarRoleSwitch's claim/menu-refresh flow so role switching
 * behaves identically to the sidebar tile.
 */
export default function RoleChangeShortcut() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const localData = useLocalStorage("userData", "get") || {};
  const { GetRoleList } = useSelector((s) => s?.CommonSlice || {});

  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const openPicker = useCallback(() => {
    if (!GetRoleList?.length && localData?.employeeID) {
      dispatch(
        GetRoleListByEmployeeIDAndCentreID({
          employeeID: localData.employeeID,
          centreID: localData.defaultCentre,
        })
      );
    }
    setOpen(true);
  }, [dispatch, GetRoleList, localData]);

  // Ctrl/Cmd + D → toggle Change Role modal
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        if (openRef.current) setOpen(false);
        else openPicker();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPicker]);

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

  return createPortal(
    <RoleChangeModal
      show={open}
      GetRoleList={GetRoleList}
      onClose={() => setOpen(false)}
      onRoleSelect={handleRoleSelect}
    />,
    document.body
  );
}
