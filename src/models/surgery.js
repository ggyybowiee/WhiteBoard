const {
  utils: {
    createSimpleRestModel: { default: createSimpleRestModel },
    request: { getApi, putApi, postApi },
  },
} = platform;

export default {
  namespace: 'surgery',
  state: {},
  effects: {

    *getSurgeryRecords({ payload }, { call, put }) {
      const response = yield call(getApi, `/emr/surgeryRecords/${payload.wardCode}`, payload.queryParam);

      yield put({
        type: 'updateState',
        payload: {
          surgeryRecords: response,
        },
      });

      return response;
    },

    *getSurgeryRecordCount({ payload }, { call, put }) {
      const response = yield call(getApi, `/emr/surgeryRecordCount/${payload.wardCode}`, payload.queryParam);

      yield put({
        type: 'updateState',
        payload: {
          surgeryRecordCount: response,
        },
      });

      return response;
    },

  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
  },
};