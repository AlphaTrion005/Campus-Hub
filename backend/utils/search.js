const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const createSearchRegex = (value) => new RegExp(escapeRegex(value), "i");

module.exports = {
  createSearchRegex,
};
