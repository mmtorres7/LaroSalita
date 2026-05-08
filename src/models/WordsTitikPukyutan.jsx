import raw from "../public/tagalog_dict.json";

const seen = new Set();

const AllWords = raw.data
  .filter(w =>
    typeof w === "string" &&
    w.length >= 4 &&              // 4+ letters only
    /^[a-zA-Z]+$/.test(w)
  )
  .map(w => w.toUpperCase())
  .filter(w => {
    if (seen.has(w)) return false;
    seen.add(w);
    return true;
  });

export default AllWords;