export const logAttributes = (elementsArray) => {
  const attributesArray = [];
  elementsArray.forEach((element) => {
    const attributes = element.attributes;
    const attributesObject = {};
    Array.from(attributes).forEach((attr) => {
      attributesObject[attr.name] = attr.value;
    });
    attributesArray.push(attributesObject);
  });
  return attributesArray;
};

export const logKeyDown = () => {
  document.addEventListener('keydown', (event) => {
    const info = {
      key: event.key,
      code: event.code,
    };
    console.table(info);
  });
};
