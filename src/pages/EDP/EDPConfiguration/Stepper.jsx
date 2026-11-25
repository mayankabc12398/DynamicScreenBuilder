import React, { useEffect, useRef, useState } from "react";
import Heading from "../../../components/UI/Heading";
import CustomTooltip from "../../../components/formComponent/CustomTooltip";
import SlideScreen from "../../../components/front-office/SlideScreen";
import SeeMoreSlideScreen from "../../../components/UI/SeeMoreSlideScreen";
import EDPSeeMoreList from "../EDPSeeMoreList";
import { useTranslation } from "react-i18next";

const Stepper = ({ handleClick, steps }) => {
  const [visible, setVisible] = useState(false);
  const [seeMore, setSeeMore] = useState([]);
  const [t]=useTranslation()
  const containerRef = useRef(null);

  // Long step lists scroll sideways; bring the active step into view (e.g. a
  // step opened from the header Menu Search).
  const activeIndex = steps.findIndex((step) => step?.status === "active");
  useEffect(() => {
    containerRef.current?.children[activeIndex]?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex, steps]);
  const [renderComponent, setRenderComponent] = useState({
    name: "",
    component: null,
  });
  const handleChangeComponent = (e) => {
    ModalComponent(e?.label, e?.component);
  };
  const ModalComponent = (name, component) => {
    setVisible(true);
    setRenderComponent({
      name: name,
      component: component,
    });
  };
  //   const steps = [
  //     { title: "Step 1", desc: "Explain your steps ", status: "completed" },
  //     { title: "Step 2", desc: "Explain your steps ", status: "" },
  //     { title: "Step 3", desc: "Explain your steps ", status: "active" },
  //     { title: "Step 4", desc: "Explain your steps ", status: "" },
  //     { title: "Step 5", desc: "Explain your steps ", status: "completed" },
  //     { title: "Step 6", desc: "Explain your steps ", status: "" },
  //     { title: "Step 7", desc: "Explain your steps ", status: "" },
  //     { title: "Step 8", desc: "Explain your steps ", status: "completed" },
  //   ];

  const getColor = (status) => {
    if (status === "completed") return "#20c997";
    // if (status === "skip") return "orange";
    if (status === "active") return "#007bff";
    return "#c2c2c2";
  };

  const hanldeStepIcon = (status) => {
    if (status === "completed") return "✓";
    if (status === "active") return "•••";
    return "⚠️";
  };

  return (
    <>
      {/* <Heading title={"Steps"}/> */}
      <div className="stepper-container mb-1" ref={containerRef}>
        {steps.map((step, index) => (
          <div key={index} className="stepper-item">
            {/* line */}
            {index !== steps.length - 1 && (
              <div
                className="stepper-line"
                style={{ background: getColor(step.status) }}
              />
            )}

            {/* icon */}
            <div
              className="stepper-icon"
              style={{ background: getColor(step.status), cursor: "pointer" }}
              onClick={() => handleClick(step)}
            >
              
              {/* {hanldeStepIcon(step.status)} */}

              {/* {console.log("stepstepstepstep",step)} */}
              {step?.IsAgainstMasterSetup===1?
               <EDPSeeMoreList
                ModalComponent={ModalComponent}
                setSeeMore={setSeeMore}
                data={step}
                isRemoveSvg={true}
                isDoubleclickToggle={true}
                setVisible={() => {
                  setVisible(false);
                }}
                handleBindFrameMenu={[
                  {
                    FileName: "Edp Configuration",
                    URL: "EDPConfiguration",
                    FrameName: "Edp Configuration",
                    Description: "Edp Configuration",
                    header: true,
                  },
                ]}
                openFirstItem={false}
                name={<span> {hanldeStepIcon(step.status)} </span>}
              />
            :hanldeStepIcon(step.status)}

             

              {/* {step.status === "completed" ? "✓" : "⚠️"} */}
            </div>

            {/* <h6 style={{ color: getColor(step.status),marginBottom: "0rem" }}>{step.title}</h6> */}
            <CustomTooltip id={`tooltip_${index}`} content={step?.StepName} />
            <p id={`tooltip_${index}`}>
              {step?.StepName?.length > 14
                ? t(step?.StepName?.slice(0, 14)) + "..."
                : t(step?.StepName)}
            </p>
          </div>
        ))}
      </div>

      <SlideScreen
        visible={visible}
        setVisible={() => {
          setVisible(false);
          setRenderComponent({
            name: null,
            component: null,
          });
        }}
        Header={<></>}
      >
        {renderComponent?.component}
      </SlideScreen>

      <style>{`
    //   .stepper-container{
    //     display:flex;
    //     justify-content:space-between;
    //     position:relative;
    //   }

    //   .stepper-item{
    //     flex:1;
    //     text-align:center;
    //     position:relative;
    //   }
        .stepper-container{
  display:flex;
  justify-content:flex-start;   /* start from left */
  position:relative;
  flex-wrap:nowrap;
  overflow-x:auto;              /* scroll instead of cramming */
  overflow-y:hidden;
  -webkit-overflow-scrolling:touch;
  padding-bottom:6px;
}
.stepper-container::-webkit-scrollbar{
  height:6px;
}
.stepper-container::-webkit-scrollbar-thumb{
  background:#c2c2c2;
  border-radius:3px;
}

.stepper-item{
  flex:1 1 0;                  /* desktop: grow/shrink to fill → minimal scroll */
  min-width:70px;
  text-align:center;
  min-height:3.67rem;
  position:relative;
}

      .stepper-line{
        position:absolute;
        top:15px;
        left:50%;
        width:100%;
        height:4px;
        z-index:0;
      }

      .stepper-icon{
        width:28px;
        height:2.25rem;
        border-radius:10px;
        display:flex;
        align-items:center;
        justify-content:center;
        margin:auto;
        color:white;
        font-weight:bold;
        position:relative;
        z-index:2;
      }

      .stepper-item h6{
        // margin-top:10px;
        font-weight:600;
      }

      .stepper-item p{
        font-size:0.8rem;
        color:#777;
        // margin:0;
        margin-top:2px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        padding:0 4px;
      }

      @media (max-width: 768px){
        .stepper-item{
          flex:0 0 96px;       /* mobile: fixed width → horizontal scroll */
          width:96px;
        }
        .stepper-item p{
          font-size:0.72rem;
        }
      }
      `}</style>
    </>
  );
};

export default Stepper;
