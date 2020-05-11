const {
  utils: {
    createSimpleRestModel: { default: createSimpleRestModel },
    request: { getApi, putApi, postApi },
  },
} = platform;

export default {
  namespace: 'infusion',
  state: {},
  effects: {
    
    *getInfusionInfo({ payload }, { call, put }) {

      const response = yield call(getApi, '/infusion/nur/infusionmanager/getInfusionManagerInfosOfMins', payload);
      const result = _.get(response, 'data');

      yield put({
        type: 'updateState',
        payload: {
          infusion: result,
        },
      });

      return result;
    },

    *getInfusionConfig({ payload }, { call }) {
      const response = yield call(getApi, '/infusion/nur/infusionmanager/getInfusionSysconfig');
      const result = _.get(response, 'data');

      return result;
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