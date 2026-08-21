const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

function replaceStr(content, startMatch, endMatch, newContent) {
  const startIndex = content.indexOf(startMatch);
  if (startIndex === -1) {
    console.log("Could not find start match");
    return content;
  }
  const endIndex = content.indexOf(endMatch, startIndex);
  if (endIndex === -1) {
    console.log("Could not find end match");
    return content;
  }
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex + endMatch.length);
  return before + newContent + after;
}

const loginStart = "const login = async (identifier: string, password: string, _rememberMe = true): Promise<{ success: boolean; \nmessage?: string }> => {";
// Due to possible formatting differences, let's search for just the beginning part
// "const login = async (identifier: string"
const loginPrefix = "const login = async (identifier: string,";
const loginEnd = "return { success: false, message: 'L?i máy ch?, vui lòng th? l?i.' };\n    };";
// Let's use English markers or something simple.
