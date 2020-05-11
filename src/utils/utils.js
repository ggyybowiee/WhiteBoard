export const isJSON = (str) => {
  if (typeof str == 'string') {
    try {
      const parsed = JSON.parse(str);
      if (typeof parsed == 'object' && parsed) {
        return true;
      } else {
        return false;
      }

    } catch (e) {
      console.log(e);
      return false;
    }
  }
}