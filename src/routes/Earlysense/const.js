export const NURSING_LEVEL = {
  '0': '特',
  '1': '一',
  '2': '二',
  '3': '三',
  'null': '无',
}

export const MOVE_LEVEL = {
  '-1': '--',
  0: '低',
  1: '低',
  2: '中',
  3: '高',
  4: '极高',
};

export function minutesToHour(param) {

  if (param <= 0) {
    return ['00', '00'];
  }

  let hour = parseInt(param / 60);
  let minutes = '' + param - 60 * hour;

  if (hour < 10) {
    hour = '0' + hour;
  } else if (hour > 99) {
    hour = '99';
    minutes = '59';

    return [hour, minutes];

  } else {
    hour = '' + hour;
  }

  if (minutes < 10) {
    minutes = '0' + minutes;
  }

  return [hour, minutes];
};