const request = platform.utils.request.default;

export default function(url, options, autoNotifyError) {
  const newOptions = {
    ...options,
    ...{
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    }
  };
  return request(url, newOptions, autoNotifyError);
}