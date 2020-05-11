const {
  utils: {
    createSimpleRestModel: { default: createSimpleRestModel },
    request: { getApi, putApi, postApi },
  },
} = platform;

export default {
  namespace: 'nursingPlan',
  state: {},
  effects: {

    *getVitalConfig({ payload }, { call, put }) {
      const response = yield call(getApi, '/windranger/Mnis/vitalConfig', payload);

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