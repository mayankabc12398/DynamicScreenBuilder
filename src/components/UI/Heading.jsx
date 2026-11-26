import { useContext, useEffect, useState } from "react";
import Breadcrumb from "../Breadcrumb";
import { useLocation } from "react-router-dom";
import { GetSubScreenMenuByRole } from "../../networkServices/EDP/edpApi";
import { useSelector } from "react-redux";
// Standalone builder: hospital sub-screen menu replaced by a stub.
import EDPSeeMoreList from "@app/sb/stubs/EDPSeeMoreList";
import SlideScreen from "../front-office/SlideScreen";
import SeeMoreSlideScreen from "./SeeMoreSlideScreen";
import { BindFrameMenuByRoleID } from "../../store/reducers/common/CommonExportFunction";
import { useDispatch } from "react-redux";
import { DesignContext } from "@app/providers/DesignProvider";
import AuroraHeading from "./AuroraHeading";

function Heading({
  title, onClick, secondTitle, isBreadcrumb, ReactSelectPageWise, ReactSelectPageWise1,
  removeSecondHeadAlignClass, isSlideScreen, frameName, data,
  icon, count, color, titleTag,
  searchPlaceholder, searchValue, onSearch, showSearch,
  onFilter, showFilter, actionLabel, onAction, actionIcon,secondTitleWide
}) {
  const location = useLocation();
  const { isModern } = useContext(DesignContext);

  const { GetMenuList } = useSelector((state) => state?.CommonSlice);

  const findChildByUrl = (menuArray, url) => {
    for (let menu of menuArray) {
      for (let child of menu.children) {
        if (child.url === url) {
          return child;
        }
      }
    }
    return null;
  };

  const [list, setList] = useState([]);
  const bindGetSubScreenMenuByRole = async (result, vIsFrameMenu) => {
    let apiResp = await GetSubScreenMenuByRole(result?.subMenuID, vIsFrameMenu ? vIsFrameMenu : 0);
    if (apiResp?.success) {
      setList(apiResp?.data);
    } else {
      setList([]);
    }
  };

  useEffect(() => {
    const result = findChildByUrl(GetMenuList, location?.state?.actualUrl);
    if (result?.isShowSubMenu === 1) {
      bindGetSubScreenMenuByRole(
        data?.FrameMenuID ? { subMenuID: data?.FrameMenuID } : result,
        (data === undefined || data?.vIsFrameMenu === 0) ? 0 : 1
      );
    }
  }, [data?.FrameMenuID, GetMenuList?.length]);

  const [visible, setVisible] = useState(false);
  const [seeMore, setSeeMore] = useState([]);
  const [renderComponent, setRenderComponent] = useState({ name: "", component: null });
  const handleChangeComponent = (e) => {
    ModalComponent(e?.label, e?.component);
  };
  const ModalComponent = (name, component) => {
    setVisible(true);
    setRenderComponent({ name, component });
  };
  const dispatch = useDispatch();

  const hasRight = !!secondTitle || (list?.length > 0 && isBreadcrumb);

  const slideScreen = (
    <SlideScreen
      visible={visible}
      setVisible={() => {
        setVisible(false);
        frameName ? dispatch(BindFrameMenuByRoleID({ frameName: frameName })) : "";
        setRenderComponent({ name: null, component: null });
      }}
      Header={
        <SeeMoreSlideScreen
          name={renderComponent?.name}
          seeMore={seeMore}
          handleChangeComponent={handleChangeComponent}
          isRemoveSvg={isModern}
        />
      }
    >
      {renderComponent?.component}
    </SlideScreen>
  );

  if (isModern) {
    return (
      <>
        <AuroraHeading
          className={`modern-heading ${secondTitle ? "ah-split" : ""}`}
          split={!!secondTitle}
          onClick={onClick}
          title={isBreadcrumb ? <Breadcrumb path={isSlideScreen ? title : ""} /> : title}
          icon={icon}
          count={count}
          color={color}
          titleTag={titleTag}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearch={onSearch}
          showSearch={showSearch}
          onFilter={onFilter}
          showFilter={showFilter}
          actionLabel={actionLabel}
          onAction={onAction}
          actionIcon={actionIcon}
          rightContent={
            hasRight ? (
              <div
                className="color-code-search-resp ah-rightwrap"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 0,
                  flex: "1 1 auto",
                  justifyContent: removeSecondHeadAlignClass ? "flex-start" : "flex-end",
                  padding: 0,
                }}
              >
                {secondTitle && (
                  <div
                    className="ah-scrollx"
                    style={{
                      minWidth: 0,
                      flex: "0 1 auto",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "nowrap",
                      whiteSpace: "nowrap",
                      overflowX: "auto",
                      overflowY: "hidden",
                      scrollBehavior: "smooth",
                      WebkitOverflowScrolling: "touch",
                      scrollbarWidth: "thin",
                      scrollbarColor: "#dbeafe transparent",
                    }}
                  >
                    {secondTitle}
                  </div>
                )}
                {list?.length > 0 && isBreadcrumb && (
                  <EDPSeeMoreList
                    ModalComponent={ModalComponent}
                    setSeeMore={setSeeMore}
                    data={{}}
                    asSidebar={true}
                    minWidth="280px"
                    setVisible={() => { setVisible(false); }}
                    handleBindFrameMenu={list?.map((val) => ({
                      "FileName": val?.ChildrenName,
                      "header": true,
                      "URL": val?.Url,
                      "breadcrumb": val?.breadcrumb,
                      FrameMenuID: val?.SubScreenFileMasterID,
                      vIsFrameMenu: 0,
                    }))}
                  />
                )}
              </div>
            ) : null
          }
        />
        {slideScreen}
      </>
    );
  }

  return (
    <>
      <div className="card card_background">
        <div className="card-header" onClick={onClick}>
          <h4 className="card-title w-100 d-md-flex align-items-center justify-content-between">

            {isBreadcrumb ? (
              <Breadcrumb path={isSlideScreen ? title : ""} />
            ) : (
              <>
                <div className=""><label className="text-nowrap m-0"> {title} </label> </div>
              </>
            )}




            {secondTitle &&
              // secondTitleWide (opt-in): the right side takes all the room after the title, not half the bar
              <div className={`mr-3 d-flex flex-nowrap color-code-search-resp align-items-center  justify-content-start ${!removeSecondHeadAlignClass && "justify-content-md-end"} overflow-auto ${secondTitleWide ? "ml-md-4" : "w-md-50"}  w-100`} style={secondTitleWide ? { flex: "1 1 auto", minWidth: 0 } : undefined}>{ReactSelectPageWise &&
                {/* <div className=" mr-3 w" style={{width:"1%"}}>{ReactSelectPageWise}</div> */ }

              }
                {secondTitle}
              </div>}
            {(list?.length > 0 && isBreadcrumb) &&
              <div className="mr-3">
                <EDPSeeMoreList
                  ModalComponent={ModalComponent}
                  setSeeMore={setSeeMore}
                  data={{}}
                  // isRemoveSvg={true}
                  minWidth="150px"

                  setVisible={() => { setVisible(false) }}
                  handleBindFrameMenu={list?.map((val) => ({
                    "FileName": val?.ChildrenName,
                    "header": true, // TO open any url file compoenent
                    "URL": val?.Url,
                    "breadcrumb": val?.breadcrumb,
                    FrameMenuID: val?.SubScreenFileMasterID,
                    vIsFrameMenu: 0


                  }))}
                />
              </div>
            }

          </h4>
        </div>

      </div>
      {slideScreen}
    </>
  );
}

export default Heading;
