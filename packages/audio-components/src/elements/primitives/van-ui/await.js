import van from '@repo/vanjs-core';

export const Await = ({ value, container = div, Loading, Error }, children) => {
  const data = van.state({ status: 'pending' });
  value
    .then((result) => (data.val = { status: 'fulfilled', value: result }))
    .catch((err) => (data.val = { status: 'rejected', value: err }));
  return container(() =>
    data.val.status === 'pending'
      ? (Loading?.() ?? '')
      : data.val.status === 'rejected'
        ? Error?.(data.val.value)
        : children(data.val.value)
  );
};
