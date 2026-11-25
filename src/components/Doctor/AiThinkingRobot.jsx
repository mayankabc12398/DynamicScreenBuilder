import React from "react";

/**
 * A small 3D robot that sways and bobs while the AI is working - the "thinking" state of the AI
 * Prescription Suggestion popup.
 *
 * Built from CSS 3D boxes (no image, no library, nothing to download): every part is a cube
 * made of six faces, the robot turns slowly from side to side with its eyes blinking, an
 * equalizer mouth, a pulsing antenna and chest light, and a ring that circles it. Colours come
 * from the theme tokens, and under "reduce motion" it stands still facing the front.
 *
 * `message` is what the AI is doing right now; the caller changes it as the work moves on.
 */
const Cube = ({ w, h, d, className = "", children }) => (
  <div className={`air-cube ${className}`} style={{ "--w": `${w}px`, "--h": `${h}px`, "--d": `${d}px` }}>
    <div className="air-f air-f--front">{children}</div>
    <div className="air-f air-f--back" />
    <div className="air-f air-f--right" />
    <div className="air-f air-f--left" />
    <div className="air-f air-f--top" />
    <div className="air-f air-f--bottom" />
  </div>
);

export default function AiThinkingRobot({ message }) {
  return (
    <div className="air" role="status" aria-live="polite">
      <div className="air-stage" aria-hidden="true">
        <div className="air-ring">
          <i /><i /><i />
        </div>
        <div className="air-float">
          <div className="air-bot">
            <div className="air-antenna"><span /></div>
            <div className="air-part air-part--head">
              <Cube w={84} h={70} d={70} className="air-head">
                <div className="air-visor">
                  <span className="air-eye" />
                  <span className="air-eye" />
                  <span className="air-mouth"><i /><i /><i /><i /><i /></span>
                </div>
              </Cube>
            </div>
            <div className="air-part air-part--neck"><Cube w={18} h={12} d={18} className="air-metal" /></div>
            <div className="air-part air-part--body">
              <Cube w={64} h={52} d={44} className="air-body">
                <span className="air-chest" />
              </Cube>
            </div>
            <div className="air-part air-part--armL"><Cube w={16} h={40} d={16} className="air-metal air-arm air-arm--l" /></div>
            <div className="air-part air-part--armR"><Cube w={16} h={40} d={16} className="air-metal air-arm air-arm--r" /></div>
          </div>
        </div>
        <div className="air-shadow" />
      </div>
      <div className="air-text">
        {message}
        <span className="air-dots"><i /><i /><i /></span>
      </div>
    </div>
  );
}
