import { CommonAPIGetDateTimeNow } from "../networkServices/finance";
import { useLocalStorage } from "./hooks/useLocalStorage";

(function () {
  let SERVER_OFFSET = 0;
  const OriginalDate = Date;
  async function syncServerTime() {
    try {
      const data = await CommonAPIGetDateTimeNow();
      if (data?.data) {
        useLocalStorage("serverTime", "set", data?.data);
      }
      const serverTime = new OriginalDate(data?.data).getTime();
      const localTime = OriginalDate.now();

      SERVER_OFFSET = serverTime - localTime;
    } catch (err) {
      console.error("❌ Server time sync failed", err);
    }
  }
  function FakeDate(...args) {
    if (args.length === 0) {
      return new OriginalDate(OriginalDate.now() + SERVER_OFFSET);
    }
    return new OriginalDate(...args);
  }

  FakeDate.now = function () {
    return OriginalDate.now() + SERVER_OFFSET;
  };

  FakeDate.parse = OriginalDate.parse;
  FakeDate.UTC = OriginalDate.UTC;
  FakeDate.prototype = OriginalDate.prototype;
  window.Date = FakeDate;
  syncServerTime();
  setInterval(syncServerTime, 5 * 60 * 1000);
})();
