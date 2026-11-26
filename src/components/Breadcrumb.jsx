import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

export default function Breadcrumb({path}) {
  const location = useLocation();
  const { GetMenuList } = useSelector((state) => state?.CommonSlice);
  const [name, setName] = useState('');
  const BreadcrumbName = useSelector((state) => state.Breadcrumb); // this is only for Master Configuration screen path is /edp-configuration

  
  const findChildByUrl = (menuArray, actualUrl) => {
    for (let menu of menuArray) {
      for (let child of menu.children) {
        if (child.actualUrl === actualUrl) {
          return child;
        }
      }
    }
    return null;
  };
  
  useEffect(() => {
    const result = findChildByUrl(GetMenuList, location?.state?.actualUrl);
    // console.log("namename",result)
    setName(result?.breadcrumb)
  }, [GetMenuList?.length,location?.state?.actualUrl])
  return (
    <div className="pb-1 cursor-pointer font-weight-bold ml-1 mt-2 text-nowrap">
      <i className="fa fa-home" aria-hidden="true"></i>
     
      {/* {path?path:name} */}
      {location?.pathname==="/edp-configuration" ? BreadcrumbName?.value : path ? path : name}
    </div>
  );
}
