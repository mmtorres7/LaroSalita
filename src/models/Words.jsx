import raw from "../public/tagalog_dict.json";

const Words = raw.data
  .filter(word => word.length === 5) // only 5 letters
  .map(word => word.toUpperCase());  // make uppercase

export default Words;