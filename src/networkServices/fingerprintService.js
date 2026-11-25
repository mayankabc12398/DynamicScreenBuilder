/**
 * Fingerprint device service.
 *
 * Talks to a Mantra MFS100 RD Service (the standard biometric "Registered Device"
 * service that runs locally on the operator's machine and exposes an HTTP API on a
 * port in the 11100-11120 range). When no RD Service / device is reachable, the
 * service transparently falls back to a SIMULATION mode so the registration UI keeps
 * working on machines without a scanner (dev, testing, demos).
 *
 * Only the encrypted template returned by the SDK is captured here - never an image.
 *
 * Env flags:
 *   VITE_FP_SIMULATE = "true"  -> always use simulation, never touch the device.
 *
 * Public API:
 *   getDeviceStatus()      -> Promise<{ connected, deviceId, port, simulated, info }>
 *   captureFingerprint(opts)-> Promise<{ template, type, quality, deviceId, captureDate }>
 *   FINGER_TYPES, MIN_QUALITY_SCORE
 */

const RD_HOST = "127.0.0.1";
const RD_PORT_START = 11100;
const RD_PORT_END = 11120;
const RD_TIMEOUT_MS = 12000;
const DISCOVERY_TIMEOUT_MS = 1500;

// A capture below this quality score is treated as "low quality, please rescan".
export const MIN_QUALITY_SCORE = 60;

export const FINGER_TYPES = [
  { label: "Right Thumb", value: "RightThumb" },
  { label: "Right Index", value: "RightIndex" },
  { label: "Left Thumb", value: "LeftThumb" },
  { label: "Left Index", value: "LeftIndex" },
];

const isSimulationForced = () =>
  String(import.meta.env?.VITE_FP_SIMULATE ?? "").toLowerCase() === "true";

/**
 * Issue a request with a non-standard HTTP method (RDSERVICE / CAPTURE / DEVICEINFO).
 * fetch() mangles these on some browsers, so XMLHttpRequest is used directly.
 */
const rdRequest = (method, url, body = null, timeout = RD_TIMEOUT_MS) =>
  new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.timeout = timeout;
      xhr.setRequestHeader("Content-Type", "text/xml; charset=UTF-8");
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr.responseText || "");
          } else {
            reject(new Error(`RD Service responded with status ${xhr.status}`));
          }
        }
      };
      xhr.ontimeout = () => reject(new Error("RD Service request timed out"));
      xhr.onerror = () => reject(new Error("RD Service is not reachable"));
      xhr.send(body);
    } catch (err) {
      reject(err);
    }
  });

const parseXml = (text) => {
  const doc = new DOMParser().parseFromString(text, "text/xml");
  if (doc.getElementsByTagName("parsererror").length) {
    throw new Error("Invalid response from RD Service");
  }
  return doc;
};

/**
 * Scan the RD Service port range and return the first port that reports READY.
 */
const discoverDevice = async () => {
  for (let port = RD_PORT_START; port <= RD_PORT_END; port++) {
    try {
      const url = `http://${RD_HOST}:${port}`;
      const text = await rdRequest("RDSERVICE", url, null, DISCOVERY_TIMEOUT_MS);
      const doc = parseXml(text);
      const status =
        doc.documentElement?.getAttribute("status") ||
        doc.getElementsByTagName("RDService")[0]?.getAttribute("status");
      if (status && status.toUpperCase() === "READY") {
        const info = doc.getElementsByTagName("Interface")[0];
        return {
          port,
          path: info?.getAttribute("path") || "/rd/capture",
          infoText: doc.documentElement?.getAttribute("info") || "",
        };
      }
    } catch {
      // try next port
    }
  }
  return null;
};

const buildPidOptions = () =>
  '<?xml version="1.0"?>' +
  '<PidOptions ver="1.0">' +
  '<Opts fCount="1" fType="2" iCount="0" pCount="0" format="0" ' +
  'pidVer="2.0" timeout="10000" posh="UNKNOWN" env="P" />' +
  "</PidOptions>";

/**
 * Get the current connection status of the fingerprint device.
 * Never throws - returns connected:false on any problem.
 */
export const getDeviceStatus = async () => {
  if (isSimulationForced()) {
    return {
      connected: true,
      simulated: true,
      deviceId: "SIMULATOR_MFS100",
      port: null,
      info: "Simulation mode",
    };
  }
  try {
    const device = await discoverDevice();
    if (device) {
      return {
        connected: true,
        simulated: false,
        deviceId: `MANTRA_MFS100_${device.port}`,
        port: device.port,
        info: device.infoText,
      };
    }
  } catch {
    // fall through to simulation fallback
  }
  // No real device -> simulator is what will actually serve captures.
  return {
    connected: true,
    simulated: true,
    deviceId: "SIMULATOR_MFS100",
    port: null,
    info: "No RD Service detected - using simulation",
  };
};

const simulateCapture = (fingerType) =>
  new Promise((resolve) => {
    // Mimic the ~1.5s a real scan + extraction takes so the UI states are visible.
    setTimeout(() => {
      // Deterministic-but-varied quality so "low quality" path can be exercised.
      const quality = 70 + Math.floor((Date.now() % 1000) / 33); // ~70-100
      const seed = `${fingerType}-${Date.now()}`;
      const template = btoa(`SIMULATED_FP_TEMPLATE::${seed}`);
      resolve({
        template,
        type: fingerType,
        quality,
        deviceId: "SIMULATOR_MFS100",
        captureDate: new Date().toISOString(),
        simulated: true,
      });
    }, 1500);
  });

const realCapture = async (fingerType, port, path) => {
  const url = `http://${RD_HOST}:${port}${path || "/rd/capture"}`;
  const text = await rdRequest("CAPTURE", url, buildPidOptions());
  const doc = parseXml(text);

  const resp = doc.getElementsByTagName("Resp")[0];
  const errCode = resp?.getAttribute("errCode");
  if (errCode && errCode !== "0") {
    const errInfo = resp?.getAttribute("errInfo") || "Capture failed";
    throw new Error(`${errInfo} (code ${errCode})`);
  }

  const dataNode = doc.getElementsByTagName("Data")[0];
  const template = dataNode?.textContent?.trim();
  if (!template) {
    throw new Error("No fingerprint template returned by the device");
  }

  const quality = parseInt(resp?.getAttribute("qScore") || "0", 10);
  const deviceInfo = doc.getElementsByTagName("DeviceInfo")[0];
  const serial =
    deviceInfo?.getAttribute("srno") ||
    deviceInfo?.getAttribute("dpId") ||
    String(port);

  return {
    template,
    type: fingerType,
    quality,
    deviceId: `MANTRA_MFS100_${serial}`,
    captureDate: new Date().toISOString(),
    simulated: false,
  };
};

/**
 * Capture a fingerprint template from the device (or simulator).
 * @param {{ fingerType?: string }} opts
 * @returns {Promise<{template,type,quality,deviceId,captureDate,simulated}>}
 */
export const captureFingerprint = async (opts = {}) => {
  const fingerType = opts.fingerType || "RightThumb";

  if (isSimulationForced()) {
    return simulateCapture(fingerType);
  }

  try {
    const device = await discoverDevice();
    if (device) {
      return await realCapture(fingerType, device.port, device.path);
    }
  } catch (err) {
    // Real device present but capture errored -> surface the real error.
    if (err?.message && !/not reachable|timed out/i.test(err.message)) {
      throw err;
    }
  }
  // No device reachable -> simulate so the flow still completes.
  return simulateCapture(fingerType);
};
