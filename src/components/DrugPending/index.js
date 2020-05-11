import styles from './index.less';
import TableList from '../TableList';
import InfoBar from '../InfoBar';

const {
  vendor: {
    react: React,
    antd: { Select },
    classnames,
  },
} = platform;

const Option = Select.Option;

// const classnames = require('classnames').bind(styles);

const times = [{
  label: '72小时内',
  value: 72,
}, {
  label: '48小时内',
  value: 48,
}, {
  label: '24小时内',
  value: 24,
}];

const DrugPending = ({ handleTimeClick, children, defaultTime = 72, hideTime, ...props }) => {
  return (
    <div className={classnames(styles.wrap, props.className, { [styles.hide]: props.hide })} data-xxx="xxxx">
      <div className={styles.left}>
        <TableList {...props} contentHeight={props.dataSource && props.dataSource.length > 0 ? window.innerHeight - 260 : 0} />
      </div>
      <div className={styles.right}>
        <div className={styles.header}>
          <InfoBar data={props.selected[0]} />
          {!hideTime && (
            <div className={styles.timeSpan}>
              <Select
                defaultValue={defaultTime}
                onChange={handleTimeClick}
                dropdownClassName={styles.downMenu}
                dropdownMatchSelectWidth={false}
              >
                {times.map(
                  ({ label, value }) => <Option
                    key={value}
                    value={value}
                  >
                    {label}
                  </Option>,
                )}
              </Select>
            </div>
          )}
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DrugPending;
