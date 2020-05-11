const {
  utils: {
    createSimpleRestModel: { default: createSimpleRestModel },
    request: { getApi, putApi, postApi },
  },
} = platform;

export default {
  namespace: 'handoverManagement',
  state: {},
  effects: {

    *getWardShiftCounts({ payload }, { call, put }) {
      const response = yield call(getApi, '/emr/wardShiftManagement/count', payload);

      return response;
    },

    *getWardShifts({ payload }, { call, put }) {
      const response = yield call(getApi, '/emr/wardShiftManagement', payload);

      return _.get(response, 'queryResult');
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