function trimEnters(str) {
  return str.replace(/\n/g, '').trim();
}

module.exports = trimEnters;
