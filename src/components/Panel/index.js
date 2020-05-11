import styles from './index.less';

const {
  vendor: {
    react: React,
    classnames,
  },
} = platform;

const Panel = ({ className, style, title, subTitle, renderRight, ...props }) => (
  <div className={classnames(className, styles.panel)} {...style} {...props} >
    {title && <div className={styles.header}>
      {<div className={styles.title}>{title}</div>}
      {subTitle && <span className={styles.subTitle}>{`（${subTitle}）`}</span>}
      {renderRight && <div className={styles.right}>{renderRight}</div>}
    </div>
    }
    {props.children}
  </div>
);

export default Panel;
