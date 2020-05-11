import styles from './index.less';

const {
  vendor: {
    react: React,
    antd: { Icon },
    classnames,
    fp: { map, isEmpty },
    moment,
  },
} = platform;

const genderMap = {
  F: '女',
  M: '男',
};

const InfoBar = ({
  data = {},
  keys = ['wardName', 'bedCode', 'patName', 'gender', 'birthDate', 'inhosCode'],
}) => (
  <div className={styles.info}>
    {
      isEmpty(data) && (
        <div className={styles.noPatient}>
          {/* <Icon type="exclamation-circle-o" style={{ color: '#999', marginRight: 6 }} />
          暂无患者！ */}
        </div>
      )
    }
    {
      !isEmpty(data) && map((key) => {
        let finalValue = data[key];

        if (key === 'gender') {
          finalValue = genderMap[finalValue];
        }

        if (key === 'birthDate') {
          finalValue = `${moment().diff(data.birthDate, 'years')}岁`;
        }

        return (
          <span key={key}>{finalValue}</span>
        );
      })(keys)
    }
  </div>
);

export default InfoBar;
