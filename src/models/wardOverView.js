const {
  utils: {
    createSimpleRestModel: { default: createSimpleRestModel },
    request: { getApi, putApi, postApi },
  },
} = platform;

export default {
  namespace: 'wardoverview',
  state: {},
  effects: {

    *setWardSchedule({ payload }, { call, put }) {
      yield call(postApi, '/emr/wardSchedule', payload);

      return true;
    },

    *setWardNote({ payload }, { call, put }) {
      yield call(postApi, '/emr/wardNote', payload);

      return true;
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