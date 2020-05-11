import BlankBox from './../Blank';
import styles from './index.less';

const {
  vendor: {
    react: React,
    antd: { Icon, Spin },
    classnames,
    fp: { find, every },
  },
} = platform;

/**
 * TableList组件，可自定义row
 *
 * @param  {string | object} [title]  标题
 * @param  {object} [columns]  列表头
 * @param  {object} [selected]  选中的项
 * @param  {object} activeProps  选中的项的属性依据
 * @param  {object} [handleClick]  条目点击事件处理函数
 * @param  {string} [type]  list类型table|list两种
 * @param  {object} [rowTheme]  行主题[<string>: dark|light, <string>: cross|'']
 * @param  {object} row  list行
 * @param  {object} [dataSource]  数据源
 * @returns {object} 返回react Component
 */

const getIsSelected = (source, props) => (targets) => {
  return find(target => every(prop => source[prop] === target[prop])(props))(targets);
};

const TableList = ({
  title = '',
  columns = [],
  selected,
  activeProps = '',
  handleClick,
  headerStyle,
  type = 'list',
  rowTheme = ['dark'],
  row,
  loading,
  showColumns,
  contentHeight = 'auto',
  dataSource = [],
  nodataIcon = false,
  nodataIconType = 'waitingList',
}) => {
  const activeProperties = Array.isArray(activeProps) ? activeProps : activeProps.split(',');
  return (
    <Spin spinning={!!loading} wrapperClassName={styles.wrap}>
      {typeof title !== 'string' ? title : <div className={styles.title}>{title}</div>}
      {
        dataSource.length === 0 && !loading && nodataIcon && <BlankBox type={nodataIconType} text="暂无" show="true" />
      }
      {((typeof showColumns === 'undefined' || showColumns) && (columns && columns.length > 0) && dataSource.length !== 0) && <div className={styles.subTitle} style={headerStyle}>
        {
          columns.map(({ value, text, width, textAlign }, index) => (
            <div key={`column-${value}-${index}`} style={{ width: width || 'auto', textAlign }}>{text}</div>
          ))
        }
      </div>
      }
      <div
        className={classnames(styles.list, {
          [styles.cross]: rowTheme[1] === 'cross',
          [styles.light]: rowTheme[0] === 'light' || rowTheme[1] === 'light',
          [styles.cross_1]: rowTheme[0] === 'cross',
          [styles.table]: type === 'table',
        })}
        style={{ height: contentHeight }}
      >
        {
          // dataSource.length === 0 && !loading && <div className={styles.none}><Icon type="neutral" />&nbsp;暂无记录</div>
        }
        {
          dataSource.map((item, index) => {
            if (row) {
              return row({
                key: `row-${index}-group`,
                row: item,
              });
            }

            return (
              <li
                key={`item-${index}`}
                className={classnames(styles.item, {
                  [styles.active]: getIsSelected(item, activeProperties)(selected),
                })}
                onClick={() => handleClick && handleClick(item)}
              >
                {
                  columns.map(({ value, width }, columnIndex) => (
                    <div className={styles.columnItem} key={`${item[value]}-${columnIndex}`} style={{ width: width || 'auto' }}>
                      <div className={styles.value}>{item[value]}</div>
                    </div>
                  ))
                }
              </li>
            );
          })
        }
      </div>
    </Spin>
  );
};

export default TableList;
