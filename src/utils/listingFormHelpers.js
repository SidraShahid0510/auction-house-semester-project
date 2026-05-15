export function parseMediaTextarea(value, title) {
  const trimmed = value.trim();

  if (!trimmed) return [];

  const urls = trimmed
    .split(/[\n,]+/)
    .map((url) => url.trim())
    .filter(Boolean);

  const validUrls = urls.filter((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });

  if (validUrls.length !== urls.length) {
    throw new Error("Please enter valid image URL(s).");
  }

  return validUrls.map((url, index) => ({
    url,
    alt: `${title || "Listing"} image ${index + 1}`,
  }));
}

export function mediaToTextarea(mediaArray) {
  if (!Array.isArray(mediaArray) || mediaArray.length === 0) return "";

  return mediaArray.map((media) => media.url).join("\n");
}

export function buildEndsAt(dateValue, timeValue) {
  if (!dateValue) return null;

  const time = timeValue && timeValue.length ? timeValue : "00:00";
  const localDateTime = new Date(`${dateValue}T${time}`);

  if (Number.isNaN(localDateTime.getTime())) {
    return null;
  }

  return localDateTime.toISOString();
}

export function splitEndsAtToDateTime(endsAt) {
  if (!endsAt) {
    return { date: "", time: "" };
  }

  const dt = new Date(endsAt);

  if (Number.isNaN(dt.getTime())) {
    return { date: "", time: "" };
  }

  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");

  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${min}`,
  };
}
