// Roughbook names: letters (any language), numbers and single spaces. Nothing else.
export const RB_NAME_MAX = 30; // change this number to change the limit

// cleans what is typed or pasted, as it comes in
export function cleanRbName(raw) {
  return raw
    .replace(/[^\p{L}\p{N} ]/gu, "") // drops every special character
    .replace(/ {2,}/g, " ") // one space at a time
    .replace(/^ /, "") // no space at the start
    .slice(0, RB_NAME_MAX);
}