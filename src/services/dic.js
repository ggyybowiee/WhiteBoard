const { getApi, putApi, postApi } = platform.utils.request;

async function getMedDetails(queryParams) {
  return getApi('/hospital/hosMedicationsCustom', queryParams);
}

async function putMedDetail(data) {
  return putApi('/ldmCloud/deviceTypes', data);
}

async function getLdmCode() {
  return getApi('/ldmCloud/ldmCode');
}

export default {
  getMedDetails,
  putMedDetail,
  getLdmCode,
}