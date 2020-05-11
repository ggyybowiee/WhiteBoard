import Earlysense from './routes/Earlysense';
import Infusion from './routes/Infusion';
import Layout from './layout';

export default {
  '/whiteboard/': {
    name: '首页',
    component: ({ children, ...props }) => (
      <Layout {...props}>{children}</Layout>
    ),
    exact: false
  },
};
