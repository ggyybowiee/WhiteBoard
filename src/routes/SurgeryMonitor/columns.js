import { STATUSTEXT, STATUSCOLOR } from './const.js';

const {
  vendor: {
    react: React,
    moment,
    lodash: _,
  },
} = platform;

export function todaySurgery(styles) {
  return [
    {
      key: 'bedCode',
      title: '床号',
      dataIndex: 'bedCode',
      align: 'center',
      width: '7%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'patName',
      title: '姓名',
      dataIndex: 'patName',
      align: 'center',
      width: '7%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'diagnosis',
      title: '诊断',
      dataIndex: 'diagnosis',
      align: 'center',
      width: '10%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'surgeryName',
      title: '手术名称',
      dataIndex: 'surgeryName',
      align: 'center',
      width: '19%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'planStartTime',
      title: '手术时间',
      dataIndex: 'planStartTime',
      align: 'center',
      width: '10%',
      render: (text, record) => (
        <span className={styles.surgeryTimeStyle}>
          <span>{moment(text).format('HH:mm')}</span>
          <span>{moment(text).format('YYYY-MM-DD')}</span>
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      align: 'center',
      width: '9%',
      render: (text, record) => (
        <span>
          <span className={styles.dots} style={{ backgroundColor: STATUSCOLOR[text] }}></span> {STATUSTEXT[text]}
        </span>
      ),
    },
    {
      key: 'sendSurgeryDate',
      title: '送手术时间',
      dataIndex: 'sendSurgeryDate',
      align: 'center',
      width: '10%',
      render: (text, record) => (
        <span>
          {text ? (
            <span className={styles.surgeryTimeStyle}>
              <span>{moment(text).format('HH:mm')}</span>
              <span>{moment(text).format('YYYY-MM-DD')}</span>
            </span>
          ) : ''}
        </span>
      ),
    },
    {
      key: 'beforeSuergeryCheck',
      title: '术前核查',
      dataIndex: 'beforeSuergeryCheck',
      align: 'center',
      width: '9%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'backRoomDate',
      title: '回病房时间',
      dataIndex: 'backRoomDate',
      align: 'center',
      width: '10%',
      render: (text, record) => (
        <span>
          {text ? (
            <span className={styles.surgeryTimeStyle}>
              <span>{moment(text).format('HH:mm')}</span>
              <span>{moment(text).format('YYYY-MM-DD')}</span>
            </span>
          ) : ''}
        </span>
      ),
    },
    {
      key: 'afterSuergeryCheck',
      title: '术后核查',
      dataIndex: 'afterSuergeryCheck',
      align: 'center',
      width: '9%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
  ];
}

export function historySurgery(styles) {
  return [
    {
      key: 'bedCode',
      title: '床号',
      dataIndex: 'bedCode',
      align: 'center',
      width: '7%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'patName',
      title: '姓名',
      dataIndex: 'patName',
      align: 'center',
      width: '7%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'diagnosis',
      title: '诊断',
      dataIndex: 'diagnosis',
      align: 'center',
      width: '10%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'surgeryName',
      title: '手术名称',
      dataIndex: 'surgeryName',
      align: 'center',
      width: '19%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'planStartTime',
      title: '手术时间',
      dataIndex: 'planStartTime',
      align: 'center',
      width: '10%',
      render: (text, record) => (
        <span className={styles.surgeryTimeStyle}>
          <span>{moment(text).format('HH:mm')}</span>
          <span>{moment(text).format('YYYY-MM-DD')}</span>
        </span>
      ),
    },
    {
      key: 'sendSurgeryDate',
      title: '送手术时间',
      dataIndex: 'sendSurgeryDate',
      align: 'center',
      width: '10%',
      render: (text, record) => (
        <span>
          {text ? (
            <span className={styles.surgeryTimeStyle}>
              <span>{moment(text).format('HH:mm')}</span>
              <span>{moment(text).format('YYYY-MM-DD')}</span>
            </span>
          ) : ''}
        </span>
      ),
    },
    {
      key: 'beforeSuergeryCheck',
      title: '术前核查',
      dataIndex: 'beforeSuergeryCheck',
      align: 'center',
      width: '9%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'backRoomDate',
      title: '回病房时间',
      dataIndex: 'backRoomDate',
      align: 'center',
      width: '10%',
      render: (text, record) => (
        <span>
          {text ? (
            <span className={styles.surgeryTimeStyle}>
              <span>{moment(text).format('HH:mm')}</span>
              <span>{moment(text).format('YYYY-MM-DD')}</span>
            </span>
          ) : ''}
        </span>
      ),
    },
    {
      key: 'afterSuergeryCheck',
      title: '术后核查',
      dataIndex: 'afterSuergeryCheck',
      align: 'center',
      width: '9%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
  ];
}

export function laterSurgery(styles) {
  return [
    {
      key: 'bedCode',
      title: '床号',
      dataIndex: 'bedCode',
      align: 'center',
      width: '5%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'patName',
      title: '姓名',
      dataIndex: 'patName',
      align: 'center',
      width: '5%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'diagnosis',
      title: '诊断',
      dataIndex: 'diagnosis',
      align: 'center',
      width: '10%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'surgeryName',
      title: '拟手术名称',
      dataIndex: 'surgeryName',
      align: 'center',
      width: '20%',
      render: (text, record) => (
        <span>
          {text}
        </span>
      ),
    },
    {
      key: 'planStartTime',
      title: '手术时间',
      dataIndex: 'planStartTime',
      align: 'center',
      width: '10%',
      render: (text, record) => (
        <span className={styles.surgeryTimeStyle}>
          <span>{moment(text).format('HH:mm')}</span>
          <span>{moment(text).format('YYYY-MM-DD')}</span>
        </span>
      ),
    },
  ];
}
