const {
  utils: {
    createSimpleRestModel: { default: createSimpleRestModel },
    request: { getApi, putApi, postApi },
  },
} = platform;

export default {
  namespace: 'bedList',
  state: {},
  effects: {

    *getBedList({ payload }, { call, put }) {
      const response = yield call(getApi, '/emr/whiteBoard/bedList', payload);

      yield put({
        type: 'updateState',
        payload: {
          bedList: response,
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