const {
  utils: {
    createSimpleRestModel: { default: createSimpleRestModel },
    request: { getApi, putApi, postApi },
  },
} = platform;

export default {
  namespace: 'vitalSignEvent',
  state: {},
  effects: {

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